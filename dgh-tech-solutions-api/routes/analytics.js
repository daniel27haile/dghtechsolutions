const express = require('express');
const { trackVisit, getSummary } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public — track a visit
router.post('/track', apiLimiter, trackVisit);

// Admin — analytics summary
router.get('/summary', protect, getSummary);
router.get('/admin/summary', protect, getSummary); // legacy alias

module.exports = router;
