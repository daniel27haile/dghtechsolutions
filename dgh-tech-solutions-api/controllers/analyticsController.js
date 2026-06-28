const crypto = require('crypto');
const PageVisit = require('../models/PageVisit');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const detectDevice = (ua = '') => {
  const u = ua.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(u)) return 'mobile';
  if (/ipad|tablet/.test(u)) return 'tablet';
  if (ua) return 'desktop';
  return 'unknown';
};

const detectBrowser = (ua = '') => {
  if (/edg\//i.test(ua))                              return 'Edge';
  if (/chrome/i.test(ua) && !/chromium/i.test(ua))   return 'Chrome';
  if (/firefox/i.test(ua))                            return 'Firefox';
  if (/safari/i.test(ua) && !/chrome/i.test(ua))     return 'Safari';
  if (/opera|opr/i.test(ua))                          return 'Opera';
  return 'Other';
};

/** Returns true for known bots / crawlers — these visits are silently discarded. */
const isBot = (ua = '') =>
  /bot|crawler|spider|slurp|googlebot|bingbot|yandexbot|baiduspider|duckduck|facebookexternalhit|twitterbot|linkedinbot|whatsapp|semrushbot|ahrefsbot|mj12bot|dotbot|ia_archiver|archive\.org/i.test(ua);

/** SHA-256 hash of IP+UA — no raw IP is ever persisted. */
const hashVisitor = (ip, ua) =>
  crypto.createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 24);

/**
 * Build a zero-filled array of the last N calendar days (most recent last).
 * @param {Map<string,number>} countMap  date string → visit count
 * @param {number} days                 how many days to include (default 7)
 */
const buildDailyArray = (countMap, days = 7) => {
  const result = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10); // YYYY-MM-DD
    result.push({ date: dateStr, count: countMap.get(dateStr) ?? 0 });
  }
  return result;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/analytics/track
 * Public — records a single page visit.
 * Bots are silently rejected (204) so the client doesn't retry.
 */
const trackVisit = async (req, res, next) => {
  try {
    const { path, referrer, sessionId } = req.body;

    if (!path) {
      return res.status(400).json({ success: false, message: 'Path is required' });
    }

    const ua = req.headers['user-agent'] || '';

    // Discard known bots / crawlers
    if (isBot(ua)) {
      return res.status(204).send();
    }

    const ip = req.ip || req.connection?.remoteAddress || '';

    await PageVisit.create({
      path:        path.slice(0, 200),
      referrer:    (referrer || '').slice(0, 500),
      userAgent:   ua.slice(0, 500),
      deviceType:  detectDevice(ua),
      browser:     detectBrowser(ua),
      visitorHash: hashVisitor(ip, ua),
      sessionId:   sessionId ? String(sessionId).slice(0, 64) : '',
      timestamp:   new Date(),
    });

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/summary
 * Admin — all metrics derived from the same PageVisit collection.
 *
 * Guarantees: total >= yearly >= monthly >= weekly (all countDocuments calls).
 * Daily chart: rolling last-7-calendar-days with zero-fill for missing days.
 */
const getSummary = async (req, res, next) => {
  try {
    const now = new Date();

    // ── Time boundaries ──────────────────────────────────────────────────────

    // Start of current ISO week (Monday 00:00:00 local midnight in UTC)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);

    // First day of the current calendar month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // January 1st of the current year
    const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);

    // Rolling 7-day window for the daily chart (start of day, 6 days ago)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Rolling 30-day window for top-pages and device breakdown
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // ── Parallel queries — single source of truth: PageVisit collection ──────
    const [total, weekly, monthly, yearly, dailyRaw, topPages, devices, recent] =
      await Promise.all([
        // Exact total — countDocuments guarantees consistency with the period counts
        PageVisit.countDocuments({}),

        PageVisit.countDocuments({ timestamp: { $gte: startOfWeek } }),
        PageVisit.countDocuments({ timestamp: { $gte: startOfMonth } }),
        PageVisit.countDocuments({ timestamp: { $gte: startOfYear } }),

        // Daily counts for the last 7 calendar days (raw — zero-fill applied below)
        PageVisit.aggregate([
          { $match: { timestamp: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id:   { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { date: '$_id', count: 1, _id: 0 } },
        ]),

        // Top pages — last 30 days
        PageVisit.aggregate([
          { $match: { timestamp: { $gte: thirtyDaysAgo } } },
          { $group: { _id: '$path', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 },
          { $project: { path: '$_id', count: 1, _id: 0 } },
        ]),

        // Device breakdown — last 30 days
        PageVisit.aggregate([
          { $match: { timestamp: { $gte: thirtyDaysAgo } } },
          { $group: { _id: '$deviceType', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $project: { device: '$_id', count: 1, _id: 0 } },
        ]),

        // 10 most recent visits (for the live feed panel)
        PageVisit.find()
          .sort({ timestamp: -1 })
          .limit(10)
          .select('path referrer deviceType browser timestamp')
          .lean(),
      ]);

    // Zero-fill any calendar days that had no visits
    const dailyCountMap = new Map(dailyRaw.map((d) => [d.date, d.count]));
    const daily = buildDailyArray(dailyCountMap, 7);

    res.status(200).json({
      success: true,
      data: { total, weekly, monthly, yearly, daily, topPages, devices, recent },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { trackVisit, getSummary };
