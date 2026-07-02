const express      = require('express');
const { protectUser } = require('../middleware/userAuth');
const ctrl         = require('../controllers/paymentController');

const router = express.Router();

// Stripe webhook — must receive raw body (mounted before JSON body parser in server.js)
router.post('/webhook', ctrl.stripeWebhook);

// All routes below require a logged-in public user
// Cart checkout must come BEFORE /:resourceId to avoid Express matching 'cart' as a resourceId
router.post('/checkout/cart',          protectUser, ctrl.createCartCheckoutSession);
router.post('/checkout/:resourceId',   protectUser, ctrl.createCheckoutSession);
router.get('/access/:resourceId',      protectUser, ctrl.checkAccess);
router.get('/verify-session/:sessionId', protectUser, ctrl.verifySession);
router.get('/my-library',              protectUser, ctrl.getMyLibrary);

// Free-resource library save / unsave
router.post('/save/:resourceId',   protectUser, ctrl.saveResource);
router.delete('/save/:resourceId', protectUser, ctrl.unsaveResource);

module.exports = router;
