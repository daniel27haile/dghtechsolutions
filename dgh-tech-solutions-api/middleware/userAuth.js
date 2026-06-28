const jwt  = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Require a logged-in public user.
 */
const protectUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — please log in.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Ensure this is a user token, not an admin token
    if (decoded.type !== 'user') {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

/**
 * Silently attach req.user if a valid user token is present. Never blocks.
 */
const optionalUserAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type === 'user') {
      req.user = await User.findById(decoded.id).select('-password');
    }
  } catch { /* silently ignore */ }
  next();
};

module.exports = { protectUser, optionalUserAuth };
