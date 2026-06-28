const express = require('express');
const router  = express.Router();
const { protect, requireAdmin, requireAdminOrPublisher } = require('../middleware/auth');
const {
  getPublishers, createPublisher, updatePublisher, deactivatePublisher,
  getMyStats, getMySales,
} = require('../controllers/publisherController');

router.use(protect);

// Publisher self-service routes
router.get('/me/stats', requireAdminOrPublisher, getMyStats);
router.get('/me/sales', requireAdminOrPublisher, getMySales);

// Admin-only management
router.get('/',         requireAdmin, getPublishers);
router.post('/',        requireAdmin, createPublisher);
router.put('/:id',      requireAdmin, updatePublisher);
router.delete('/:id',   requireAdmin, deactivatePublisher);

module.exports = router;
