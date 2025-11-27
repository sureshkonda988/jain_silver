const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SilverRate = require('../models/SilverRate');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Root route - get admin dashboard data from MongoDB
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      // Try to connect
      try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
        });
      } catch (connError) {
        console.error('MongoDB connection failed, returning default dashboard:', connError);
        return res.json({
        message: 'Admin API',
        dashboard: {
          users: {
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
            verified: 0,
            note: 'MongoDB connection not ready'
          },
          rates: {
            total: 0
          },
          recentUsers: []
        },
        endpoints: {
          pendingUsers: 'GET /api/admin/pending-users',
          allUsers: 'GET /api/admin/users',
          userDetails: 'GET /api/admin/user/:userId',
          approveUser: 'PUT /api/admin/approve-user/:userId',
          rejectUser: 'PUT /api/admin/reject-user/:userId'
        }
        });
        return;
      }
    }

    const totalUsers = await User.countDocuments();
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const pendingUsers = await User.countDocuments({ status: 'pending', isVerified: true });
    const rejectedUsers = await User.countDocuments({ status: 'rejected' });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const totalRates = await SilverRate.countDocuments();
    
    const recentUsers = await User.find()
      .select('-password -otp -resetPasswordOTP')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      message: 'Admin API',
      dashboard: {
        users: {
          total: totalUsers,
          approved: approvedUsers,
          pending: pendingUsers,
          rejected: rejectedUsers,
          verified: verifiedUsers
        },
        rates: {
          total: totalRates
        },
        recentUsers
      },
      endpoints: {
        pendingUsers: 'GET /api/admin/pending-users',
        allUsers: 'GET /api/admin/users',
        userDetails: 'GET /api/admin/user/:userId',
        approveUser: 'PUT /api/admin/approve-user/:userId',
        rejectUser: 'PUT /api/admin/reject-user/:userId'
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending users
router.get('/pending-users', auth, adminAuth, async (req, res) => {
  try {
    const users = await User.find({ 
      status: 'pending',
      isVerified: true
    }).select('-password -otp -resetPasswordOTP').sort({ createdAt: -1 });

    // Format document URLs with CloudFront
    const { formatUserDocuments } = require('../utils/documentHelper');
    const formattedUsers = users.map(user => formatUserDocuments(user));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get pending users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const users = await User.find(query)
      .select('-password -otp -resetPasswordOTP')
      .sort({ createdAt: -1 });

    // Format document URLs with CloudFront
    const { formatUserDocuments } = require('../utils/documentHelper');
    const formattedUsers = users.map(user => formatUserDocuments(user));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve user
router.put('/approve-user/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'approved';
    user.approvedBy = req.user.userId;
    user.approvedAt = new Date();
    await user.save();

    res.json({
      message: 'User approved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reject user
router.put('/reject-user/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'rejected';
    user.approvedBy = req.user.userId;
    user.approvedAt = new Date();
    await user.save();

    res.json({
      message: 'User rejected successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        reason: reason || 'No reason provided'
      }
    });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user details with documents
router.get('/user/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password -otp -resetPasswordOTP');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format document URLs with CloudFront
    const { formatUserDocuments } = require('../utils/documentHelper');
    const formattedUser = formatUserDocuments(user);

    res.json(formattedUser);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

