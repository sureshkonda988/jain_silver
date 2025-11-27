const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3Client, AWS_CONFIG } = require('../config/aws');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name
 * @param {String} folder - Folder path in S3 (e.g., 'documents', 'images')
 * @param {String} contentType - MIME type (e.g., 'image/jpeg', 'application/pdf')
 * @returns {Promise<String>} - S3 key (path) of uploaded file
 */
const uploadToS3 = async (fileBuffer, fileName, folder = 'documents', contentType = 'application/octet-stream') => {
  try {
    const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}-${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: AWS_CONFIG.S3_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Make files publicly accessible
    });

    await s3Client.send(command);
    
    // Return CloudFront URL
    const fileUrl = `${AWS_CONFIG.CLOUDFRONT_URL}/${key}`;
    return { key, url: fileUrl };
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Get signed URL for S3 object (for private files)
 * @param {String} key - S3 key
 * @param {Number} expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns {Promise<String>} - Signed URL
 */
const getSignedUrlForS3 = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: AWS_CONFIG.S3_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('S3 Signed URL Error:', error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {String} key - S3 key
 * @returns {Promise<Boolean>} - Success status
 */
const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: AWS_CONFIG.S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Extract S3 key from CloudFront URL
 * @param {String} url - CloudFront URL
 * @returns {String} - S3 key
 */
const extractKeyFromUrl = (url) => {
  if (!url) return null;
  // Remove CloudFront domain to get the key
  const key = url.replace(AWS_CONFIG.CLOUDFRONT_URL + '/', '');
  return key;
};

module.exports = {
  uploadToS3,
  getSignedUrlForS3,
  deleteFromS3,
  extractKeyFromUrl,
};

