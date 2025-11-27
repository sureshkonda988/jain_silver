/**
 * MongoDB Migration Script
 * Transfers all data from local MongoDB to MongoDB Atlas
 * 
 * Usage:
 *   node scripts/migrate-to-atlas.js
 * 
 * Make sure to set environment variables:
 *   SOURCE_MONGODB_URI=mongodb://localhost:27017/jain_silver (or your local DB)
 *   TARGET_MONGODB_URI=mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Source (Local) MongoDB URI
const SOURCE_URI = process.env.SOURCE_MONGODB_URI || 'mongodb://localhost:27017/jain_silver';

// Target (Atlas) MongoDB URI
const TARGET_URI = process.env.TARGET_MONGODB_URI || process.env.MONGODB_URI || 'mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority';

// Import models
const User = require('../models/User');
const SilverRate = require('../models/SilverRate');

let sourceConnection = null;
let targetConnection = null;

async function connectDatabases() {
  console.log('🔌 Connecting to databases...\n');
  
  try {
    // Connect to source (local) database
    console.log('📥 Connecting to SOURCE database (local)...');
    sourceConnection = await mongoose.createConnection(SOURCE_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    console.log('✅ Connected to SOURCE database\n');
    
    // Connect to target (Atlas) database
    console.log('📤 Connecting to TARGET database (Atlas)...');
    targetConnection = await mongoose.createConnection(TARGET_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    console.log('✅ Connected to TARGET database\n');
    
    return true;
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    throw error;
  }
}

async function migrateCollection(collectionName, sourceModel, targetModel) {
  console.log(`\n📦 Migrating ${collectionName}...`);
  
  try {
    // Get all documents from source
    const documents = await sourceModel.find({}).lean();
    console.log(`   Found ${documents.length} documents in source`);
    
    if (documents.length === 0) {
      console.log(`   ⚠️  No documents to migrate for ${collectionName}`);
      return { migrated: 0, skipped: 0, errors: 0 };
    }
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    
    // Migrate each document
    for (const doc of documents) {
      try {
        // Remove _id to let MongoDB generate new ones, or keep existing _id
        const docToInsert = { ...doc };
        
        // Use upsert to avoid duplicates
        const result = await targetModel.findOneAndUpdate(
          { _id: doc._id },
          docToInsert,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        
        if (result) {
          migrated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`   ❌ Error migrating document ${doc._id}:`, error.message);
        errors++;
      }
    }
    
    console.log(`   ✅ Migrated: ${migrated}, Skipped: ${skipped}, Errors: ${errors}`);
    return { migrated, skipped, errors };
  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
    throw error;
  }
}

async function migrateUsers() {
  console.log('\n👥 Migrating Users collection...');
  
  // Create models for source and target connections
  const SourceUser = sourceConnection.model('User', User.schema);
  const TargetUser = targetConnection.model('User', User.schema);
  
  return await migrateCollection('users', SourceUser, TargetUser);
}

async function migrateSilverRates() {
  console.log('\n💰 Migrating Silver Rates collection...');
  
  // Create models for source and target connections
  const SourceSilverRate = sourceConnection.model('SilverRate', SilverRate.schema);
  const TargetSilverRate = targetConnection.model('SilverRate', SilverRate.schema);
  
  return await migrateCollection('silverrates', SourceSilverRate, TargetSilverRate);
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');
  
  try {
    const TargetUser = targetConnection.model('User', User.schema);
    const TargetSilverRate = targetConnection.model('SilverRate', SilverRate.schema);
    
    const userCount = await TargetUser.countDocuments({});
    const rateCount = await TargetSilverRate.countDocuments({});
    
    console.log(`   Users in target: ${userCount}`);
    console.log(`   Silver Rates in target: ${rateCount}`);
    
    return { userCount, rateCount };
  } catch (error) {
    console.error('   ❌ Verification error:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting MongoDB Migration to Atlas\n');
  console.log('=' .repeat(60));
  console.log(`Source: ${SOURCE_URI.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`Target: ${TARGET_URI.replace(/\/\/.*@/, '//***:***@')}`);
  console.log('=' .repeat(60));
  
  try {
    // Connect to both databases
    await connectDatabases();
    
    // Migrate collections
    const userStats = await migrateUsers();
    const rateStats = await migrateSilverRates();
    
    // Verify migration
    const verification = await verifyMigration();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log('\nUsers:');
    console.log(`   Migrated: ${userStats.migrated}`);
    console.log(`   Skipped: ${userStats.skipped}`);
    console.log(`   Errors: ${userStats.errors}`);
    console.log('\nSilver Rates:');
    console.log(`   Migrated: ${rateStats.migrated}`);
    console.log(`   Skipped: ${rateStats.skipped}`);
    console.log(`   Errors: ${rateStats.errors}`);
    console.log('\nVerification:');
    console.log(`   Total Users: ${verification.userCount}`);
    console.log(`   Total Silver Rates: ${verification.rateCount}`);
    console.log('\n✅ Migration completed successfully!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connections
    if (sourceConnection) {
      await sourceConnection.close();
      console.log('\n🔌 Closed source connection');
    }
    if (targetConnection) {
      await targetConnection.close();
      console.log('🔌 Closed target connection');
    }
    process.exit(0);
  }
}

// Run migration
if (require.main === module) {
  main();
}

module.exports = { main, migrateUsers, migrateSilverRates };


