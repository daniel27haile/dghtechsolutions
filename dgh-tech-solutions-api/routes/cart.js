const express = require('express');
const router  = express.Router();
const { protectUser } = require('../middleware/userAuth');
const {
  getCart, addItem, removeItem, clearCart, applyCoupon, removeCoupon,
} = require('../controllers/cartController');

router.use(protectUser);

router.get('/',               getCart);
router.post('/items',         addItem);
router.delete('/items/:resourceId', removeItem);
router.delete('/',            clearCart);
router.post('/coupon',        applyCoupon);
router.delete('/coupon',      removeCoupon);

module.exports = router;
