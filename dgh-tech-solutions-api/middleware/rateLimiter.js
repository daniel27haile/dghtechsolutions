const rateLimit = require('express-rate-limit');

/**
 * Login rate limiter — prevents brute-force attacks on the admin login endpoint.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Contact form rate limiter — prevents spam submissions.
 * In development the limiter is disabled so test submissions always go through.
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 1000 : 10,
  message: {
    success: false,
    message: 'Too many messages submitted. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

/**
 * General API rate limiter.
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Registration rate limiter — prevents mass account creation.
 */
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 1000 : 20,
  message: {
    success: false,
    message: 'Too many accounts created from this IP, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

module.exports = { loginLimiter, contactLimiter, apiLimiter, registerLimiter };
