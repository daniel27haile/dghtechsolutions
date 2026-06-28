const { v4: uuidv4 } = require('uuid');
const Cart          = require('../models/Cart');
const Resource      = require('../models/Resource');
const Order         = require('../models/Order');
const PurchaseAccess = require('../models/PurchaseAccess');
const Coupon        = require('../models/Coupon');
const SiteSettings  = require('../models/SiteSettings');
const User          = require('../models/User');

// Lazy-init Square client to avoid crash when env vars missing
let _squareClient;
function getSquare() {
  if (!_squareClient) {
    const { Client, Environment } = require('square');
    _squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production'
        ? Environment.Production
        : Environment.Sandbox,
    });
  }
  return _squareClient;
}

// ── POST /api/square/checkout — create Square payment link from cart ──────────
exports.createCheckout = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    // Fetch platform fee from settings
    const settings = await SiteSettings.findOne({}).select('platformFeePercent');
    const platformFeeRate = settings?.platformFeePercent ?? 20;

    // Validate resources from DB — never trust client-side prices
    const resourceIds = cart.items.map(i => i.resourceId);
    const resources   = await Resource.find({ _id: { $in: resourceIds }, isPublished: true });
    const resourceMap = Object.fromEntries(resources.map(r => [r._id.toString(), r]));

    const validatedItems = [];
    for (const item of cart.items) {
      const resource = resourceMap[item.resourceId.toString()];
      if (!resource) {
        return res.status(400).json({ success: false, message: `Resource "${item.title}" is no longer available.` });
      }
      if (!resource.isPaid) {
        return res.status(400).json({ success: false, message: `"${resource.title}" is free and cannot be purchased.` });
      }
      // Check already purchased
      const owned = await PurchaseAccess.findOne({ userId, resourceId: resource._id, status: 'PAID' });
      if (owned) {
        return res.status(409).json({ success: false, message: `You already own "${resource.title}".` });
      }
      const price = resource.pricing?.salePrice ?? resource.price ?? 0;
      validatedItems.push({ resource, price });
    }

    // Calculate totals
    const grossAmount = +validatedItems.reduce((s, i) => s + i.price, 0).toFixed(2);

    // Apply coupon discount (validated in DB)
    let discountAmount = 0;
    let couponId       = null;
    let couponCode     = '';
    if (cart.couponId) {
      const coupon = await Coupon.findById(cart.couponId);
      if (coupon && coupon.active && (!coupon.expiresAt || coupon.expiresAt > new Date())) {
        if (coupon.discountType === 'percentage') {
          discountAmount = +(grossAmount * (coupon.discountValue / 100)).toFixed(2);
        } else {
          discountAmount = Math.min(coupon.discountValue, grossAmount);
        }
        couponId   = coupon._id;
        couponCode = coupon.code;
      }
    }

    const finalAmount = Math.max(0, +(grossAmount - discountAmount).toFixed(2));

    if (finalAmount === 0) {
      // Handle fully-discounted cart — grant free access
      const user = await User.findById(userId).select('email');
      const orderItems = validatedItems.map(({ resource }) => {
        const feeAmt = 0;
        return {
          resourceId:         resource._id,
          ownerId:            resource.ownerId ?? null,
          title:              resource.title,
          priceAtPurchase:    resource.pricing?.salePrice ?? resource.price ?? 0,
          discountAtPurchase: discountAmount / validatedItems.length,
          platformFeeRate,
          platformFeeAmount:  feeAmt,
          publisherNetAmount: 0,
        };
      });
      const order = await Order.create({
        userId, userEmail: user?.email ?? '',
        items: orderItems, couponId, couponCode,
        grossAmount, discountAmount, finalAmount: 0,
        paymentStatus: 'PAID', paymentProvider: 'SQUARE',
        paidAt: new Date(),
      });
      for (const { resource } of validatedItems) {
        await grantResourceAccess(userId, resource, 'SQUARE', 'free-coupon-' + order._id, user?.email);
      }
      if (couponId) await Coupon.findByIdAndUpdate(couponId, { $inc: { redemptionCount: 1 }, $addToSet: { usedByUserIds: userId } });
      await Cart.deleteOne({ userId });
      return res.json({ success: true, data: { free: true, orderId: order._id } });
    }

    // Create Square payment link
    const idempotencyKey = uuidv4();
    const lineItems = validatedItems.map(({ resource }) => {
      const price = resource.pricing?.salePrice ?? resource.price ?? 0;
      return {
        name:             resource.title,
        quantity:         '1',
        basePriceMoney:   { amount: BigInt(Math.round(price * 100)), currency: 'USD' },
      };
    });

    const squareClient = getSquare();
    const response = await squareClient.checkoutApi.createPaymentLink({
      idempotencyKey,
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems,
        metadata: {
          userId:       userId.toString(),
          couponId:     couponId ? couponId.toString() : '',
          couponCode,
          discountAmount: discountAmount.toString(),
          idempotencyKey,
        },
      },
      checkoutOptions: {
        redirectUrl: `${process.env.FRONTEND_URL}/payment-success?provider=square`,
        askForShippingAddress: false,
      },
    });

    const paymentLink = response.result.paymentLink;

    // Create pending order record
    const user = await User.findById(userId).select('email');
    const orderItems = validatedItems.map(({ resource, price }) => {
      const feeAmt = +(price * platformFeeRate / 100).toFixed(2);
      return {
        resourceId:         resource._id,
        ownerId:            resource.ownerId ?? null,
        title:              resource.title,
        priceAtPurchase:    price,
        discountAtPurchase: discountAmount > 0 ? +(discountAmount / validatedItems.length).toFixed(2) : 0,
        platformFeeRate,
        platformFeeAmount:  feeAmt,
        publisherNetAmount: +(price - feeAmt).toFixed(2),
      };
    });

    await Order.create({
      userId, userEmail: user?.email ?? '',
      items: orderItems, couponId, couponCode,
      grossAmount, discountAmount, finalAmount,
      paymentStatus: 'PENDING', paymentProvider: 'SQUARE',
      squareOrderId: paymentLink.orderId ?? '',
      idempotencyKey,
    });

    res.json({ success: true, data: { url: paymentLink.url, orderId: paymentLink.orderId } });
  } catch (err) { next(err); }
};

// ── POST /api/square/webhook — Square webhook ─────────────────────────────────
exports.squareWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.type === 'payment.completed' || event.type === 'order.fulfillment.updated') {
      const squareOrderId = event.data?.object?.payment?.orderId
        ?? event.data?.object?.order?.id;

      if (!squareOrderId) return res.json({ received: true });

      const order = await Order.findOne({ squareOrderId, paymentStatus: 'PENDING' });
      if (!order) return res.json({ received: true });

      // Mark order as paid
      order.paymentStatus  = 'PAID';
      order.squarePaymentId = event.data?.object?.payment?.id ?? '';
      order.paidAt          = new Date();
      await order.save();

      // Grant access to all purchased resources
      const user = await User.findById(order.userId).select('email');
      for (const item of order.items) {
        const resource = await Resource.findById(item.resourceId);
        if (!resource) continue;
        await grantResourceAccess(
          order.userId, resource, 'SQUARE',
          order.squarePaymentId, user?.email ?? order.userEmail
        );
      }

      // Update coupon redemption
      if (order.couponId) {
        await Coupon.findByIdAndUpdate(order.couponId, {
          $inc: { redemptionCount: 1 },
          $addToSet: { usedByUserIds: order.userId },
        });
      }

      // Clear cart
      await Cart.deleteOne({ userId: order.userId });
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Square webhook error:', err);
    res.json({ received: true }); // Always 200 to Square
  }
};

// ── GET /api/square/config — return public Square credentials ─────────────────
exports.getConfig = (_req, res) => {
  res.json({
    success: true,
    data: {
      applicationId: process.env.SQUARE_APPLICATION_ID,
      locationId:    process.env.SQUARE_LOCATION_ID,
      environment:   process.env.SQUARE_ENVIRONMENT || 'sandbox',
    },
  });
};

// ── Helper: grant access to resource (and bundle items) ───────────────────────
async function grantResourceAccess(userId, resource, provider, paymentId, userEmail) {
  const base = {
    status:          'PAID',
    accessType:      'LIFETIME',
    paymentProvider: provider,
    amountPaid:      resource.pricing?.salePrice ?? resource.price ?? 0,
    userEmail:       userEmail ?? '',
  };

  const upsert = (uid, rid, type, srcId) =>
    PurchaseAccess.findOneAndUpdate(
      { userId: uid, resourceId: rid },
      { ...base, sourcePurchaseType: type, sourceResourceId: srcId },
      { upsert: true, new: true }
    );

  if (resource.type === 'BUNDLE') {
    await upsert(userId, resource._id, 'BUNDLE', resource._id);
    for (const includedId of resource.includedResourceIds ?? []) {
      await upsert(userId, includedId.toString(), 'BUNDLE', resource._id);
    }
  } else {
    await upsert(userId, resource._id, 'SINGLE_RESOURCE', resource._id);
  }
}
