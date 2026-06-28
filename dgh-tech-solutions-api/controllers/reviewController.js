const Review        = require('../models/Review');
const Resource      = require('../models/Resource');
const PurchaseAccess = require('../models/PurchaseAccess');

/** Recalculate and persist averageRating + reviewCount on the resource */
async function syncResourceStats(resourceId) {
  const [stats] = await Review.aggregate([
    { $match: { resourceId: require('mongoose').Types.ObjectId.createFromHexString(resourceId.toString()) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Resource.findByIdAndUpdate(resourceId, {
    averageRating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    reviewCount:   stats ? stats.count : 0,
  });
}

// ── Public ────────────────────────────────────────────────────────────────────

/** GET /api/reviews/:resourceId — all reviews for a resource */
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ resourceId: req.params.resourceId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const data = reviews.map((r) => ({
      _id:       r._id,
      userId:    r.userId?._id,
      userName:  r.userId?.name ?? 'Anonymous',
      rating:    r.rating,
      comment:   r.comment,
      createdAt: r.createdAt,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

/** GET /api/reviews/:resourceId/summary — average rating + count */
exports.getReviewSummary = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.resourceId).select('averageRating reviewCount');
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found.' });
    res.json({ success: true, data: { averageRating: resource.averageRating, count: resource.reviewCount } });
  } catch (err) { next(err); }
};

// ── Authenticated user routes ─────────────────────────────────────────────────

/** GET /api/reviews/:resourceId/mine — current user's review (or null) */
exports.getMyReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({
      userId:     req.user._id,
      resourceId: req.params.resourceId,
    });
    res.json({ success: true, data: review ?? null });
  } catch (err) { next(err); }
};

/** POST /api/reviews/:resourceId — submit a review */
exports.createReview = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId = req.user._id;
    const { rating, comment } = req.body;

    // Validate rating
    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Verify resource exists
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    // For paid resources, verify purchase
    if (resource.isPaid) {
      const purchase = await PurchaseAccess.findOne({ userId, resourceId, status: 'PAID' });
      if (!purchase) {
        return res.status(403).json({ success: false, message: 'You must purchase this resource before reviewing it.' });
      }
    }

    // Create review — unique index prevents duplicates
    let review;
    try {
      review = await Review.create({ userId, resourceId, rating: r, comment: (comment ?? '').trim() });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'You have already reviewed this resource.' });
      }
      throw err;
    }

    // Update denormalized stats on the resource
    await syncResourceStats(resourceId);

    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

// ── Admin ─────────────────────────────────────────────────────────────────────

/** GET /api/reviews/admin/:resourceId — all reviews with user detail (admin) */
exports.getAdminReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ resourceId: req.params.resourceId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const data = reviews.map((r) => ({
      _id:       r._id,
      userId:    r.userId?._id,
      userName:  r.userId?.name  ?? 'Deleted user',
      userEmail: r.userId?.email ?? '',
      rating:    r.rating,
      comment:   r.comment,
      createdAt: r.createdAt,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};
