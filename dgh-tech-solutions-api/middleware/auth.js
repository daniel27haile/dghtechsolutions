const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');

/**
 * Protect middleware — verifies JWT token and attaches admin user to request.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await AdminUser.findById(decoded.id).select('-password');

    if (!admin || !admin.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized — account inactive or not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized — invalid token' });
  }
};

/**
 * Restrict to specific roles.
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden — insufficient permissions' });
    }
    next();
  };
};

/**
 * Allow admin/superadmin only (excludes publishers).
 */
const requireAdmin = (req, res, next) => {
  if (!['admin', 'superadmin'].includes(req.admin.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

/**
 * Allow admin OR publisher.
 */
const requireAdminOrPublisher = (req, res, next) => {
  if (!['admin', 'superadmin', 'publisher'].includes(req.admin.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

/**
 * isAdmin helper (non-middleware) — true for admin/superadmin.
 */
const isAdmin = (admin) => ['admin', 'superadmin'].includes(admin?.role);

module.exports = { protect, restrictTo, requireAdmin, requireAdminOrPublisher, isAdmin };
