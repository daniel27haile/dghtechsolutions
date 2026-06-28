const express            = require('express');
const { protect }        = require('../middleware/auth');
const { protectUser }    = require('../middleware/userAuth');
const ctrl               = require('../controllers/reviewController');

const router = express.Router();

// ── Admin routes (literal-segment must precede /:resourceId to avoid conflicts) ─
router.get('/admin/:resourceId', protect, ctrl.getAdminReviews);

// ── Sub-resource routes — must precede /:resourceId ──────────────────────────
router.get('/:resourceId/summary', ctrl.getReviewSummary);
router.get('/:resourceId/mine',    protectUser, ctrl.getMyReview);

// ── Base routes ───────────────────────────────────────────────────────────────
router.get('/:resourceId',  ctrl.getReviews);
router.post('/:resourceId', protectUser, ctrl.createReview);

module.exports = router;
