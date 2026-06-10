const express = require('express');
const { getContentByKey, getAllContent, upsertContent } = require('../controllers/siteContentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllContent);
router.get('/:key', getContentByKey);

// Admin routes
router.put('/admin/:key', protect, upsertContent);

module.exports = router;
