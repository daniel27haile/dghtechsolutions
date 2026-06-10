const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const AdminUser = require('../models/AdminUser');

/**
 * Generate a signed JWT token for the given admin user ID.
 */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * POST /api/auth/login
 * Admin login — returns JWT token on success.
 */
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, username, password } = req.body;
    const identifier = (email || username || '').toLowerCase();

    // Find admin by username or email — include password field
    const admin = await AdminUser.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select('+password');

    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!admin.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    const token = signToken(admin._id);

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the currently authenticated admin's profile.
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, admin: req.admin });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/change-password
 * Change the authenticated admin's password.
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await AdminUser.findById(req.admin._id).select('+password');
    if (!admin || !(await admin.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ success: false, message: 'New password must be at least 8 characters' });
    }

    admin.password = newPassword;
    await admin.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, changePassword };
