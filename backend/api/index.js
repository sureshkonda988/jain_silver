// Vercel serverless function entry point
// This file is used when deploying to Vercel
process.env.VERCEL = 'true';
const app = require('../server');

// Export the Express app for Vercel
module.exports = app;

