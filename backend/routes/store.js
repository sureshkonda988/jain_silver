const express = require('express');
const router = express.Router();

// Store information model (can be stored in database or as static data)
// For now, using static data that can be updated via admin panel later

// Default store information
const defaultStoreInfo = {
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
    },
    // Add more bank accounts if needed
  ],
};

// Get store information (public endpoint)
router.get('/info', async (req, res) => {
  try {
    // In future, this can fetch from database
    // For now, return default info
    res.json(defaultStoreInfo);
  } catch (error) {
    console.error('Get store info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update store information (admin only - can be added later)
// router.put('/info', auth, adminAuth, async (req, res) => {
//   // Implementation for updating store info
// });

module.exports = router;

