const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getSettings);
router.put('/', protect, updateSettings);

module.exports = router;
