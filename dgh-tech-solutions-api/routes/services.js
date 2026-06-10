const express = require('express');
const { body } = require('express-validator');
const {
  getActiveServices,
  getAllServicesAdmin,
  createService,
  updateService,
  deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const serviceValidation = [
  body('title').notEmpty().withMessage('Title is required').trim().escape(),
  body('shortDescription').notEmpty().withMessage('Short description is required').trim(),
];

// Admin routes — must come before /:slug to avoid route conflicts
router.get('/admin', protect, getAllServicesAdmin);
router.get('/admin/all', protect, getAllServicesAdmin);
router.post('/admin', protect, serviceValidation, createService);
router.put('/admin/:id', protect, updateService);
router.delete('/admin/:id', protect, deleteService);

// Public routes
router.get('/', getActiveServices);
router.post('/', protect, serviceValidation, createService);
router.put('/:id', protect, updateService);
router.delete('/:id', protect, deleteService);

module.exports = router;
