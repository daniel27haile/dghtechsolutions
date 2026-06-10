const SiteSettings = require('../models/SiteSettings');

/**
 * GET /api/settings
 * Admin — returns the singleton settings document.
 * Creates one with defaults if it doesn't exist yet.
 */
const getSettings = async (req, res, next) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/settings
 * Admin — upserts the singleton settings document.
 */
const updateSettings = async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { $set: req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
