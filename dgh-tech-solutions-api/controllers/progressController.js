const CourseProgress   = require('../models/CourseProgress');
const Resource         = require('../models/Resource');
const PurchaseAccess   = require('../models/PurchaseAccess');
const McqQuestion      = require('../models/McqQuestion');
const ShortAnswerCard  = require('../models/ShortAnswerCard');

// ── User endpoints ─────────────────────────────────────────────────────────────

/** GET /api/progress/:resourceId — current user's progress for a resource */
exports.getProgress = async (req, res, next) => {
  try {
    const progress = await CourseProgress.findOne({
      userId:     req.user._id,
      resourceId: req.params.resourceId,
    });
    res.json({ success: true, data: progress ?? null });
  } catch (err) { next(err); }
};

/** PUT /api/progress/:resourceId — upsert progress for current user */
exports.updateProgress = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId         = req.user._id;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    if (resource.type === 'BUNDLE') {
      return res.status(400).json({ success: false, message: 'Progress tracking is not available for bundles.' });
    }

    if (resource.isPaid) {
      const purchase = await PurchaseAccess.findOne({ userId, resourceId, status: 'PAID' });
      if (!purchase) {
        return res.status(403).json({ success: false, message: 'Purchase required to track progress.' });
      }
    }

    const { completedItemIds, currentItemId, progressPercentage, status } = req.body;
    const now = new Date();

    // ── Compute percentage server-side from completedItemIds ──────────────
    let computedPct = 0;
    let deduplicatedIds = [];

    if (resource.type === 'MULTIPLE_CHOICE') {
      if (Array.isArray(completedItemIds)) {
        const total    = await McqQuestion.countDocuments({ resourceId });
        deduplicatedIds = [...new Set(completedItemIds.map((id) => String(id)).filter(Boolean))];
        computedPct    = total > 0 ? Math.round((deduplicatedIds.length / total) * 100) : 0;
      }
    } else if (resource.type === 'SHORT_ANSWER') {
      if (Array.isArray(completedItemIds)) {
        const total    = await ShortAnswerCard.countDocuments({ resourceId });
        deduplicatedIds = [...new Set(completedItemIds.map((id) => String(id)).filter(Boolean))];
        computedPct    = total > 0 ? Math.round((deduplicatedIds.length / total) * 100) : 0;
      }
    } else if (resource.type === 'PDF') {
      // PDF has no discrete items — trust client-supplied value
      computedPct = Math.min(100, Math.max(0, Math.round(Number(progressPercentage) || 0)));
    }

    computedPct = Math.min(100, Math.max(0, computedPct));

    // ── Derive status from computed pct ───────────────────────────────────
    let computedStatus;
    if (computedPct >= 100) {
      computedStatus = 'completed';
    } else if (computedPct > 0) {
      computedStatus = 'in_progress';
    } else {
      // pct = 0: honour explicit client status so "Start Course" creates an in_progress record
      computedStatus = ['not_started', 'in_progress'].includes(status) ? status : 'in_progress';
    }

    // ── Build update document ─────────────────────────────────────────────
    const setFields = {
      lastAccessedAt:     now,
      progressPercentage: computedPct,
      status:             computedStatus,
    };

    if (resource.type !== 'PDF') {
      setFields.completedItemIds = deduplicatedIds;
    }

    if (currentItemId !== undefined) {
      setFields.currentItemId = currentItemId;
    }

    if (computedStatus === 'completed') {
      setFields.completedAt = now;
    }

    const progress = await CourseProgress.findOneAndUpdate(
      { userId, resourceId },
      {
        $set:         setFields,
        $setOnInsert: { startedAt: now },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: progress });
  } catch (err) { next(err); }
};

/** POST /api/progress/:resourceId/reset — reset to not_started */
exports.resetProgress = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const userId         = req.user._id;

    const progress = await CourseProgress.findOneAndUpdate(
      { userId, resourceId },
      {
        $set: {
          completedItemIds:   [],
          currentItemId:      null,
          progressPercentage: 0,
          status:             'not_started',
          startedAt:          null,
          completedAt:        null,
          lastAccessedAt:     new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: progress });
  } catch (err) { next(err); }
};

// ── Admin endpoints ────────────────────────────────────────────────────────────

/** GET /api/progress/admin/all — all progress records with optional filters */
exports.getAllProgress = async (req, res, next) => {
  try {
    const { search, resourceId, status } = req.query;

    const filter = {};
    if (resourceId) filter.resourceId = resourceId;
    if (status && ['not_started', 'in_progress', 'completed'].includes(status)) {
      filter.status = status;
    }

    let records = await CourseProgress.find(filter)
      .populate('userId',     'name email')
      .populate('resourceId', 'title type')
      .sort({ lastAccessedAt: -1 });

    // Post-query search (filters by populated user name/email or resource title)
    if (search) {
      const s = search.toLowerCase();
      records = records.filter((p) =>
        (p.userId?.name     ?? '').toLowerCase().includes(s) ||
        (p.userId?.email    ?? '').toLowerCase().includes(s) ||
        (p.resourceId?.title ?? '').toLowerCase().includes(s)
      );
    }

    const data = records.map((p) => ({
      _id:                p._id,
      userId:             p.userId?._id,
      userName:           p.userId?.name  ?? 'Deleted user',
      userEmail:          p.userId?.email ?? '',
      resourceId:         p.resourceId?._id,
      resourceTitle:      p.resourceId?.title ?? 'Deleted resource',
      resourceType:       p.resourceId?.type  ?? '',
      progressPercentage: p.progressPercentage,
      status:             p.status,
      completedItemCount: p.completedItemIds?.length ?? 0,
      startedAt:          p.startedAt,
      lastAccessedAt:     p.lastAccessedAt,
      completedAt:        p.completedAt,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

/** GET /api/progress/admin/resource/:resourceId — progress records for one resource */
exports.getProgressForResource = async (req, res, next) => {
  try {
    const records = await CourseProgress.find({ resourceId: req.params.resourceId })
      .populate('userId', 'name email')
      .sort({ lastAccessedAt: -1 });

    const data = records.map((p) => ({
      _id:                p._id,
      userId:             p.userId?._id,
      userName:           p.userId?.name  ?? 'Deleted user',
      userEmail:          p.userId?.email ?? '',
      progressPercentage: p.progressPercentage,
      status:             p.status,
      completedItemCount: p.completedItemIds?.length ?? 0,
      startedAt:          p.startedAt,
      lastAccessedAt:     p.lastAccessedAt,
      completedAt:        p.completedAt,
    }));

    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};
