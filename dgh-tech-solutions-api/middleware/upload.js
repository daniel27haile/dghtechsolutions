const multer   = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_PDF_TYPES   = ['application/pdf'];

// Lazy-initialised — only created when a real upload request arrives so that
// the module can be required even if AWS env vars are not yet set.
let _s3;
function getS3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3;
}

function buildUpload({ folder, allowedTypes, maxSizeMB }) {
  // Return a middleware wrapper that constructs multer on the first call
  return function (req, res, next) {
    const upload = multer({
      storage: multerS3({
        s3:     getS3(),
        bucket: process.env.AWS_S3_BUCKET,
        key(req, file, cb) {
          const ext  = path.extname(file.originalname).toLowerCase();
          const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
          cb(null, `${folder}/${name}`);
        },
      }),
      limits:    { fileSize: maxSizeMB * 1024 * 1024 },
      fileFilter(_req, file, cb) {
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`));
        }
      },
    });
    upload.single(folder === 'thumbnails' ? 'thumbnail' : 'pdf')(req, res, next);
  };
}

/** Upload a single thumbnail image */
exports.uploadThumbnail = buildUpload({
  folder:       'thumbnails',
  allowedTypes: ALLOWED_IMAGE_TYPES,
  maxSizeMB:    5,
});

/** Upload a single PDF file */
exports.uploadPdf = buildUpload({
  folder:       'pdfs',
  allowedTypes: ALLOWED_PDF_TYPES,
  maxSizeMB:    50,
});

exports.getS3 = getS3;
