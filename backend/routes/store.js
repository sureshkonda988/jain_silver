const express = require('express');
const router = express.Router();
const StoreInfo = require('../models/StoreInfo');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Root route - get store information from MongoDB
router.get('/', async (req, res) => {
  try {
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

