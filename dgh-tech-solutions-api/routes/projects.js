const express = require('express');
const { body } = require('express-validator');
const {
  getPublishedProjects,
  getFeaturedProjects,
  getProjectById,
  getAllProjectsAdmin,
  createProject,
  updateProject,
  deleteProject,
  togglePublish,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const projectValidation = [
  body('title').notEmpty().withMessage('Title is required').trim().escape(),
  body('shortDescription').notEmpty().withMessage('Short description is required').trim(),
  body('category').notEmpty().withMessage('Category is required'),
];

// Admin routes — must come before /:id to prevent "admin" being treated as an id
router.get('/admin', protect, getAllProjectsAdmin);
router.get('/admin/all', protect, getAllProjectsAdmin);
router.post('/admin', protect, projectValidation, createProject);
router.put('/admin/:id', protect, updateProject);
router.delete('/admin/:id', protect, deleteProject);
router.patch('/admin/:id/toggle-publish', protect, togglePublish);

// Public routes — named paths must come before /:id wildcard
router.get('/', getPublishedProjects);
router.get('/featured', getFeaturedProjects);
router.post('/', protect, projectValidation, createProject);
router.get('/:id', getProjectById);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.patch('/:id/toggle-publish', protect, togglePublish);

module.exports = router;
