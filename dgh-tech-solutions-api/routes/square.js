const express    = require('express');
const router     = express.Router();
const { protectUser } = require('../middleware/userAuth');
const { createCheckout, squareWebhook, getConfig } = require('../controllers/squareController');

// Public — Square config (app ID + location ID — safe to expose)
router.get('/config', getConfig);

// Square webhook — raw body needed; Square doesn't sign like Stripe but we verify event data
router.post('/webhook', express.json(), squareWebhook);

// Protected user routes
router.post('/checkout', protectUser, createCheckout);

module.exports = router;
