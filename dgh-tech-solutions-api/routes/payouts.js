const express = require('express');
const router  = express.Router();
const { protect, requireAdmin, requireAdminOrPublisher } = require('../middleware/auth');
const {
  getBalance, requestPayout, getPayouts,
  approvePayout, rejectPayout, markPaid,
} = require('../controllers/payoutController');

router.use(protect, requireAdminOrPublisher);

router.get('/balance',          getBalance);
router.post('/request',         requestPayout);
router.get('/',                 getPayouts);

// Admin-only actions
router.put('/:id/approve',      requireAdmin, approvePayout);
router.put('/:id/reject',       requireAdmin, rejectPayout);
router.put('/:id/mark-paid',    requireAdmin, markPaid);

module.exports = router;
