const crypto = require('crypto');
const PageVisit = require('../models/PageVisit');

/**
 * Detect device type from User-Agent string.
 */
const detectDevice = (ua = '') => {
  const uaLower = ua.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(uaLower)) return 'mobile';
  if (/ipad|tablet/.test(uaLower)) return 'tablet';
  if (ua) return 'desktop';
  return 'unknown';
};

/**
 * Detect browser from User-Agent string.
 */
const detectBrowser = (ua = '') => {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua) && !/chromium/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
  if (/opera|opr/i.test(ua)) return 'Opera';
  return 'Other';
};

/**
 * Hash IP + UA for a privacy-safe visitor identifier.
 */
const hashVisitor = (ip, ua) =>
  crypto
    .createHash('sha256')
    .update(`${ip}:${ua}`)
    .digest('hex')
    .slice(0, 24);

/**
 * POST /api/analytics/track
 * Public — record a page visit.
 */
const trackVisit = async (req, res, next) => {
  try {
    const { path, referrer, sessionId } = req.body;

    if (!path) {
      return res.status(400).json({ success: false, message: 'Path is required' });
    }

    const ip = req.ip || req.connection.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    await PageVisit.create({
      path: path.slice(0, 200),
      referrer: (referrer || '').slice(0, 500),
      userAgent: ua.slice(0, 500),
      deviceType: detectDevice(ua),
      browser: detectBrowser(ua),
      visitorHash: hashVisitor(ip, ua),
      sessionId: sessionId ? String(sessionId).slice(0, 64) : '',
      timestamp: new Date(),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/analytics/summary
 * Admin — returns visitor statistics for week, month, year.
 */
const getSummary = async (req, res, next) => {
  try {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    const startOfYear = new Date(now);
    startOfYear.setFullYear(now.getFullYear() - 1);

    const [thisWeek, thisMonth, thisYear, byPage, recent] = await Promise.all([
      PageVisit.countDocuments({ timestamp: { $gte: startOfWeek } }),
      PageVisit.countDocuments({ timestamp: { $gte: startOfMonth } }),
      PageVisit.countDocuments({ timestamp: { $gte: startOfYear } }),

      // Page views grouped by path (last 30 days)
      PageVisit.aggregate([
        { $match: { timestamp: { $gte: startOfMonth } } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { path: '$_id', count: 1, _id: 0 } },
      ]),

      // 10 most recent visits
      PageVisit.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .select('path referrer deviceType browser timestamp'),
    ]);

    // Daily visits for the last 7 days
    const dailyVisits = await PageVisit.aggregate([
      { $match: { timestamp: { $gte: startOfWeek } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', count: 1, _id: 0 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        thisWeek,
        thisMonth,
        thisYear,
        byPage,
        recent,
        dailyVisits,
        totalAll: await PageVisit.estimatedDocumentCount(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { trackVisit, getSummary };
