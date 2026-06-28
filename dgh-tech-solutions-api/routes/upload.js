const express    = require('express');
const { protect } = require('../middleware/auth');
const { uploadThumbnail, uploadPdf } = require('../middleware/upload');
const { uploadFile, getPresignedUrl } = require('../controllers/uploadController');

const router = express.Router();

// File uploads — admin only
router.post('/thumbnail', protect, (req, res, next) => {
  uploadThumbnail(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    uploadFile(req, res);
  });
});

router.post('/pdf', protect, (req, res, next) => {
  uploadPdf(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    uploadFile(req, res);
  });
});


// Generate presigned URL for a private S3 key (admin only)
router.get('/presign', protect, getPresignedUrl);

module.exports = router;
