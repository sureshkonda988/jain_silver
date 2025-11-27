/**
 * Check Database Script
 * Lists all collections and document counts in your current database
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver';

async function checkDatabase() {
  console.log('🔍 Checking Database...\n');
  console.log(`Connection: ${MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}\n`);
  
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to database\n');
    
    const db = conn.connection.db;
    const collections = await db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('⚠️  No collections found in database');
      console.log('\n💡 This could mean:');
      console.log('   1. The database is empty (no data yet)');
      console.log('   2. The database name is different');
      console.log('   3. You need to run the app first to create collections');
    } else {
      console.log(`📋 Found ${collections.length} collection(s):\n`);
      
      for (const collectionInfo of collections) {
        const collectionName = collectionInfo.name;
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments({});
        
        console.log(`   📦 ${collectionName}: ${count} document(s)`);
        
        // Show sample documents for small collections
        if (count > 0 && count <= 5) {
          const samples = await collection.find({}).limit(3).toArray();
          console.log(`      Sample IDs: ${samples.map(d => d._id).join(', ')}`);
        }
      }
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Check completed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Make sure MongoDB is running:');
      console.error('   - Local: mongod or check Windows Services');
      console.error('   - Atlas: Check connection string and network access');
    }
    process.exit(1);
  }
}

checkDatabase();

