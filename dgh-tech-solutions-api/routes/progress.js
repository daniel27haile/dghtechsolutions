const express          = require('express');
const router           = express.Router();
const { protect }      = require('../middleware/auth');
const { protectUser }  = require('../middleware/userAuth');
const ctrl             = require('../controllers/progressController');

// ── Admin routes — MUST appear before /:resourceId to prevent "admin" being matched as a resource ID
router.get('/admin/all',                  protect,     ctrl.getAllProgress);
router.get('/admin/resource/:resourceId', protect,     ctrl.getProgressForResource);

// ── User routes
router.get('/:resourceId',                protectUser, ctrl.getProgress);
router.put('/:resourceId',                protectUser, ctrl.updateProgress);
router.post('/:resourceId/reset',         protectUser, ctrl.resetProgress);

module.exports = router;
