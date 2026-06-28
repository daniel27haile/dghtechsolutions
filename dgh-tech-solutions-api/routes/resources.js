const express    = require('express');
const { protect } = require('../middleware/auth');
const { optionalUserAuth } = require('../middleware/userAuth');
const PurchaseAccess = require('../models/PurchaseAccess');
const ctrl        = require('../controllers/resourceController');

const router = express.Router();

// ── Public routes ─────────────────────────────────────────────────────────────
// NOTE: more-specific paths must appear BEFORE parametric paths to avoid conflicts

router.get('/',         ctrl.getPublished);
router.get('/featured', ctrl.getFeatured);

// /:id sub-routes — gated for paid content (user access checked inside controller)
router.get('/:id/questions', optionalUserAuth, ctrl.getQuestions);
router.get('/:id/cards',     optionalUserAuth, ctrl.getCards);

router.get('/:id', ctrl.getById);

// ── Admin routes (all require authentication) ─────────────────────────────────
// Literal-segment routes must appear BEFORE /:id routes to avoid swallowing them

router.get('/admin/all', protect, ctrl.getAll);

// Question & card helpers with literal "questions"/"cards" segment (3-part path)
// These must be defined before /admin/:id so Express doesn't try to match :id="questions"/"cards"
router.put('/admin/questions/:qid',    protect, ctrl.updateQuestion);
router.delete('/admin/questions/:qid', protect, ctrl.deleteQuestion);
router.put('/admin/cards/:cid',        protect, ctrl.updateCard);
router.delete('/admin/cards/:cid',     protect, ctrl.deleteCard);

router.post('/admin', protect, ctrl.create);

// Per-resource admin routes
router.get('/admin/:id',          protect, ctrl.getAdminById);
router.put('/admin/:id',          protect, ctrl.update);
router.delete('/admin/:id',       protect, ctrl.remove);
router.patch('/admin/:id/publish', protect, ctrl.togglePublish);

// Content sub-resources for a given resource
router.get('/admin/:id/questions',  protect, ctrl.getAllQuestions);
router.post('/admin/:id/questions', protect, ctrl.addQuestion);
router.get('/admin/:id/cards',      protect, ctrl.getAllCards);
router.post('/admin/:id/cards',     protect, ctrl.addCard);

module.exports = router;
