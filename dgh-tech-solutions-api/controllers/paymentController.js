const Stripe          = require('stripe');
const Resource        = require('../models/Resource');
const PurchaseAccess  = require('../models/PurchaseAccess');
const User            = require('../models/User');

// Lazy-init so the module loads without STRIPE_SECRET_KEY set in development
let _stripe;
function getStripe() {
  if (!_stripe) _stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

// ── Create Stripe Checkout Session ────────────────────────────────────────────
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId         = req.user._id;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    if (!resource.isPaid || !resource.price) {
      return res.status(400).json({ success: false, message: 'This resource is free.' });
    }

    // Check if already purchased
    const existing = await PurchaseAccess.findOne({ userId, resourceId, status: 'PAID' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have access to this resource.' });
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency:     'usd',
            unit_amount:  Math.round(resource.price * 100),
            product_data: {
              name:        resource.title,
              description: resource.description.slice(0, 200),
              ...(resource.thumbnailUrl ? { images: [resource.thumbnailUrl] } : {}),
            },
          },
          quantity: 1,
        },
      ],
      mode:        'payment',
      metadata:    { userId: userId.toString(), resourceId: resource._id.toString() },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL}/resources/${resource._id}`,
    });

    res.json({ success: true, data: { url: session.url, sessionId: session.id } });
  } catch (err) { next(err); }
};

// ── Stripe Webhook ────────────────────────────────────────────────────────────
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, resourceId } = session.metadata ?? {};

    if (userId && resourceId && session.payment_status === 'paid') {
      try {
        const resource = await Resource.findById(resourceId);
        if (!resource) { return res.json({ received: true }); }

        // Look up user email for records
        const user = await User.findById(userId).select('email');
        const userEmail = user?.email;

        const baseAccess = {
          status:                'PAID',
          accessType:            'LIFETIME',
          paymentProvider:       'STRIPE',
          stripeSessionId:       session.id,
          stripePaymentIntentId: session.payment_intent,
          amountPaid:            (session.amount_total ?? 0) / 100,
          userEmail,
        };

        // Helper — upsert a single access record idempotently
        const grantAccess = (uid, rid, purchaseType, sourceId) =>
          PurchaseAccess.findOneAndUpdate(
            { userId: uid, resourceId: rid },
            { ...baseAccess, sourcePurchaseType: purchaseType, sourceResourceId: sourceId },
            { upsert: true, new: true }
          );

        if (resource.type === 'BUNDLE') {
          // Grant access to the bundle container itself
          await grantAccess(userId, resourceId, 'BUNDLE', resourceId);
          // Grant access to each resource included in the bundle
          for (const includedId of (resource.includedResourceIds ?? [])) {
            await grantAccess(userId, includedId.toString(), 'BUNDLE', resourceId);
          }
        } else {
          // Single resource purchase
          await grantAccess(userId, resourceId, 'SINGLE_RESOURCE', resourceId);
        }
      } catch (err) {
        console.error('Webhook DB error:', err);
      }
    }
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    if (charge.payment_intent) {
      await PurchaseAccess.findOneAndUpdate(
        { stripePaymentIntentId: charge.payment_intent },
        { status: 'REFUNDED' }
      );
    }
  }

  res.json({ received: true });
};

// ── My Library ────────────────────────────────────────────────────────────────
exports.getMyLibrary = async (req, res, next) => {
  try {
    const records = await PurchaseAccess.find({ userId: req.user._id, status: 'PAID' })
      .populate('resourceId')
      .populate('sourceResourceId', 'title type')
      .sort({ createdAt: -1 });

    const toItem = (p) => ({
      resource:           p.resourceId,
      sourcePurchaseType: p.sourcePurchaseType || 'SINGLE_RESOURCE',
      sourceResourceId:   p.sourceResourceId?._id ?? p.resourceId._id,
      bundleName:         p.sourcePurchaseType === 'BUNDLE' ? (p.sourceResourceId?.title ?? null) : null,
      accessType:         p.accessType || 'LIFETIME',
    });

    const valid     = records.filter((p) => p.resourceId);
    const purchased = valid.filter((p) => p.accessType !== 'SAVED_FREE').map(toItem);
    const savedFree = valid.filter((p) => p.accessType === 'SAVED_FREE').map(toItem);

    res.json({ success: true, data: { purchased, savedFree } });
  } catch (err) { next(err); }
};

// ── Save Free Resource ────────────────────────────────────────────────────────
exports.saveResource = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId         = req.user._id;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    if (resource.isPaid) {
      return res.status(400).json({ success: false, message: 'This resource requires purchase.' });
    }

    const user = await User.findById(userId).select('email');

    // Upsert: insert if not exists; leave untouched if already purchased (LIFETIME)
    await PurchaseAccess.findOneAndUpdate(
      { userId, resourceId },
      {
        $setOnInsert: {
          userEmail:          user?.email,
          status:             'PAID',
          accessType:         'SAVED_FREE',
          amountPaid:         0,
          sourcePurchaseType: 'SINGLE_RESOURCE',
          sourceResourceId:   resourceId,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Resource saved to library.' });
  } catch (err) { next(err); }
};

// ── Unsave Free Resource ──────────────────────────────────────────────────────
exports.unsaveResource = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId         = req.user._id;

    const deleted = await PurchaseAccess.findOneAndDelete({
      userId,
      resourceId,
      accessType: 'SAVED_FREE',
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Saved resource not found.' });
    }

    res.json({ success: true, message: 'Resource removed from library.' });
  } catch (err) { next(err); }
};

// ── Check Access ──────────────────────────────────────────────────────────────
exports.checkAccess = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId         = req.user._id;

    const purchase = await PurchaseAccess.findOne({ userId, resourceId, status: 'PAID' });
    res.json({ success: true, data: { hasAccess: !!purchase } });
  } catch (err) { next(err); }
};

// ── Verify Session (called from payment-success page) ────────────────────────
exports.verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await getStripe().checkout.sessions.retrieve(sessionId);

    const purchase = await PurchaseAccess.findOne({
      stripeSessionId: sessionId,
      status:          'PAID',
    }).populate('resourceId');

    res.json({
      success: true,
      data: {
        paid:     session.payment_status === 'paid',
        resource: purchase?.resourceId ?? null,
      },
    });
  } catch (err) { next(err); }
};
