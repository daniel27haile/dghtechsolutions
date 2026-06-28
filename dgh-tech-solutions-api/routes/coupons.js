const express = require('express');
const router  = express.Router();
const { protect, requireAdminOrPublisher } = require('../middleware/auth');
const {
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
} = require('../controllers/couponController');

router.use(protect, requireAdminOrPublisher);

router.get('/',       getCoupons);
router.post('/',      createCoupon);
router.put('/:id',    updateCoupon);
router.delete('/:id', deleteCoupon);

module.exports = router;
