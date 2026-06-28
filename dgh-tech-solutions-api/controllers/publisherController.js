const AdminUser   = require('../models/AdminUser');
const Resource    = require('../models/Resource');
const Order       = require('../models/Order');

// ── GET /api/publishers — admin only ─────────────────────────────────────────
exports.getPublishers = async (req, res, next) => {
  try {
    const publishers = await AdminUser.find({ role: 'publisher', isActive: true })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: publishers.length, data: publishers });
  } catch (err) { next(err); }
};

// ── POST /api/publishers — admin creates a publisher account ──────────────────
exports.createPublisher = async (req, res, next) => {
  try {
    const { username, email, password, fullName, publisherName, bio } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'username, email, password and fullName are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const publisher = await AdminUser.create({
      username, email, password, fullName,
      publisherName: publisherName ?? fullName,
      bio:           bio ?? '',
      role:          'publisher',
    });

    const safe = publisher.toObject();
    delete safe.password;
    res.status(201).json({ success: true, data: safe });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Username or email already in use.' });
    }
    next(err);
  }
};

// ── PUT /api/publishers/:id — admin updates publisher ────────────────────────
exports.updatePublisher = async (req, res, next) => {
  try {
    const publisher = await AdminUser.findOne({ _id: req.params.id, role: 'publisher' });
    if (!publisher) return res.status(404).json({ success: false, message: 'Publisher not found.' });

    const allowed = ['fullName', 'publisherName', 'bio', 'isActive'];
    allowed.forEach(f => { if (req.body[f] !== undefined) publisher[f] = req.body[f]; });
    if (req.body.password) publisher.password = req.body.password; // triggers bcrypt pre-save
    await publisher.save();

    const safe = publisher.toObject();
    delete safe.password;
    res.json({ success: true, data: safe });
  } catch (err) { next(err); }
};

// ── DELETE /api/publishers/:id — admin deactivates publisher ─────────────────
exports.deactivatePublisher = async (req, res, next) => {
  try {
    const publisher = await AdminUser.findOneAndUpdate(
      { _id: req.params.id, role: 'publisher' },
      { isActive: false },
      { new: true }
    ).select('-password');
    if (!publisher) return res.status(404).json({ success: false, message: 'Publisher not found.' });
    res.json({ success: true, data: publisher });
  } catch (err) { next(err); }
};

// ── GET /api/publishers/me/stats — publisher sees own resource stats ───────────
exports.getMyStats = async (req, res, next) => {
  try {
    const publisherId = req.admin._id;

    const [resourceCount, orders] = await Promise.all([
      Resource.countDocuments({ ownerId: publisherId, isPublished: true }),
      Order.find({ 'items.ownerId': publisherId, paymentStatus: 'PAID' }),
    ]);

    let grossRevenue = 0;
    let platformFees = 0;
    let netRevenue   = 0;
    let salesCount   = 0;

    for (const order of orders) {
      for (const item of order.items) {
        if (item.ownerId?.toString() !== publisherId.toString()) continue;
        grossRevenue += item.priceAtPurchase - item.discountAtPurchase;
        platformFees += item.platformFeeAmount;
        netRevenue   += item.publisherNetAmount;
        salesCount++;
      }
    }

    res.json({
      success: true,
      data: {
        resourceCount,
        salesCount,
        grossRevenue: +grossRevenue.toFixed(2),
        platformFees: +platformFees.toFixed(2),
        netRevenue:   +netRevenue.toFixed(2),
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/publishers/me/sales — publisher sees who purchased their resources
exports.getMySales = async (req, res, next) => {
  try {
    const publisherId = req.admin._id;
    const orders = await Order.find({ 'items.ownerId': publisherId, paymentStatus: 'PAID' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    const sales = orders.flatMap(o =>
      o.items
        .filter(i => i.ownerId?.toString() === publisherId.toString())
        .map(i => ({
          orderId:           o._id,
          buyer:             o.userId,
          resourceId:        i.resourceId,
          resourceTitle:     i.title,
          priceAtPurchase:   i.priceAtPurchase,
          platformFeeAmount: i.platformFeeAmount,
          publisherNet:      i.publisherNetAmount,
          paidAt:            o.paidAt ?? o.createdAt,
        }))
    );

    res.json({ success: true, count: sales.length, data: sales });
  } catch (err) { next(err); }
};
