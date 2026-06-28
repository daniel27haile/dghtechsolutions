const Cart          = require('../models/Cart');
const Resource      = require('../models/Resource');
const PurchaseAccess = require('../models/PurchaseAccess');

// ── Helper: build cart response ────────────────────────────────────────────────
const cartResponse = (cart) => {
  const subtotal = cart.items.reduce((sum, i) => sum + i.price, 0);
  const discount = cart.couponDiscount ?? 0;
  const total    = Math.max(0, subtotal - discount);
  return {
    items:          cart.items,
    couponCode:     cart.couponCode || null,
    couponDiscount: discount,
    subtotal:       +subtotal.toFixed(2),
    total:          +total.toFixed(2),
    itemCount:      cart.items.length,
  };
};

// ── GET /api/cart ──────────────────────────────────────────────────────────────
exports.getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.json({ success: true, data: cartResponse({ items: [], couponDiscount: 0 }) });
    res.json({ success: true, data: cartResponse(cart) });
  } catch (err) { next(err); }
};

// ── POST /api/cart/items — add a resource to cart ────────────────────────────
exports.addItem = async (req, res, next) => {
  try {
    const { resourceId } = req.body;
    const userId = req.user._id;

    const resource = await Resource.findById(resourceId);
    if (!resource || !resource.isPublished) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    if (!resource.isPaid) {
      return res.status(400).json({ success: false, message: 'Free resources do not go through the cart.' });
    }

    // Already purchased?
    const owned = await PurchaseAccess.findOne({ userId, resourceId, status: 'PAID' });
    if (owned) {
      return res.status(409).json({ success: false, message: 'You already own this resource.' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    const alreadyInCart = cart.items.some(i => i.resourceId.toString() === resourceId);
    if (alreadyInCart) {
      return res.status(409).json({ success: false, message: 'Already in cart.' });
    }

    const salePrice = resource.pricing?.salePrice ?? resource.price ?? 0;
    cart.items.push({
      resourceId:   resource._id,
      title:        resource.title,
      thumbnailUrl: resource.thumbnailUrl || '',
      price:        salePrice,
      oldPrice:     resource.pricing?.oldPrice ?? 0,
      discountPct:  resource.pricing?.discountPercent ?? 0,
    });

    // Clear coupon when cart changes
    cart.couponId       = null;
    cart.couponCode     = '';
    cart.couponDiscount = 0;

    await cart.save();
    res.status(201).json({ success: true, data: cartResponse(cart) });
  } catch (err) { next(err); }
};

// ── DELETE /api/cart/items/:resourceId — remove from cart ────────────────────
exports.removeItem = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });

    const before = cart.items.length;
    cart.items = cart.items.filter(i => i.resourceId.toString() !== resourceId);
    if (cart.items.length === before) {
      return res.status(404).json({ success: false, message: 'Item not in cart.' });
    }

    // Clear coupon if cart changed
    cart.couponId       = null;
    cart.couponCode     = '';
    cart.couponDiscount = 0;

    await cart.save();
    res.json({ success: true, data: cartResponse(cart) });
  } catch (err) { next(err); }
};

// ── DELETE /api/cart — clear entire cart ─────────────────────────────────────
exports.clearCart = async (req, res, next) => {
  try {
    await Cart.deleteOne({ userId: req.user._id });
    res.json({ success: true, data: cartResponse({ items: [], couponDiscount: 0 }) });
  } catch (err) { next(err); }
};

// ── POST /api/cart/coupon — apply coupon ──────────────────────────────────────
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId   = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
    if (!coupon) {
      return res.status(400).json({ success: false, message: 'Invalid coupon code.' });
    }

    const now = new Date();
    if (coupon.expiresAt && coupon.expiresAt < now) {
      return res.status(400).json({ success: false, message: 'This coupon has expired.' });
    }
    if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
      return res.status(400).json({ success: false, message: 'This coupon has reached its redemption limit.' });
    }
    if (coupon.oneTimePerUser && coupon.usedByUserIds.some(id => id.toString() === userId.toString())) {
      return res.status(400).json({ success: false, message: 'You have already used this coupon.' });
    }

    const subtotal = cart.items.reduce((s, i) => s + i.price, 0);
    if (subtotal < coupon.minimumCartAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum cart amount of $${coupon.minimumCartAmount.toFixed(2)} required.`,
      });
    }

    // Scope check
    if (coupon.scope === 'course') {
      const cartIds = cart.items.map(i => i.resourceId.toString());
      const valid   = coupon.courseIds.map(id => id.toString());
      const applicable = cartIds.some(id => valid.includes(id));
      if (!applicable) {
        return res.status(400).json({ success: false, message: 'This coupon is not valid for the courses in your cart.' });
      }
    }
    if (coupon.scope === 'publisher') {
      const Resource = require('../models/Resource');
      const cartIds  = cart.items.map(i => i.resourceId.toString());
      const owned    = await Resource.find({ _id: { $in: cartIds }, ownerId: coupon.publisherId });
      if (owned.length === 0) {
        return res.status(400).json({ success: false, message: 'This coupon is not valid for the courses in your cart.' });
      }
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = subtotal * (coupon.discountValue / 100);
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }
    discount = Math.max(0, +discount.toFixed(2));

    cart.couponId       = coupon._id;
    cart.couponCode     = coupon.code;
    cart.couponDiscount = discount;
    await cart.save();

    res.json({ success: true, data: cartResponse(cart) });
  } catch (err) { next(err); }
};

// ── DELETE /api/cart/coupon — remove coupon ────────────────────────────────────
exports.removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });
    cart.couponId       = null;
    cart.couponCode     = '';
    cart.couponDiscount = 0;
    await cart.save();
    res.json({ success: true, data: cartResponse(cart) });
  } catch (err) { next(err); }
};
