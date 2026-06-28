const Coupon    = require('../models/Coupon');
const { isAdmin } = require('../middleware/auth');

// ── GET /api/coupons — admin: all; publisher: own ────────────────────────────
exports.getCoupons = async (req, res, next) => {
  try {
    const filter = isAdmin(req.admin) ? {} : { publisherId: req.admin._id };
    const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: coupons.length, data: coupons });
  } catch (err) { next(err); }
};

// ── POST /api/coupons ─────────────────────────────────────────────────────────
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code, discountType, discountValue, scope,
      courseIds, maxRedemptions, oneTimePerUser,
      expiresAt, minimumCartAmount, active,
    } = req.body;

    if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
      return res.status(400).json({ success: false, message: 'Percentage discount must be between 1 and 100.' });
    }
    if (discountType === 'fixed' && discountValue <= 0) {
      return res.status(400).json({ success: false, message: 'Fixed discount must be positive.' });
    }

    // Publishers can only create course-scoped coupons for their own resources
    let resolvedScope = scope ?? 'global';
    let publisherId   = null;
    if (!isAdmin(req.admin)) {
      resolvedScope = 'publisher';
      publisherId   = req.admin._id;
    }

    const coupon = await Coupon.create({
      code:               code.trim().toUpperCase(),
      discountType,
      discountValue,
      scope:              resolvedScope,
      courseIds:          courseIds ?? [],
      publisherId,
      maxRedemptions:     maxRedemptions ?? null,
      oneTimePerUser:     oneTimePerUser ?? false,
      expiresAt:          expiresAt ?? null,
      minimumCartAmount:  minimumCartAmount ?? 0,
      active:             active ?? true,
      createdBy:          req.admin._id,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A coupon with this code already exists.' });
    }
    next(err);
  }
};

// ── PUT /api/coupons/:id ──────────────────────────────────────────────────────
exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    if (!isAdmin(req.admin) && coupon.publisherId?.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const allowed = ['discountType','discountValue','courseIds','maxRedemptions',
                     'oneTimePerUser','expiresAt','minimumCartAmount','active'];
    allowed.forEach(f => { if (req.body[f] !== undefined) coupon[f] = req.body[f]; });
    await coupon.save();
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
};

// ── DELETE /api/coupons/:id ───────────────────────────────────────────────────
exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    if (!isAdmin(req.admin) && coupon.publisherId?.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await coupon.deleteOne();
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) { next(err); }
};
