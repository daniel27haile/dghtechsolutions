const express      = require('express');
const { protectUser } = require('../middleware/userAuth');
const ctrl         = require('../controllers/paymentController');

const router = express.Router();

// All payment routes require a logged-in public user
router.post('/checkout/:resourceId',          protectUser, ctrl.createCheckoutSession);
router.get('/access/:resourceId',             protectUser, ctrl.checkAccess);
router.get('/verify-session/:sessionId',      protectUser, ctrl.verifySession);
router.get('/my-library',                     protectUser, ctrl.getMyLibrary);

// Free-resource library save / unsave
router.post('/save/:resourceId',   protectUser, ctrl.saveResource);
router.delete('/save/:resourceId', protectUser, ctrl.unsaveResource);

// Stripe webhook — must receive raw body (mounted separately in server.js)
router.post('/webhook', ctrl.stripeWebhook);

module.exports = router;
