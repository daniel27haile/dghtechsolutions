const express = require('express');
const { body } = require('express-validator');
const { submitContact, getMessages, updateStatus, markAsRead, deleteMessage } = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { contactLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const contactValidation = [
  body('name').notEmpty().withMessage('Name is required').trim().escape().isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Message must be between 10 and 2000 characters'),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('company').optional().trim().escape().isLength({ max: 100 }),
  body('serviceInterest').optional().trim().escape().isLength({ max: 200 }),
];

// Public route
router.post('/', contactLimiter, contactValidation, submitContact);

// Admin routes
router.get('/messages', protect, getMessages);
router.put('/messages/:id/status', protect, updateStatus);
router.patch('/messages/:id/status', protect, updateStatus);
router.delete('/messages/:id', protect, deleteMessage);
// Legacy aliases
router.get('/admin/messages', protect, getMessages);
router.patch('/admin/messages/:id/read', protect, markAsRead);
router.delete('/admin/messages/:id', protect, deleteMessage);

module.exports = router;
