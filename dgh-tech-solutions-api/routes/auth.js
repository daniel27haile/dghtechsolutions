const express = require('express');
const { body } = require('express-validator');
const { login, getMe, changePassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// POST /api/auth/login
router.post(
  '/login',
  loginLimiter,
  [
    body('email').notEmpty().withMessage('Email is required').trim(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PUT /api/auth/change-password
router.put('/change-password', protect, changePassword);

// PATCH /api/auth/profile
router.patch('/profile', protect, updateProfile);

module.exports = router;
