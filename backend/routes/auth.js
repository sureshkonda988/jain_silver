const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const otpGenerator = require('otp-generator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Root route - get auth statistics from MongoDB
router.get('/', async (req, res) => {
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
        console.error('MongoDB connection failed, returning default stats:', connError);
        return res.json({
        message: 'Auth API',
        statistics: {
          totalUsers: 0,
          verifiedUsers: 0,
          approvedUsers: 0,
          pendingUsers: 0,
          adminUsers: 0,
          note: 'MongoDB connection not ready'
        },
        endpoints: {
          register: 'POST /api/auth/register',
          verifyOtp: 'POST /api/auth/verify-otp',
          resendOtp: 'POST /api/auth/resend-otp',
          signin: 'POST /api/auth/signin',
          adminSignin: 'POST /api/auth/admin/signin',
          forgotPassword: 'POST /api/auth/forgot-password',
          verifyResetOtp: 'POST /api/auth/verify-reset-otp',
          resetPassword: 'POST /api/auth/reset-password'
        }
      });
    }

    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const adminUsers = await User.countDocuments({ role: 'admin' });

    res.json({
      message: 'Auth API',
      statistics: {
        totalUsers,
        verifiedUsers,
        approvedUsers,
        pendingUsers,
        adminUsers
      },
      endpoints: {
        register: 'POST /api/auth/register',
        verifyOtp: 'POST /api/auth/verify-otp',
        resendOtp: 'POST /api/auth/resend-otp',
        signin: 'POST /api/auth/signin',
        adminSignin: 'POST /api/auth/admin/signin',
        forgotPassword: 'POST /api/auth/forgot-password',
        verifyResetOtp: 'POST /api/auth/verify-reset-otp',
        resetPassword: 'POST /api/auth/reset-password'
      }
    });
  } catch (error) {
    console.error('Get auth stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Configure multer for S3 file uploads
const { upload, getFileUrl } = require('../utils/multerS3');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register new user
router.post('/register', 
  (req, res, next) => {
    // Handle multer errors
    upload.fields([
      { name: 'aadharFront', maxCount: 1 },
      { name: 'aadharBack', maxCount: 1 },
      { name: 'panImage', maxCount: 1 }
    ])(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File size too large. Maximum 5MB allowed.' });
        }
        if (err.message.includes('Only images')) {
          return res.status(400).json({ message: 'Only image files (JPEG, PNG) are allowed.' });
        }
        return res.status(400).json({ message: 'File upload error: ' + err.message });
      }
      next();
    });
  },
  require('../utils/multerS3').uploadToS3Middleware,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').custom((value) => {
      if (!value) {
        throw new Error('Phone number is required');
      }
      // Allow Indian phone numbers with or without country code
      const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
      const cleanedPhone = value.replace(/\s|-/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        throw new Error('Valid 10-digit Indian phone number is required');
      }
      return true;
    }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('aadharNumber').notEmpty().withMessage('Aadhar number is required'),
    body('panNumber').notEmpty().withMessage('PAN number is required')
  ],
  async (req, res) => {
    try {
      console.log('📝 Registration request received');
      console.log('Request body:', req.body);
      console.log('Request files:', req.files ? Object.keys(req.files) : 'No files');
      
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, phone, password, aadharNumber, panNumber } = req.body;

      // Normalize email and phone
      const normalizedEmail = email ? email.toLowerCase().trim() : '';
      // Normalize phone: remove spaces, dashes, and country code if present
      let normalizedPhone = phone ? phone.replace(/\s|-/g, '').trim() : '';
      // Remove +91 or 91 prefix if present
      if (normalizedPhone.startsWith('+91')) {
        normalizedPhone = normalizedPhone.substring(3);
      } else if (normalizedPhone.startsWith('91') && normalizedPhone.length === 12) {
        normalizedPhone = normalizedPhone.substring(2);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [
          { email: normalizedEmail }, 
          { phone: normalizedPhone }
        ] 
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'User with this email or phone already exists' 
        });
      }

      // Generate OTP
      const otp = otpGenerator.generate(6, { 
        upperCaseAlphabets: false, 
        lowerCaseAlphabets: false, 
        specialChars: false 
      });
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Validate file uploads
      if (!req.files || !req.files.aadharFront || !req.files.aadharBack || !req.files.panImage) {
        return res.status(400).json({ 
          message: 'All document images are required (Aadhar Front, Aadhar Back, PAN Image)' 
        });
      }

      // Get CloudFront URLs from S3 uploads
      const documents = {
        aadhar: {
          front: getFileUrl(req.files.aadharFront[0].location) || req.files.aadharFront[0].key,
          back: getFileUrl(req.files.aadharBack[0].location) || req.files.aadharBack[0].key,
          number: aadharNumber.trim()
        },
        pan: {
          image: getFileUrl(req.files.panImage[0].location) || req.files.panImage[0].key,
          number: panNumber.trim().toUpperCase()
        }
      };

      // Create user
      const user = new User({
        name: name.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password,
        documents,
        otp: {
          code: otp,
          expiresAt: otpExpiresAt
        },
        status: 'pending'
      });

      await user.save();

      // In production, send OTP via SMS/Email
      console.log(`✅ Registration successful for ${normalizedEmail || normalizedPhone}`);
      console.log(`📱 OTP for ${normalizedPhone || normalizedEmail}: ${otp}`);

      // Notify admin about new registration
      try {
        const { notifyAdminNewRegistration } = require('../utils/notifications');
        await notifyAdminNewRegistration({
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone
        });
      } catch (notifError) {
        console.error('Error sending admin notification:', notifError);
        // Don't fail registration if notification fails
      }

      res.status(201).json({
        message: 'Registration successful. Please verify OTP.',
        userId: user._id,
        otp: otp // Remove this in production
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({ 
          message: `User with this ${field} already exists` 
        });
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({ 
          message: 'Validation error', 
          errors 
        });
      }
      
      res.status(500).json({ 
        message: 'Server error', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error' 
      });
    }
  }
);

// Verify OTP
router.post('/verify-otp', 
  [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, otp } = req.body;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.otp || user.otp.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (new Date() > user.otp.expiresAt) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      user.isVerified = true;
      user.otp = undefined;
      await user.save();

      res.json({
        message: 'OTP verified successfully. Waiting for admin approval.',
        userId: user._id
      });
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Resend OTP
router.post('/resend-otp',
  [body('userId').notEmpty().withMessage('User ID is required')],
  async (req, res) => {
    try {
      const { userId } = req.body;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const otp = otpGenerator.generate(6, { 
        upperCaseAlphabets: false, 
        lowerCaseAlphabets: false, 
        specialChars: false 
      });
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.otp = {
        code: otp,
        expiresAt: otpExpiresAt
      };
      await user.save();

      // In production, send OTP via SMS/Email
      console.log(`Resent OTP for ${user.phone}: ${otp}`);
      console.log(`Demo OTP (for testing): ${otp}`);

      res.json({
        message: 'OTP resent successfully',
        otp: otp // Demo OTP - Remove this in production
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Sign in
router.post('/signin',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, phone, password } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ message: 'Email or phone is required' });
      }

      // Find user
      const user = await User.findOne(
        email ? { email: email.toLowerCase() } : { phone }
      );

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if user is approved
      if (user.status !== 'approved') {
        return res.status(403).json({ 
          message: `Account is ${user.status}. Please wait for admin approval.`,
          status: user.status
        });
      }

      // Generate token
      const token = generateToken(user._id);

      res.json({
        message: 'Sign in successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Sign in error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Admin sign in
router.post('/admin/signin',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ 
        email: email.toLowerCase(),
        role: 'admin'
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }

      const token = generateToken(user._id);

      res.json({
        message: 'Admin sign in successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Admin sign in error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Forgot Password - Request OTP
router.post('/forgot-password',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, phone } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ message: 'Email or phone is required' });
      }

      const user = await User.findOne(
        email ? { email: email.toLowerCase() } : { phone }
      );

      if (!user) {
        // Don't reveal if user exists for security
        return res.json({ 
          message: 'If the account exists, an OTP has been sent to your registered phone/email' 
        });
      }

      // Generate OTP for password reset
      const resetOtp = otpGenerator.generate(6, { 
        upperCaseAlphabets: false, 
        lowerCaseAlphabets: false, 
        specialChars: false 
      });
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store reset OTP in user document
      user.resetPasswordOTP = {
        code: resetOtp,
        expiresAt: otpExpiresAt
      };
      await user.save();

      // In production, send OTP via SMS/Email
      console.log(`Password reset OTP for ${user.phone || user.email}: ${resetOtp}`);
      console.log(`Demo OTP (for testing): ${resetOtp}`);

      res.json({
        message: 'OTP has been sent to your registered phone/email',
        otp: resetOtp // Demo OTP - Remove this in production
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Verify Reset OTP
router.post('/verify-reset-otp',
  [
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, phone, otp } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ message: 'Email or phone is required' });
      }

      const user = await User.findOne(
        email ? { email: email.toLowerCase() } : { phone }
      );

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (!user.resetPasswordOTP || user.resetPasswordOTP.code !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      if (new Date() > user.resetPasswordOTP.expiresAt) {
        return res.status(400).json({ message: 'OTP has expired' });
      }

      // Generate reset token (valid for 15 minutes)
      const resetToken = jwt.sign(
        { userId: user._id, type: 'password-reset' },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: '15m' }
      );

      // Clear the OTP after successful verification
      user.resetPasswordOTP = undefined;
      await user.save();

      res.json({
        message: 'OTP verified successfully',
        resetToken
      });
    } catch (error) {
      console.error('Verify reset OTP error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// Reset Password
router.post('/reset-password',
  [
    body('resetToken').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { resetToken, newPassword } = req.body;

      // Verify reset token
      let decoded;
      try {
        decoded = jwt.verify(
          resetToken,
          process.env.JWT_SECRET || 'your_jwt_secret_key_here'
        );
      } catch (error) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      if (decoded.type !== 'password-reset') {
        return res.status(400).json({ message: 'Invalid reset token' });
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Store old password hash for logging (before update)
      const oldPasswordHash = user.password;

      // Update password (will be hashed by pre-save hook)
      user.password = newPassword;
      user.markModified('password'); // Explicitly mark as modified to ensure pre-save hook runs
      await user.save();

      // Verify password was actually updated
      const passwordUpdated = user.password !== oldPasswordHash;
      
      console.log(`✅ Password reset successful for user: ${user.email || user.phone}`);
      console.log(`   Password updated: ${passwordUpdated ? 'YES' : 'NO'}`);
      console.log(`   User can now login with new password`);

      res.json({
        message: 'Password reset successfully. You can now login with your new password.'
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

module.exports = router;

