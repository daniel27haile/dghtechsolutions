const Stripe         = require('stripe');
const Resource       = require('../models/Resource');
const PurchaseAccess = require('../models/PurchaseAccess');
const User           = require('../models/User');
const Cart           = require('../models/Cart');
const Order          = require('../models/Order');

// Lazy-init so the module loads without STRIPE_SECRET_KEY set in development
let _stripe;
function getStripe() {
  if (!_stripe) _stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  return _stripe;
}

// ── Helper: get platform fee rate from settings ──────────────────────────────
async function getPlatformFeeRate() {
  try {
    const SiteSettings = require('../models/SiteSettings');
    const s = await SiteSettings.findOne({}).select('platformFeePercent');
    return s?.platformFeePercent ?? 20;
  } catch {
    return 20;
  }
}

// ── Helper: upsert PurchaseAccess (idempotent) ───────────────────────────────
async function grantResourceAccess(userId, resource, stripeSessionId, stripePaymentIntentId, amountPaid, userEmail) {
  const base = {
    status:                'PAID',
    accessType:            'LIFETIME',
    paymentProvider:       'STRIPE',
    stripeSessionId:       stripeSessionId ?? '',
    stripePaymentIntentId: stripePaymentIntentId ?? '',
    amountPaid:            amountPaid ?? 0,
    userEmail:             userEmail ?? '',
  };

  const upsert = (uid, rid, purchaseType, sourceId) =>
    PurchaseAccess.findOneAndUpdate(
      { userId: uid, resourceId: rid },
      { ...base, sourcePurchaseType: purchaseType, sourceResourceId: sourceId },
      { upsert: true, new: true }
    );

  if (resource.type === 'BUNDLE') {
    await upsert(userId, resource._id, 'BUNDLE', resource._id);
    for (const includedId of (resource.includedResourceIds ?? [])) {
      await upsert(userId, includedId.toString(), 'BUNDLE', resource._id);
    }
  } else {
    await upsert(userId, resource._id, 'SINGLE_RESOURCE', resource._id);
  }
}

// ── Single resource Stripe Checkout Session ───────────────────────────────────
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId         = req.user._id;

    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.isPublished) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    if (!resource.isPaid || !resource.price) {
      return res.status(400).json({ success: false, message: 'This resource is free.' });
    }

    const existing = await PurchaseAccess.findOne({ userId, resourceId, status: 'PAID', accessType: { $ne: 'SAVED_FREE' } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You already have access to this resource.' });
    }

    const price = resource.pricing?.salePrice ?? resource.price;

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency:     'usd',
          unit_amount:  Math.round(price * 100),
          product_data: {
            name:        resource.title,
            description: (resource.description || '').slice(0, 200),
            ...(resource.thumbnailUrl ? { images: [resource.thumbnailUrl] } : {}),
          },
        },
        quantity: 1,
      }],
      mode:        'payment',
      metadata:    { type: 'single', userId: userId.toString(), resourceId: resource._id.toString() },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL}/resources/${resource._id}`,
    });

    res.json({ success: true, data: { url: session.url, sessionId: session.id } });
  } catch (err) { next(err); }
};

// ── Cart Stripe Checkout Session ──────────────────────────────────────────────
exports.createCartCheckoutSession = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Load cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    // 2. Re-validate all resources from DB (never trust cart-stored prices)
    const resourceIds = cart.items.map(i => i.resourceId);
    const resources   = await Resource.find({ _id: { $in: resourceIds }, isPublished: true, isPaid: true });

    if (resources.length !== cart.items.length) {
      return res.status(400).json({ success: false, message: 'One or more resources in your cart are no longer available.' });
    }

    // 3. Check for already-owned items
    const alreadyOwned = await PurchaseAccess.find({
      userId,
      resourceId: { $in: resourceIds },
      status:     'PAID',
      accessType: { $ne: 'SAVED_FREE' },
    });
    if (alreadyOwned.length > 0) {
      const owned = resources.find(r => r._id.toString() === alreadyOwned[0].resourceId.toString());
      return res.status(409).json({
        success: false,
        message: `You already own "${owned?.title ?? 'a resource in your cart'}". Please remove it and try again.`,
      });
    }

    // 4. Get platform fee
    const platformFeeRate = await getPlatformFeeRate();

    // 5. Validate coupon (re-check from DB)
    let coupon         = null;
    let discountAmount = 0;
    const grossAmount  = +resources.reduce((s, r) => s + (r.pricing?.salePrice ?? r.price ?? 0), 0).toFixed(2);

    if (cart.couponId) {
      const Coupon = require('../models/Coupon');
      const c = await Coupon.findById(cart.couponId);
      if (c && c.active && (!c.expiresAt || c.expiresAt > new Date())) {
        coupon = c;
        if (c.discountType === 'percentage') {
          discountAmount = +(grossAmount * (c.discountValue / 100)).toFixed(2);
        } else {
          discountAmount = +Math.min(c.discountValue, grossAmount).toFixed(2);
        }
      }
    }

    const finalAmount = Math.max(0, +(grossAmount - discountAmount).toFixed(2));

    // 6. Build order items (fee calculations from DB prices)
    const numItems   = resources.length;
    const perItemDiscount = numItems > 0 ? +(discountAmount / numItems).toFixed(2) : 0;

    const orderItems = resources.map(resource => {
      const price    = resource.pricing?.salePrice ?? resource.price ?? 0;
      const netPrice = Math.max(0, price - perItemDiscount);
      const feeAmt   = +(netPrice * platformFeeRate / 100).toFixed(2);
      return {
        resourceId:          resource._id,
        ownerId:             resource.ownerId ?? null,
        title:               resource.title,
        priceAtPurchase:     price,
        discountAtPurchase:  perItemDiscount,
        platformFeeRate,
        platformFeeAmount:   feeAmt,
        publisherNetAmount:  +(netPrice - feeAmt).toFixed(2),
      };
    });

    const user = await User.findById(userId).select('email');

    // 7. Handle fully-discounted cart (coupon covers 100%)
    if (finalAmount === 0) {
      const order = await Order.create({
        userId,
        userEmail:       user?.email ?? '',
        items:           orderItems,
        couponId:        coupon?._id ?? null,
        couponCode:      coupon?.code ?? '',
        grossAmount,
        discountAmount,
        finalAmount:     0,
        paymentStatus:   'PAID',
        paymentProvider: 'STRIPE',
        paidAt:          new Date(),
      });

      for (const resource of resources) {
        await grantResourceAccess(userId, resource, `free-coupon-${order._id}`, null, 0, user?.email);
      }

      if (coupon) {
        const Coupon = require('../models/Coupon');
        await Coupon.findByIdAndUpdate(coupon._id, {
          $inc: { redemptionCount: 1 },
          $addToSet: { usedByUserIds: userId },
        });
      }

      await Cart.deleteOne({ userId });
      return res.json({ success: true, data: { free: true } });
    }

    // 8. Create Stripe Checkout Session
    const lineItems = resources.map(resource => {
      const price = resource.pricing?.salePrice ?? resource.price ?? 0;
      return {
        price_data: {
          currency:     'usd',
          unit_amount:  Math.round(price * 100),
          product_data: {
            name:        resource.title,
            description: (resource.description || '').slice(0, 200),
            ...(resource.thumbnailUrl ? { images: [resource.thumbnailUrl] } : {}),
          },
        },
        quantity: 1,
      };
    });

    // Apply coupon as a Stripe discount if applicable
    let sessionDiscounts = [];
    if (discountAmount > 0 && coupon) {
      const stripeCoupon = await getStripe().coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency:   'usd',
        duration:   'once',
        name:       `Coupon: ${coupon.code}`,
      });
      sessionDiscounts = [{ coupon: stripeCoupon.id }];
    }

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items:           lineItems,
      ...(sessionDiscounts.length > 0 ? { discounts: sessionDiscounts } : {}),
      mode:     'payment',
      metadata: {
        type:   'cart',
        userId: userId.toString(),
        // couponId for redemption tracking in webhook
        couponId:   coupon?._id?.toString() ?? '',
        couponCode: coupon?.code ?? '',
      },
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL}/resources`,
    });

    // 9. Create PENDING Order now that we have the session ID
    await Order.create({
      userId,
      userEmail:       user?.email ?? '',
      items:           orderItems,
      couponId:        coupon?._id ?? null,
      couponCode:      coupon?.code ?? '',
      grossAmount,
      discountAmount,
      finalAmount,
      paymentStatus:   'PENDING',
      paymentProvider: 'STRIPE',
      stripeSessionId: session.id,
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

  // ── checkout.session.completed ─────────────────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    if (session.payment_status !== 'paid') return res.json({ received: true });

    const { type, userId, resourceId, couponId, couponCode } = session.metadata ?? {};

    try {
      const user      = await User.findById(userId).select('email');
      const userEmail = user?.email ?? '';

      if (type === 'cart') {
        // ── Cart checkout ────────────────────────────────────────────────────
        const order = await Order.findOne({ stripeSessionId: session.id });

        if (!order) {
          console.error(`Webhook: no pending Order found for session ${session.id}`);
          return res.json({ received: true });
        }

        // Idempotency — skip if already processed
        if (order.paymentStatus === 'PAID') return res.json({ received: true });

        // Grant access to every item in the order
        const resources = await Resource.find({ _id: { $in: order.items.map(i => i.resourceId) } });
        const resourceMap = Object.fromEntries(resources.map(r => [r._id.toString(), r]));

        for (const item of order.items) {
          const resource = resourceMap[item.resourceId.toString()];
          if (!resource) continue;
          await grantResourceAccess(
            order.userId, resource,
            session.id, session.payment_intent,
            item.priceAtPurchase - item.discountAtPurchase,
            userEmail,
          );
        }

        // Mark Order PAID
        order.paymentStatus         = 'PAID';
        order.stripePaymentIntentId = session.payment_intent ?? '';
        order.paidAt                = new Date();
        await order.save();

        // Update coupon redemption
        if (couponId) {
          const Coupon = require('../models/Coupon');
          await Coupon.findByIdAndUpdate(couponId, {
            $inc: { redemptionCount: 1 },
            $addToSet: { usedByUserIds: order.userId },
          });
        }

        // Clear cart
        await Cart.deleteOne({ userId: order.userId });

      } else {
        // ── Single resource checkout ─────────────────────────────────────────
        if (!userId || !resourceId) return res.json({ received: true });

        const resource = await Resource.findById(resourceId);
        if (!resource) return res.json({ received: true });

        const price           = resource.pricing?.salePrice ?? resource.price ?? 0;
        const platformFeeRate = await getPlatformFeeRate();
        const feeAmt          = +(price * platformFeeRate / 100).toFixed(2);

        await grantResourceAccess(
          userId, resource,
          session.id, session.payment_intent,
          (session.amount_total ?? 0) / 100,
          userEmail,
        );

        // Create Order for publisher payouts (idempotent via stripeSessionId)
        await Order.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            $setOnInsert: {
              userId,
              userEmail,
              items: [{
                resourceId:         resource._id,
                ownerId:            resource.ownerId ?? null,
                title:              resource.title,
                priceAtPurchase:    price,
                discountAtPurchase: 0,
                platformFeeRate,
                platformFeeAmount:  feeAmt,
                publisherNetAmount: +(price - feeAmt).toFixed(2),
              }],
              grossAmount:         price,
              discountAmount:      0,
              finalAmount:         (session.amount_total ?? 0) / 100,
              paymentStatus:       'PAID',
              paymentProvider:     'STRIPE',
              stripeSessionId:     session.id,
              stripePaymentIntentId: session.payment_intent ?? '',
              paidAt:              new Date(),
            },
          },
          { upsert: true }
        );
      }
    } catch (err) {
      console.error('Webhook processing error:', err.message);
    }
  }

  // ── charge.refunded ────────────────────────────────────────────────────────
  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    if (charge.payment_intent) {
      try {
        await PurchaseAccess.updateMany(
          { stripePaymentIntentId: charge.payment_intent },
          { status: 'REFUNDED' }
        );
        await Order.findOneAndUpdate(
          { stripePaymentIntentId: charge.payment_intent },
          { paymentStatus: 'REFUNDED' }
        );
      } catch (err) {
        console.error('Refund webhook error:', err.message);
      }
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
    const userId        = req.user._id;

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    const isPaid  = session.payment_status === 'paid';
    const isCart  = session.metadata?.type === 'cart';

    if (isCart) {
      // Look up the Order to get all purchased resources
      const order = await Order.findOne({ stripeSessionId: sessionId, userId });
      let resources = [];
      if (order && order.paymentStatus === 'PAID') {
        resources = await Resource.find({ _id: { $in: order.items.map(i => i.resourceId) } });
      }
      return res.json({
        success: true,
        data: {
          paid:          isPaid,
          isCart:        true,
          resource:      null,
          resources,
          resourceCount: resources.length,
        },
      });
    }

    // Single resource purchase
    const purchase = await PurchaseAccess.findOne({
      stripeSessionId: sessionId,
      status:          'PAID',
      userId,
    }).populate('resourceId');

    return res.json({
      success: true,
      data: {
        paid:          isPaid,
        isCart:        false,
        resource:      purchase?.resourceId ?? null,
        resources:     [],
        resourceCount: purchase?.resourceId ? 1 : 0,
      },
    });
  } catch (err) { next(err); }
};
