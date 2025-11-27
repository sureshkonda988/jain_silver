const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToS3 } = require('./s3Upload');
const { platform, fileStorage } = require('../config/platform');

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

// Middleware to upload files to S3 or local storage based on platform
const uploadToS3Middleware = async (req, res, next) => {
  try {
    if (req.files) {
      for (const fieldName in req.files) {
        const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];
        for (const file of files) {
          if (file.buffer) {
            // Use S3 if configured and available
            if (fileStorage.useS3) {
              try {
                const { key, url } = await uploadToS3(
                  file.buffer,
                  file.originalname,
                  'documents',
                  file.mimetype
                );
                file.location = url;
                file.key = key;
                file.storage = 's3';
              } catch (s3Error) {
                console.error('S3 upload failed, falling back to local:', s3Error);
                // Fallback to local if S3 fails and platform allows it
                if (fileStorage.fallbackToLocal) {
                  await saveToLocal(file);
                } else {
                  throw s3Error; // Vercel requires S3
                }
              }
            } else if (fileStorage.fallbackToLocal) {
              // Use local storage
              await saveToLocal(file);
            } else {
              throw new Error('File storage not configured. S3 is required for this platform.');
            }
          }
        }
      }
    }
    next();
  } catch (error) {
    console.error('File upload middleware error:', error);
    return res.status(500).json({ message: 'File upload failed', error: error.message });
  }
};

// Save file to local storage (for non-Vercel, non-AWS deployments)
const saveToLocal = async (file) => {
  const uploadPath = 'uploads/documents';
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
  const filepath = path.join(uploadPath, filename);
  
  fs.writeFileSync(filepath, file.buffer);
  
  file.location = `/uploads/documents/${filename}`;
  file.path = filepath;
  file.filename = filename;
  file.storage = 'local';
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

