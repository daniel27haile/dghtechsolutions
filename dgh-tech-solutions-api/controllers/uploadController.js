const { GetObjectCommand }    = require('@aws-sdk/client-s3');
const { getSignedUrl }        = require('@aws-sdk/s3-request-presigner');
const { getS3 }               = require('../middleware/upload');

/** After multer-s3 runs, return the S3 key stored in req.file */
exports.uploadFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }
  // multer-s3 stores the S3 key in req.file.key
  res.json({ success: true, data: { key: req.file.key } });
};

/** Generate a short-lived presigned GET URL for a private S3 object */
exports.getPresignedUrl = async (req, res, next) => {
  try {
    const { key } = req.query; // e.g. ?key=pdfs/filename.pdf
    if (!key) {
      return res.status(400).json({ success: false, message: 'key query param is required.' });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key:    key,
    });
    const url = await getSignedUrl(getS3(), command, { expiresIn: 3600 }); // 1 hour
    res.json({ success: true, data: { url } });
  } catch (err) { next(err); }
};
