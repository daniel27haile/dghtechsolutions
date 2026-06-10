const { validationResult } = require('express-validator');
const Service = require('../models/Service');

/**
 * GET /api/services
 * Public — returns all active services sorted by sortOrder.
 */
const getActiveServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isPublished: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('-__v');
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/services
 * Admin — returns all services.
 */
const getAllServicesAdmin = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ sortOrder: 1, createdAt: -1 }).select('-__v');
    res.status(200).json({ success: true, count: services.length, data: services });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/services
 * Admin — create a new service.
 */
const createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const service = await Service.create(req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/services/:id
 * Admin — update a service.
 */
const updateService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false }
    ).select('-__v');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/services/:id
 * Admin — delete a service.
 */
const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.status(200).json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getActiveServices, getAllServicesAdmin, createService, updateService, deleteService };
