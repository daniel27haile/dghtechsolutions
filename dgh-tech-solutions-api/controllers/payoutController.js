const PayoutRequest = require('../models/PayoutRequest');
const Order         = require('../models/Order');
const SiteSettings  = require('../models/SiteSettings');
const { isAdmin }   = require('../middleware/auth');

// ── Helper: compute available net balance for a publisher ─────────────────────
async function getPublisherBalance(publisherId) {
  // Sum publisherNetAmount from all PAID orders that have not been included in an approved/paid payout
  const paidPayoutOrders = await PayoutRequest.find({
    publisherId, status: { $in: ['approved', 'paid'] },
  }).distinct('orderIds');

  const paidOrderSet = new Set(paidPayoutOrders.map(id => id.toString()));

  const orders = await Order.find({
    'items.ownerId': publisherId,
    paymentStatus:   'PAID',
    _id: { $nin: [...paidOrderSet] },
  });

  let gross     = 0;
  let feeTotal  = 0;
  let net       = 0;
  const orderIds = [];

  for (const order of orders) {
    for (const item of order.items) {
      if (item.ownerId?.toString() !== publisherId.toString()) continue;
      gross    += item.priceAtPurchase - item.discountAtPurchase;
      feeTotal += item.platformFeeAmount;
      net      += item.publisherNetAmount;
    }
    orderIds.push(order._id);
  }

  return {
    gross:     +gross.toFixed(2),
    feeTotal:  +feeTotal.toFixed(2),
    net:       +net.toFixed(2),
    orderIds,
  };
}

// ── GET /api/payouts/balance — publisher sees their own balance ───────────────
exports.getBalance = async (req, res, next) => {
  try {
    const publisherId = isAdmin(req.admin) ? req.query.publisherId : req.admin._id;
    if (!publisherId) {
      return res.status(400).json({ success: false, message: 'publisherId required.' });
    }

    const balance  = await getPublisherBalance(publisherId);
    const settings = await SiteSettings.findOne({}).select('platformFeePercent payoutMinimumAmount payoutWaitingDays');

    // Last approved/paid payout
    const lastPayout = await PayoutRequest.findOne({
      publisherId, status: { $in: ['approved', 'paid'] },
    }).sort({ approvedAt: -1 });

    const waitingDays = settings?.payoutWaitingDays ?? 30;
    const minAmount   = settings?.payoutMinimumAmount ?? 20;

    let nextEligibleDate = null;
    if (lastPayout?.approvedAt) {
      const next = new Date(lastPayout.approvedAt);
      next.setDate(next.getDate() + waitingDays);
      nextEligibleDate = next;
    }

    const today = new Date();
    const waitingPassed = !nextEligibleDate || today >= nextEligibleDate;

    res.json({
      success: true,
      data: {
        ...balance,
        platformFeePercent: settings?.platformFeePercent ?? 20,
        minimumAmount:      minAmount,
        waitingDays,
        lastPayoutDate:     lastPayout?.paidAt ?? lastPayout?.approvedAt ?? null,
        nextEligibleDate,
        isEligible:         balance.net >= minAmount && waitingPassed,
        ineligibleReason:
          balance.net === 0        ? 'No available balance.' :
          balance.net < minAmount  ? `Minimum payout is $${minAmount.toFixed(2)}.` :
          !waitingPassed           ? `Next payout available on ${nextEligibleDate?.toLocaleDateString()}.` : null,
      },
    });
  } catch (err) { next(err); }
};

// ── POST /api/payouts/request — publisher requests a payout ──────────────────
exports.requestPayout = async (req, res, next) => {
  try {
    const publisherId = req.admin._id;
    const balance     = await getPublisherBalance(publisherId);
    const settings    = await SiteSettings.findOne({}).select('payoutMinimumAmount payoutWaitingDays');
    const minAmount   = settings?.payoutMinimumAmount ?? 20;
    const waitingDays = settings?.payoutWaitingDays ?? 30;

    if (balance.net <= 0) {
      return res.status(400).json({ success: false, message: 'No available balance.' });
    }
    if (balance.net < minAmount) {
      return res.status(400).json({ success: false, message: `Minimum payout is $${minAmount.toFixed(2)}.` });
    }

    const lastPayout = await PayoutRequest.findOne({
      publisherId, status: { $in: ['approved', 'paid'] },
    }).sort({ approvedAt: -1 });

    if (lastPayout?.approvedAt) {
      const next = new Date(lastPayout.approvedAt);
      next.setDate(next.getDate() + waitingDays);
      if (new Date() < next) {
        return res.status(400).json({
          success: false,
          message: `Next payout available on ${next.toLocaleDateString()}.`,
        });
      }
    }

    // Create payout request
    const request = await PayoutRequest.create({
      publisherId,
      grossAmount:       balance.gross,
      platformFeeAmount: balance.feeTotal,
      netAmount:         balance.net,
      orderIds:          balance.orderIds,
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) { next(err); }
};

// ── GET /api/payouts — admin: all; publisher: own ────────────────────────────
exports.getPayouts = async (req, res, next) => {
  try {
    const filter = isAdmin(req.admin) ? {} : { publisherId: req.admin._id };
    const payouts = await PayoutRequest.find(filter)
      .populate('publisherId', 'fullName email publisherName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: payouts.length, data: payouts });
  } catch (err) { next(err); }
};

// ── PUT /api/payouts/:id/approve — admin only ─────────────────────────────────
exports.approvePayout = async (req, res, next) => {
  try {
    const payout = await PayoutRequest.findById(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout request not found.' });
    if (payout.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending requests can be approved.' });
    }
    payout.status     = 'approved';
    payout.approvedAt = new Date();
    await payout.save();
    res.json({ success: true, data: payout });
  } catch (err) { next(err); }
};

// ── PUT /api/payouts/:id/reject — admin only ──────────────────────────────────
exports.rejectPayout = async (req, res, next) => {
  try {
    const payout = await PayoutRequest.findById(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout request not found.' });
    if (!['pending', 'approved'].includes(payout.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reject this request.' });
    }
    payout.status         = 'rejected';
    payout.rejectedAt     = new Date();
    payout.rejectedReason = req.body.reason ?? '';
    await payout.save();
    res.json({ success: true, data: payout });
  } catch (err) { next(err); }
};

// ── PUT /api/payouts/:id/mark-paid — admin only ───────────────────────────────
exports.markPaid = async (req, res, next) => {
  try {
    const payout = await PayoutRequest.findById(req.params.id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout request not found.' });
    if (payout.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved requests can be marked as paid.' });
    }
    payout.status = 'paid';
    payout.paidAt = new Date();
    await payout.save();
    res.json({ success: true, data: payout });
  } catch (err) { next(err); }
};
