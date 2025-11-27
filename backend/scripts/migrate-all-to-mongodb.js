/**
 * Migration Script: Migrate All Data to MongoDB
 * 
 * This script ensures all application data is stored in MongoDB:
 * - Users (already in MongoDB)
 * - Silver Rates (already in MongoDB)
 * - Store Information (migrate to MongoDB if not already)
 * - Admin users (ensure exists)
 * 
 * Run: node scripts/migrate-all-to-mongodb.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const SilverRate = require('../models/SilverRate');
const StoreInfo = require('../models/StoreInfo');

async function migrateAllToMongoDB() {
  try {
    console.log('🔄 Starting migration to MongoDB...\n');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // 1. Migrate/Verify Users
    console.log('👥 Checking Users collection...');
    const userCount = await User.countDocuments();
    console.log(`   Found ${userCount} users in MongoDB`);
    console.log('✅ Users are stored in MongoDB\n');

    // 2. Migrate/Verify Silver Rates
    console.log('💰 Checking Silver Rates collection...');
    const rateCount = await SilverRate.countDocuments();
    console.log(`   Found ${rateCount} rates in MongoDB`);
    
    if (rateCount === 0) {
      console.log('   ⚠️  No rates found. Initializing default rates...');
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
      console.log(`   ✅ Initialized ${defaultRates.length} default rates`);
    }
    console.log('✅ Silver Rates are stored in MongoDB\n');

    // 3. Migrate/Verify Store Information
    console.log('🏪 Checking Store Information...');
    try {
      const storeInfo = await StoreInfo.getStoreInfo();
      console.log('   ✅ Store information exists in MongoDB');
      console.log(`   Address: ${storeInfo.address}`);
      console.log(`   Phone: ${storeInfo.phoneNumber}`);
    } catch (storeError) {
      console.log('   ⚠️  Store info not found, creating default...');
      const defaultStore = new StoreInfo({
        welcomeMessage: 'Welcome to Jain Silver - Your trusted partner for premium silver products.',
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
      await defaultStore.save();
      console.log('   ✅ Default store information created');
    }
    console.log('✅ Store Information is stored in MongoDB\n');

    // 4. Verify Admin User
    console.log('👤 Checking Admin User...');
    const adminCount = await User.countDocuments({ role: 'admin' });
    console.log(`   Found ${adminCount} admin user(s) in MongoDB`);
    
    if (adminCount === 0) {
      console.log('   ⚠️  No admin user found. Creating default admin...');
      const { initAdmin } = require('../utils/initAdmin');
      await initAdmin();
      console.log('   ✅ Admin user created');
    }
    console.log('✅ Admin users are stored in MongoDB\n');

    // Summary
    console.log('📊 Migration Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Users: ${await User.countDocuments()} documents`);
    console.log(`✅ Silver Rates: ${await SilverRate.countDocuments()} documents`);
    console.log(`✅ Store Info: ${await StoreInfo.countDocuments()} document(s)`);
    console.log(`✅ Admin Users: ${await User.countDocuments({ role: 'admin' })} user(s)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('🎉 All data successfully migrated to MongoDB!');
    console.log('✅ All application data is now stored in MongoDB\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run migration
migrateAllToMongoDB();

