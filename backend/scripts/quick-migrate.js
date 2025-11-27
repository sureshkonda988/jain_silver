/**
 * Quick Migration Script - Direct MongoDB to MongoDB Atlas Transfer
 * 
 * This script directly transfers data from your current MongoDB to Atlas
 * 
 * Usage:
 *   node scripts/quick-migrate.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Your current MongoDB (source) - will use from .env or default to local
const CURRENT_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver';

// MongoDB Atlas (target)
const ATLAS_URI = 'mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority';

async function transferData() {
  console.log('🚀 Starting Quick Migration to MongoDB Atlas\n');
  console.log('='.repeat(60));
  
  let sourceConn = null;
  let targetConn = null;
  
  try {
    // Connect to source
    console.log('📥 Connecting to current database...');
    sourceConn = await mongoose.createConnection(CURRENT_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    console.log('✅ Connected to source\n');
    
    // Connect to target (Atlas)
    console.log('📤 Connecting to MongoDB Atlas...');
    targetConn = await mongoose.createConnection(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    // Get collections
    const sourceDb = sourceConn.db;
    const targetDb = targetConn.db;
    
    // Get all collections
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections to migrate\n`);
    
    // Transfer each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`📦 Transferring ${collectionName}...`);
      
      // Get all documents
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      const documents = await sourceCollection.find({}).toArray();
      console.log(`   Found ${documents.length} documents`);
      
      if (documents.length > 0) {
        // Insert all documents (using insertMany with ordered: false to continue on errors)
        try {
          // Delete existing documents in target (optional - comment out if you want to keep existing)
          // await targetCollection.deleteMany({});
          
          // Insert documents
          const result = await targetCollection.insertMany(documents, { 
            ordered: false, // Continue even if some documents fail
            writeConcern: { w: 'majority' }
          });
          console.log(`   ✅ Inserted ${result.insertedCount} documents`);
        } catch (error) {
          // Handle duplicate key errors (if documents already exist)
          if (error.code === 11000 || error.writeErrors) {
            const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
            const errors = error.writeErrors ? error.writeErrors.length : 0;
            console.log(`   ⚠️  Inserted ${inserted}, Skipped ${errors} duplicates`);
          } else {
            console.error(`   ❌ Error: ${error.message}`);
          }
        }
      } else {
        console.log(`   ⚠️  No documents to transfer`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Verifying data in Atlas...\n');
    
    // Verify
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const targetCollection = targetDb.collection(collectionName);
      const count = await targetCollection.countDocuments({});
      console.log(`   ${collectionName}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (sourceConn) {
      await sourceConn.close();
      console.log('\n🔌 Closed source connection');
    }
    if (targetConn) {
      await targetConn.close();
      console.log('🔌 Closed target connection');
    }
    process.exit(0);
  }
}

// Run migration
transferData();


