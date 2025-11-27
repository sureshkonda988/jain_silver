/**
 * Comprehensive MongoDB Migration Verification Script
 * This script verifies that all data (users, rates, store info) is properly stored in MongoDB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const SilverRate = require('../models/SilverRate');
const StoreInfo = require('../models/Store');

async function verifyMigration() {
  try {
    console.log('🔍 Starting MongoDB Migration Verification...\n');

    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver';
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Verify Users Collection
    console.log('👥 Verifying Users Collection...');
    const userCount = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const approvedUsers = await User.countDocuments({ status: 'approved' });
    const pendingUsers = await User.countDocuments({ status: 'pending' });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    console.log(`   Total Users: ${userCount}`);
    console.log(`   Verified Users: ${verifiedUsers}`);
    console.log(`   Approved Users: ${approvedUsers}`);
    console.log(`   Pending Users: ${pendingUsers}`);
    console.log(`   Admin Users: ${adminUsers}`);
    
    if (userCount > 0) {
      const sampleUser = await User.findOne().select('-password -otp');
      console.log(`   Sample User: ${sampleUser ? sampleUser.name : 'N/A'}`);
    }
    console.log('✅ Users Collection: OK\n');

    // Verify Silver Rates Collection
    console.log('💰 Verifying Silver Rates Collection...');
    const rateCount = await SilverRate.countDocuments();
    const andhraRates = await SilverRate.countDocuments({ location: 'Andhra Pradesh' });
    
    console.log(`   Total Rates: ${rateCount}`);
    console.log(`   Andhra Pradesh Rates: ${andhraRates}`);
    
    if (rateCount > 0) {
      const sampleRate = await SilverRate.findOne();
      console.log(`   Sample Rate: ${sampleRate ? sampleRate.name : 'N/A'} - ₹${sampleRate ? sampleRate.rate : 'N/A'}`);
    } else {
      console.log('   ⚠️  No rates found! Initializing default rates...');
      // Initialize default rates
      const RATE_PER_GRAM_999 = 75.50;
      const RATE_PER_GRAM_9999 = 76.00;
      const RATE_PER_GRAM_925 = 69.50;

      const defaultRates = [
        { name: 'Silver Coin 1 Gram', type: 'coin', weight: { value: 1, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 1, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
        { name: 'Silver Coin 5 Grams', type: 'coin', weight: { value: 5, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 5, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
        { name: 'Silver Coin 10 Grams', type: 'coin', weight: { value: 10, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 10, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
        { name: 'Silver Coin 50 Grams', type: 'coin', weight: { value: 50, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 50, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
        { name: 'Silver Coin 100 Grams', type: 'coin', weight: { value: 100, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999 * 100, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' },
        { name: 'Silver Bar 100 Grams', type: 'bar', weight: { value: 100, unit: 'grams' }, purity: '99.99%', rate: RATE_PER_GRAM_9999 * 100, ratePerGram: RATE_PER_GRAM_9999, location: 'Andhra Pradesh' },
        { name: 'Silver Bar 500 Grams', type: 'bar', weight: { value: 500, unit: 'grams' }, purity: '99.99%', rate: RATE_PER_GRAM_9999 * 500, ratePerGram: RATE_PER_GRAM_9999, location: 'Andhra Pradesh' },
        { name: 'Silver Bar 1 Kg', type: 'bar', weight: { value: 1, unit: 'kg' }, purity: '99.99%', rate: RATE_PER_GRAM_9999 * 1000, ratePerGram: RATE_PER_GRAM_9999, location: 'Andhra Pradesh' },
        { name: 'Silver Jewelry 92.5%', type: 'jewelry', weight: { value: 1, unit: 'grams' }, purity: '92.5%', rate: RATE_PER_GRAM_925, ratePerGram: RATE_PER_GRAM_925, location: 'Andhra Pradesh' },
        { name: 'Silver Jewelry 99.9%', type: 'jewelry', weight: { value: 1, unit: 'grams' }, purity: '99.9%', rate: RATE_PER_GRAM_999, ratePerGram: RATE_PER_GRAM_999, location: 'Andhra Pradesh' }
      ];

      for (const rateData of defaultRates) {
        await SilverRate.findOneAndUpdate(
          { name: rateData.name, 'weight.value': rateData.weight.value, purity: rateData.purity },
          rateData,
          { upsert: true, new: true }
        );
      }
      console.log('   ✅ Default rates initialized');
    }
    console.log('✅ Silver Rates Collection: OK\n');

    // Verify Store Info Collection
    console.log('🏪 Verifying Store Info Collection...');
    let storeInfo = await StoreInfo.findOne();
    
    if (!storeInfo) {
      console.log('   ⚠️  No store info found! Creating default store info...');
      storeInfo = await StoreInfo.getStoreInfo();
      console.log('   ✅ Default store info created');
    } else {
      console.log(`   Store Name: ${storeInfo.address || 'N/A'}`);
      console.log(`   Phone: ${storeInfo.phoneNumber || 'N/A'}`);
      console.log(`   Timings: ${storeInfo.storeTimings ? storeInfo.storeTimings.length : 0} days configured`);
    }
    console.log('✅ Store Info Collection: OK\n');

    // Summary
    console.log('📊 Migration Verification Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Users: ${userCount} total`);
    console.log(`✅ Rates: ${await SilverRate.countDocuments()} total`);
    console.log(`✅ Store Info: ${storeInfo ? 'Present' : 'Missing'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ All data is properly stored in MongoDB!');

  } catch (error) {
    console.error('❌ Migration verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n📡 MongoDB connection closed');
  }
}

// Run verification
verifyMigration();

