// Vercel serverless function entry point
// This file is used when deploying to Vercel
process.env.VERCEL = 'true';

// Import the Express app
const app = require('../server');

// Export the Express app for Vercel
// Vercel will automatically handle Express apps
module.exports = app;

