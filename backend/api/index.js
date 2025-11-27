// Vercel serverless function entry point
// This file is used when deploying to Vercel

// Set Vercel environment variables first - MUST be set before requiring server
process.env.VERCEL = 'true';

// Import the Express app with comprehensive error handling
let app;

try {
  // Import server - this will set up the Express app
  // The server.js file will detect VERCEL=true and configure accordingly
  app = require('../server');
  
  // Verify app is valid
  if (!app || typeof app.use !== 'function') {
    throw new Error('Invalid Express app exported from server.js');
  }
  
  console.log('✅ Server loaded successfully for Vercel');
} catch (error) {
  console.error('❌ Error loading server:', error.message);
  console.error('Error name:', error.name);
  if (error.stack) {
    console.error('Error stack:', error.stack);
  }
  
  // Create a minimal error handler app
  const express = require('express');
  app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'error', message: 'Server initialization failed' });
  });
  
  // Error handler route
  app.use((req, res) => {
    res.status(500).json({ 
      error: 'Server initialization failed', 
      message: error.message,
      errorType: error.name,
      // Only show stack in development
      ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {})
    });
  });
  
  console.log('⚠️  Using fallback error handler app');
}

// Export the Express app for Vercel
// Vercel will automatically handle Express apps
module.exports = app;

