/**
 * Helper functions for handling document URLs with CloudFront
 */

const { AWS_CONFIG } = require('../config/aws');

/**
 * Convert document URLs to CloudFront URLs
 * @param {Object} documents - User documents object
 * @returns {Object} - Documents with CloudFront URLs
 */
const formatDocumentUrls = (documents) => {
  if (!documents) return null;
  
  const formatted = {};
  
  // Format Aadhar documents
  if (documents.aadhar) {
    formatted.aadhar = {
      ...documents.aadhar,
      front: getCloudFrontUrl(documents.aadhar.front),
      back: getCloudFrontUrl(documents.aadhar.back),
    };
  }
  
  // Format PAN document
  if (documents.pan) {
    formatted.pan = {
      ...documents.pan,
      image: getCloudFrontUrl(documents.pan.image),
    };
  }
  
  // Format other documents
  if (documents.other && Array.isArray(documents.other)) {
    formatted.other = documents.other.map(doc => ({
      ...doc,
      url: getCloudFrontUrl(doc.url || doc),
    }));
  }
  
  return formatted;
};

/**
 * Get CloudFront URL from S3 key or existing URL
 * @param {String} location - S3 key or URL
 * @returns {String} - CloudFront URL
 */
const getCloudFrontUrl = (location) => {
  if (!location) return null;
  
  // If it's already a CloudFront URL, return as is
  if (location.includes('cloudfront.net') || location.startsWith('https://')) {
    return location;
  }
  
  // If it's an S3 key (starts with documents/ or images/), convert to CloudFront URL
  if (location.startsWith('documents/') || location.startsWith('images/')) {
    return `${AWS_CONFIG.CLOUDFRONT_URL}/${location}`;
  }
  
  // If it's just a filename, assume it's in documents folder
  if (!location.includes('/')) {
    return `${AWS_CONFIG.CLOUDFRONT_URL}/documents/${location}`;
  }
  
  // Default: prepend CloudFront URL
  return `${AWS_CONFIG.CLOUDFRONT_URL}/${location}`;
};

/**
 * Format user object with CloudFront URLs for documents
 * @param {Object} user - User object from MongoDB
 * @returns {Object} - User object with formatted document URLs
 */
const formatUserDocuments = (user) => {
  if (!user) return user;
  
  const userObj = user.toObject ? user.toObject() : { ...user };
  
  if (userObj.documents) {
    userObj.documents = formatDocumentUrls(userObj.documents);
  }
  
  return userObj;
};

module.exports = {
  formatDocumentUrls,
  getCloudFrontUrl,
  formatUserDocuments,
};

