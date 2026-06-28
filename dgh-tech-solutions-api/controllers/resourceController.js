const Resource        = require('../models/Resource');
const McqQuestion     = require('../models/McqQuestion');
const ShortAnswerCard = require('../models/ShortAnswerCard');
const PurchaseAccess  = require('../models/PurchaseAccess');

/**
 * Sync legacy isPaid/price from pricing subdoc and auto-calculate discount.
 * Mutates and returns the body object.
 */
function syncPricingFields(body) {
  const p = body.pricing;
  if (!p) return body;

  body.isPaid = !p.isFree;
  body.price  = p.isFree ? 0 : (p.salePrice ?? body.price ?? 0);

  if (p.autoCalculateDiscount && p.oldPrice > 0 && p.salePrice != null && p.salePrice >= 0) {
    const raw = ((p.oldPrice - p.salePrice) / p.oldPrice) * 100;
    p.discountPercent = Math.min(100, Math.max(0, Math.round(raw)));
  }

  return body;
}

/** Returns true if user has paid access (or resource is free) */
async function hasAccess(resource, userId) {
  if (!resource.isPaid) return true;
  if (!userId) return false;
  const purchase = await PurchaseAccess.findOne({ userId, resourceId: resource._id, status: 'PAID' });
  return !!purchase;
}

// ── Public ────────────────────────────────────────────────────────────────────

exports.getPublished = async (req, res, next) => {
  try {
    const { category, type, search } = req.query;
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $in: [new RegExp(search, 'i')] } },
      ];
    }
    const resources = await Resource.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    next(err);
  }
};

exports.getFeatured = async (req, res, next) => {
  try {
    const resources = await Resource.find({ isPublished: true, isFeatured: true })
      .sort({ displayOrder: 1 })
      .limit(6);
    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, isPublished: true });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

exports.getQuestions = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, isPublished: true });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    if (resource.type !== 'MULTIPLE_CHOICE') {
      return res.status(400).json({ success: false, message: 'Not a multiple choice resource' });
    }
    if (!(await hasAccess(resource, req.user?._id))) {
      // Return a limited preview instead of a hard 402
      const limit   = resource.previewPageLimit > 0 ? resource.previewPageLimit : 1;
      const preview = await McqQuestion.find({ resourceId: req.params.id }).sort({ phase: 1, order: 1 }).limit(limit);
      return res.json({ success: true, count: preview.length, data: preview, isPreview: true });
    }
    const questions = await McqQuestion.find({ resourceId: req.params.id }).sort({ phase: 1, order: 1 });
    res.json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    next(err);
  }
};

exports.getCards = async (req, res, next) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, isPublished: true });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    if (resource.type !== 'SHORT_ANSWER') {
      return res.status(400).json({ success: false, message: 'Not a short answer resource' });
    }
    if (!(await hasAccess(resource, req.user?._id))) {
      // Return a limited preview instead of a hard 402
      const limit   = resource.previewPageLimit > 0 ? resource.previewPageLimit : 1;
      const preview = await ShortAnswerCard.find({ resourceId: req.params.id }).sort({ phase: 1, order: 1 }).limit(limit);
      return res.json({ success: true, count: preview.length, data: preview, isPreview: true });
    }
    const cards = await ShortAnswerCard.find({ resourceId: req.params.id }).sort({ phase: 1, order: 1 });
    res.json({ success: true, count: cards.length, data: cards });
  } catch (err) {
    next(err);
  }
};

// ── Admin – Resource CRUD ─────────────────────────────────────────────────────

exports.getAll = async (req, res, next) => {
  try {
    // Publishers only see their own resources; admins see everything
    const filter = req.admin?.role === 'publisher' ? { ownerId: req.admin._id } : {};
    const resources = await Resource.find(filter).sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, count: resources.length, data: resources });
  } catch (err) {
    next(err);
  }
};

exports.getAdminById = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const body = syncPricingFields({ ...req.body });
    // Publishers automatically own the resources they create
    if (req.admin?.role === 'publisher') {
      body.ownerId = req.admin._id;
    }
    const resource = await Resource.create(body);
    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const body = syncPricingFields({ ...req.body });
    // Never allow ownerId to be overwritten via update
    delete body.ownerId;

    // Publishers can only edit their own resources
    if (req.admin?.role === 'publisher') {
      const existing = await Resource.findOne({ _id: req.params.id, ownerId: req.admin._id });
      if (!existing) return res.status(403).json({ success: false, message: 'Not authorised to edit this resource' });
    }

    const resource = await Resource.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    // Publishers can only delete their own resources
    if (req.admin?.role === 'publisher') {
      const owned = await Resource.findOne({ _id: req.params.id, ownerId: req.admin._id });
      if (!owned) return res.status(403).json({ success: false, message: 'Not authorised to delete this resource' });
    }
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    await McqQuestion.deleteMany({ resourceId: req.params.id });
    await ShortAnswerCard.deleteMany({ resourceId: req.params.id });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};

exports.togglePublish = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    resource.isPublished = !resource.isPublished;
    await resource.save();
    res.json({ success: true, data: resource });
  } catch (err) {
    next(err);
  }
};

// ── Admin – MCQ Questions ─────────────────────────────────────────────────────

exports.getAllQuestions = async (req, res, next) => {
  try {
    const questions = await McqQuestion.find({ resourceId: req.params.id }).sort({ phase: 1, order: 1 });
    res.json({ success: true, count: questions.length, data: questions });
  } catch (err) {
    next(err);
  }
};

exports.addQuestion = async (req, res, next) => {
  try {
    const q = await McqQuestion.create({ ...req.body, resourceId: req.params.id });
    res.status(201).json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const q = await McqQuestion.findByIdAndUpdate(req.params.qid, req.body, {
      new: true,
      runValidators: true,
    });
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: q });
  } catch (err) {
    next(err);
  }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const q = await McqQuestion.findByIdAndDelete(req.params.qid);
    if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};

// ── Admin – Short Answer Cards ────────────────────────────────────────────────

exports.getAllCards = async (req, res, next) => {
  try {
    const cards = await ShortAnswerCard.find({ resourceId: req.params.id }).sort({ phase: 1, order: 1 });
    res.json({ success: true, count: cards.length, data: cards });
  } catch (err) {
    next(err);
  }
};

exports.addCard = async (req, res, next) => {
  try {
    const card = await ShortAnswerCard.create({ ...req.body, resourceId: req.params.id });
    res.status(201).json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

exports.updateCard = async (req, res, next) => {
  try {
    const card = await ShortAnswerCard.findByIdAndUpdate(req.params.cid, req.body, {
      new: true,
      runValidators: true,
    });
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

exports.deleteCard = async (req, res, next) => {
  try {
    const card = await ShortAnswerCard.findByIdAndDelete(req.params.cid);
    if (!card) return res.status(404).json({ success: false, message: 'Card not found' });
    res.json({ success: true, data: null });
  } catch (err) {
    next(err);
  }
};
