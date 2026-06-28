require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes       = require('./routes/auth');
const projectRoutes    = require('./routes/projects');
const serviceRoutes    = require('./routes/services');
const siteContentRoutes = require('./routes/siteContent');
const contactRoutes    = require('./routes/contact');
const analyticsRoutes  = require('./routes/analytics');
const settingsRoutes   = require('./routes/settings');
const resourceRoutes   = require('./routes/resources');
const userAuthRoutes   = require('./routes/userAuth');
const paymentRoutes    = require('./routes/payments');
const uploadRoutes     = require('./routes/upload');
const reviewRoutes     = require('./routes/reviews');
const progressRoutes   = require('./routes/progress');
const cartRoutes       = require('./routes/cart');
const couponRoutes     = require('./routes/coupons');
const squareRoutes     = require('./routes/square');
const payoutRoutes     = require('./routes/payouts');
const publisherRoutes  = require('./routes/publishers');

const app = express();

// Connect to MongoDB
connectDB();

// Trust proxy — only in production (behind a real reverse proxy like nginx/heroku).
// In development this would cause all requests to share the same IP (::1),
// which makes the rate limiter block legitimate test submissions after 5 requests.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:4200',
  'https://dghtechsolutions.com',
  'https://www.dghtechsolutions.com',
];

const corsOptions = process.env.NODE_ENV === 'production'
  ? {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error(`CORS policy does not allow origin: ${origin}`));
      },
      credentials: true,
    }
  : { origin: true, credentials: true }; // allow all origins in development

app.use(cors(corsOptions));

// Stripe webhook needs raw body — must be mounted BEFORE json body parser
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
// Square webhook uses JSON body (parsed separately per route)

// Body parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// HTTP request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'DGH Tech Solutions API is running', timestamp: new Date() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/content', siteContentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings',  settingsRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/users',     userAuthRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/upload',    uploadRoutes);
app.use('/api/reviews',    reviewRoutes);
app.use('/api/progress',   progressRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/coupons',    couponRoutes);
app.use('/api/square',     squareRoutes);
app.use('/api/payouts',    payoutRoutes);
app.use('/api/publishers', publisherRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`DGH Tech Solutions API running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
