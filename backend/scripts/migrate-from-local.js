/**
 * Migrate from Local MongoDB to MongoDB Atlas
 * 
 * This script specifically migrates from local MongoDB (localhost) to Atlas
 * 
 * Usage:
 *   node scripts/migrate-from-local.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Source: Local MongoDB
const LOCAL_URI = 'mongodb://localhost:27017/jain_silver';

// Target: MongoDB Atlas
const ATLAS_URI = 'mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority';

async function migrateFromLocal() {
  console.log('🚀 Migrating from Local MongoDB to MongoDB Atlas\n');
  console.log('='.repeat(60));
  console.log('Source: Local MongoDB (localhost:27017)');
  console.log('Target: MongoDB Atlas');
  console.log('='.repeat(60) + '\n');
  
  let localConn = null;
  let atlasConn = null;
  
  try {
    // Connect to local MongoDB
    console.log('📥 Connecting to local MongoDB...');
    try {
      localConn = await mongoose.createConnection(LOCAL_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 second timeout
      }).asPromise();
      console.log('✅ Connected to local MongoDB\n');
    } catch (error) {
      console.error('❌ Could not connect to local MongoDB');
      console.error('   Error:', error.message);
      console.error('\n💡 Make sure:');
      console.error('   1. MongoDB is installed and running');
      console.error('   2. MongoDB service is started (check Windows Services)');
      console.error('   3. MongoDB is listening on port 27017');
      process.exit(1);
    }
    
    // Check if local database has data
    const localDb = localConn.db;
    const localCollections = await localDb.listCollections().toArray();
    
    if (localCollections.length === 0) {
      console.log('⚠️  No collections found in local database');
      console.log('   Nothing to migrate.\n');
      await localConn.close();
      process.exit(0);
    }
    
    console.log(`📋 Found ${localCollections.length} collection(s) in local database:\n`);
    for (const col of localCollections) {
      const count = await localDb.collection(col.name).countDocuments({});
      console.log(`   - ${col.name}: ${count} document(s)`);
    }
    console.log('');
    
    // Connect to Atlas
    console.log('📤 Connecting to MongoDB Atlas...');
    atlasConn = await mongoose.createConnection(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).asPromise();
    console.log('✅ Connected to MongoDB Atlas\n');
    
    const atlasDb = atlasConn.db;
    
    // Migrate each collection
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    for (const collectionInfo of localCollections) {
      const collectionName = collectionInfo.name;
      console.log(`📦 Migrating ${collectionName}...`);
      
      const localCollection = localDb.collection(collectionName);
      const atlasCollection = atlasDb.collection(collectionName);
      
      // Get all documents
      const documents = await localCollection.find({}).toArray();
      console.log(`   Found ${documents.length} document(s)`);
      
      if (documents.length === 0) {
        console.log(`   ⚠️  No documents to migrate\n`);
        continue;
      }
      
      // Insert documents
      try {
        const result = await atlasCollection.insertMany(documents, {
          ordered: false, // Continue on errors
        });
        console.log(`   ✅ Inserted ${result.insertedCount} document(s)`);
        totalMigrated += result.insertedCount;
      } catch (error) {
        if (error.writeErrors) {
          const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
          const duplicates = error.writeErrors.filter(e => e.code === 11000).length;
          const otherErrors = error.writeErrors.length - duplicates;
          
          console.log(`   ✅ Inserted ${inserted} document(s)`);
          console.log(`   ⚠️  Skipped ${duplicates} duplicate(s)`);
          if (otherErrors > 0) {
            console.log(`   ❌ ${otherErrors} error(s)`);
          }
          
          totalMigrated += inserted;
          totalSkipped += duplicates;
          totalErrors += otherErrors;
        } else {
          console.error(`   ❌ Error: ${error.message}`);
          totalErrors++;
        }
      }
      console.log('');
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`   ✅ Migrated: ${totalMigrated} document(s)`);
    console.log(`   ⚠️  Skipped: ${totalSkipped} duplicate(s)`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log('='.repeat(60));
    
    // Verify
    console.log('\n🔍 Verifying data in Atlas...\n');
    for (const collectionInfo of localCollections) {
      const collectionName = collectionInfo.name;
      const atlasCollection = atlasDb.collection(collectionName);
      const count = await atlasCollection.countDocuments({});
      console.log(`   ${collectionName}: ${count} document(s)`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (localConn) {
      await localConn.close();
      console.log('\n🔌 Closed local connection');
    }
    if (atlasConn) {
      await atlasConn.close();
      console.log('🔌 Closed Atlas connection');
    }
    process.exit(0);
  }
}

// Run migration
migrateFromLocal();

