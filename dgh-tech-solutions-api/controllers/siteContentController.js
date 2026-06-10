const SiteContent = require('../models/SiteContent');

/**
 * GET /api/content/:key
 * Public — returns a single content section by key.
 */
const getContentByKey = async (req, res, next) => {
  try {
    const content = await SiteContent.findOne({ key: req.params.key });
    if (!content) {
      return res.status(404).json({ success: false, message: 'Content not found' });
    }
    res.status(200).json({ success: true, data: content.data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/content
 * Public — returns all site content sections as a key-value map.
 */
const getAllContent = async (req, res, next) => {
  try {
    const contents = await SiteContent.find().select('-__v');
    const contentMap = {};
    contents.forEach((c) => {
      contentMap[c.key] = c.data;
    });
    res.status(200).json({ success: true, data: contentMap });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/content/:key
 * Admin — upsert (create or update) a content section by key.
 */
const upsertContent = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, message: 'Content data is required' });
    }

    const content = await SiteContent.findOneAndUpdate(
      { key },
      { key, data },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: content.data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getContentByKey, getAllContent, upsertContent };
