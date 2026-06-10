const crypto = require('crypto');
const { validationResult } = require('express-validator');
const ContactMessage = require('../models/ContactMessage');

/**
 * Hash a string (used for visitor identifier — no raw IP stored).
 */
const hashValue = (value) =>
  crypto.createHash('sha256').update(value || '').digest('hex').slice(0, 16);

/**
 * POST /api/contact
 * Public — submit a contact message. Rate-limited.
 */
const submitContact = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, message, phone, company, serviceInterest } = req.body;
    const ip = req.ip || req.connection.remoteAddress || '';

    const contactMessage = await ContactMessage.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: serviceInterest ? `Service Inquiry: ${serviceInterest}` : 'General Inquiry',
      message: message.trim(),
      phone: phone ? phone.trim() : '',
      company: company ? company.trim() : '',
      serviceInterest: serviceInterest ? serviceInterest.trim() : '',
      ipHash: hashValue(ip),
    });

    res.status(201).json({
      success: true,
      message: 'Your message has been received. We will get back to you shortly.',
      id: contactMessage._id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/messages
 * Admin — list all contact messages.
 */
const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const messages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('-__v');

    const total = await ContactMessage.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: messages,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/contact/messages/:id/status
 * Admin — update message status: new | read | replied | archived
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const valid = ['new', 'read', 'replied', 'archived'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${valid.join(', ')}` });
    }
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/contact/messages/:id/status (legacy alias — kept for backwards compat)
 */
const markAsRead = updateStatus;

/**
 * DELETE /api/admin/messages/:id
 * Admin — delete a contact message.
 */
const deleteMessage = async (req, res, next) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContact, getMessages, updateStatus, markAsRead, deleteMessage };
