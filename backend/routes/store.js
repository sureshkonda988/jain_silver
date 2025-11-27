const express = require('express');
const router = express.Router();
const StoreInfo = require('../models/Store');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Root route - get store information from MongoDB
router.get('/', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Try to connect
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        });
      } catch (connError) {
        console.error('MongoDB connection failed, returning default data:', connError);
        // Return default data if MongoDB not connected
        return res.json({
        welcomeMessage: 'Welcome to Jain Silver - Your trusted partner for premium silver products. We offer the best quality silver coins, bars, and jewelry with transparent pricing and excellent customer service.',
        address: 'Andhra Pradesh, India',
        phoneNumber: '+91 98480 34323',
        storeTimings: [
          { day: 'Monday', openTime: '09:00 AM', closeTime: '08:00 PM', isClosed: false },
          { day: 'Tuesday', openTime: '09:00 AM', closeTime: '08:00 PM', isClosed: false },
          { day: 'Wednesday', openTime: '09:00 AM', closeTime: '08:00 PM', isClosed: false },
          { day: 'Thursday', openTime: '09:00 AM', closeTime: '08:00 PM', isClosed: false },
          { day: 'Friday', openTime: '09:00 AM', closeTime: '08:00 PM', isClosed: false },
          { day: 'Saturday', openTime: '09:00 AM', closeTime: '08:00 PM', isClosed: false },
          { day: 'Sunday', openTime: '10:00 AM', closeTime: '06:00 PM', isClosed: false },
        ],
        instagram: 'https://www.instagram.com/jainsilverplaza?igsh=MWJrcWlzbjVhcW1jNw==',
        facebook: 'https://www.facebook.com/share/1CaCEfRxST/',
        youtube: 'https://youtube.com/@jainsilverplaza6932?si=IluQGMU-eNMVx75A',
        bankDetails: [
          {
            bankName: 'Bank Name',
            accountNumber: 'XXXXXXXXXXXX',
            ifscCode: 'XXXX0000000',
            accountHolderName: 'Jain Silver',
            branch: 'Branch Name',
          }
        ]
        });
        return;
      }
    }
    
    const storeInfo = await StoreInfo.getStoreInfo();
    res.json(storeInfo);
  } catch (error) {
    console.error('Get store info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get store information (public endpoint) - alias for root
router.get('/info', async (req, res) => {
  try {
    // Ensure MongoDB connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        });
      } catch (connError) {
        console.error('MongoDB connection failed:', connError);
        return res.status(503).json({ 
          message: 'Database connection unavailable', 
          error: 'Service temporarily unavailable' 
        });
      }
    }
    
    const storeInfo = await StoreInfo.getStoreInfo();
    res.json(storeInfo);
  } catch (error) {
    console.error('Get store info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update store information (admin only)
router.put('/info', auth, adminAuth, async (req, res) => {
  try {
    let storeInfo = await StoreInfo.findOne();
    
    if (!storeInfo) {
      storeInfo = new StoreInfo(req.body);
    } else {
      Object.assign(storeInfo, req.body);
    }
    
    await storeInfo.save();
    
    res.json({
      message: 'Store information updated successfully',
      storeInfo
    });
  } catch (error) {
    console.error('Update store info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update store information (admin only - can be added later)
// router.put('/info', auth, adminAuth, async (req, res) => {
//   // Implementation for updating store info
// });

module.exports = router;

