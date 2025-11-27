// Vercel serverless function entry point
// This file is used when deploying to Vercel
process.env.VERCEL = 'true';

// Import the Express app
let app;
try {
  // Set Vercel environment before requiring server
  process.env.VERCEL = 'true';
  app = require('../server');
} catch (error) {
  console.error('Error loading server:', error);
  console.error('Error stack:', error.stack);
  // Create a minimal error handler app
  const express = require('express');
  app = express();
  app.use(express.json());
  app.use((req, res) => {
    res.status(500).json({ 
      error: 'Server initialization failed', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  });
}

// Export the Express app for Vercel
// Vercel will automatically handle Express apps
module.exports = app;

