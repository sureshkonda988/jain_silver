// Diagnostic script to check server setup
console.log('🔍 Checking server setup...\n');

// Check 1: Node version
console.log('1️⃣ Node.js version:');
console.log('   ', process.version);
console.log('   ✅ Node.js is installed\n');

// Check 2: Required modules
console.log('2️⃣ Checking required modules...');
const requiredModules = [
  'express',
  'mongoose',
  'cors',
  'dotenv',
  'jsonwebtoken',
  'bcryptjs',
  'multer',
  'express-validator',
  'otp-generator'
];

let allModulesFound = true;
requiredModules.forEach(module => {
  try {
    require.resolve(module);
    console.log('   ✅', module);
  } catch (e) {
    console.log('   ❌', module, '- NOT FOUND');
    allModulesFound = false;
  }
});

if (!allModulesFound) {
  console.log('\n⚠️  Some modules are missing. Run: npm install\n');
} else {
  console.log('\n✅ All required modules are installed\n');
}

// Check 3: Environment variables
console.log('3️⃣ Checking environment variables...');
require('dotenv').config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const optionalEnvVars = ['PORT', 'NODE_ENV', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    const value = varName === 'MONGODB_URI' 
      ? process.env[varName].replace(/:[^:@]+@/, ':****@') // Hide password
      : varName === 'JWT_SECRET'
      ? '***' + process.env[varName].slice(-4) // Show last 4 chars
      : process.env[varName];
    console.log('   ✅', varName, '=', value);
  } else {
    console.log('   ❌', varName, '- NOT SET');
  }
});

optionalEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log('   ✓', varName, '=', process.env[varName]);
  } else {
    console.log('   ○', varName, '- not set (optional)');
  }
});

// Check 4: File structure
console.log('\n4️⃣ Checking file structure...');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'server.js',
  'routes/auth.js',
  'models/User.js',
  'models/SilverRate.js',
  'api/index.js'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log('   ✅', file);
  } else {
    console.log('   ❌', file, '- NOT FOUND');
  }
});

// Check 5: MongoDB connection (test)
console.log('\n5️⃣ Testing MongoDB connection...');
if (process.env.MONGODB_URI) {
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  })
  .then(() => {
    console.log('   ✅ MongoDB connection successful');
    mongoose.connection.close();
    console.log('\n✅ All checks passed! Server should start successfully.\n');
  })
  .catch(err => {
    console.log('   ❌ MongoDB connection failed:', err.message);
    if (err.message.includes('whitelist')) {
      console.log('   💡 Fix: Add 0.0.0.0/0 to MongoDB Atlas IP whitelist');
    } else if (err.message.includes('authentication')) {
      console.log('   💡 Fix: Check username and password in MONGODB_URI');
    } else if (err.message.includes('ENOTFOUND')) {
      console.log('   💡 Fix: Check if MongoDB URI is correct');
    }
    console.log('\n⚠️  MongoDB connection issue. Server may still start but database operations will fail.\n');
  });
} else {
  console.log('   ⚠️  MONGODB_URI not set - skipping connection test');
  console.log('\n⚠️  Environment variables not configured. Server may not work correctly.\n');
}

