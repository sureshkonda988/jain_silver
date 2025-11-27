const multer = require('multer');
const { uploadToS3 } = require('./s3Upload');
const path = require('path');

// Custom storage for multer that uploads to S3
const s3Storage = multer.memoryStorage();

const upload = multer({
  storage: s3Storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDF files are allowed'));
  }
});

// Middleware to upload files to S3 after multer processes them
const uploadToS3Middleware = async (req, res, next) => {
  try {
    if (req.files) {
      for (const fieldName in req.files) {
        const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];
        for (const file of files) {
          if (file.buffer) {
            const { key, url } = await uploadToS3(
              file.buffer,
              file.originalname,
              'documents',
              file.mimetype
            );
            file.location = url;
            file.key = key;
          }
        }
      }
    }
    next();
  } catch (error) {
    console.error('S3 upload middleware error:', error);
    return res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};

// Helper to get CloudFront URL from S3 location
const getFileUrl = (s3Location) => {
  if (!s3Location) return null;
  // If it's already a CloudFront URL, return as is
  const { AWS_CONFIG } = require('../config/aws');
  if (s3Location.includes('cloudfront.net')) {
    return s3Location;
  }
  // If it's an S3 key, convert to CloudFront URL
  return `${AWS_CONFIG.CLOUDFRONT_URL}/${s3Location}`;
};

module.exports = {
  upload,
  uploadToS3Middleware,
  getFileUrl,
};

