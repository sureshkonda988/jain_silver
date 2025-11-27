// Vercel serverless function entry point
// This file is used when deploying to Vercel
process.env.VERCEL = 'true';

// Import the Express app
let app;
try {
  app = require('../server');
} catch (error) {
  console.error('Error loading server:', error);
  // Create a minimal error handler app
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({ 
      error: 'Server initialization failed', 
      message: error.message 
    });
  });
}

// Export the Express app for Vercel
// Vercel will automatically handle Express apps
module.exports = app;

