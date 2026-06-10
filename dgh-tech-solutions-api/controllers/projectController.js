const { validationResult } = require('express-validator');
const Project = require('../models/Project');

/**
 * GET /api/projects
 * Public — returns all published projects sorted by sortOrder.
 */
const getPublishedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ isPublished: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('-__v');
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/featured
 * Public — returns published + featured projects sorted by sortOrder.
 */
const getFeaturedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ isPublished: true, isFeatured: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .select('-__v');
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/projects/:id
 * Public — returns a single published project by ID or slug.
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/)
      ? { _id: id, isPublished: true }
      : { slug: id, isPublished: true };

    const project = await Project.findOne(query).select('-__v');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/projects
 * Admin — returns all projects (published and unpublished).
 */
const getAllProjectsAdmin = async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ sortOrder: 1, createdAt: -1 }).select('-__v');
    res.status(200).json({ success: true, count: projects.length, data: projects });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/projects
 * Admin — create a new project.
 */
const createProject = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const project = await Project.create(req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/projects/:id
 * Admin — update a project.
 */
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: false }
    ).select('-__v');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, data: project });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/projects/:id
 * Admin — delete a project.
 */
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/projects/:id/toggle-publish
 * Admin — toggle project publish status.
 */
const togglePublish = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    project.isPublished = !project.isPublished;
    await project.save();
    res.status(200).json({
      success: true,
      data: project,
      message: `Project ${project.isPublished ? 'published' : 'unpublished'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublishedProjects,
  getFeaturedProjects,
  getProjectById,
  getAllProjectsAdmin,
  createProject,
  updateProject,
  deleteProject,
  togglePublish,
};
