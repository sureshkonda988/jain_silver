const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Platform detection - with comprehensive error handling
let platform, database, serverConfig;

// Safe platform config loading
function loadPlatformConfig() {
  try {
    const platformConfig = require('./config/platform');
    if (platformConfig && platformConfig.platform) {
      platform = platformConfig.platform;
      database = platformConfig.database;
      serverConfig = platformConfig.server;
      console.log(`🚀 Running on platform: ${platform.name.toUpperCase()}`);
      if (platformConfig.getConfig) {
        console.log(`📦 Platform details:`, platformConfig.getConfig());
      }
      return true;
    }
  } catch (error) {
    console.error('Error loading platform config:', error.message);
  }
  return false;
}

// Try to load platform config, use fallback if it fails
if (!loadPlatformConfig()) {
  console.log('⚠️  Using fallback platform configuration');
  const isVercel = process.env.VERCEL === 'true' || process.env.VERCEL_ENV || process.env.VERCEL;
  platform = {
    isVercel: !!isVercel,
    isAWS: false,
    isDocker: false,
    isLocal: !isVercel,
    name: isVercel ? 'vercel' : 'local'
  };
  database = {
    maxPoolSize: isVercel ? 1 : 10,
    minPoolSize: isVercel ? 0 : 1,
    serverSelectionTimeoutMS: isVercel ? 5000 : 10000,
    socketTimeoutMS: isVercel ? 45000 : 60000,
    retryWrites: !isVercel,
    retryReads: !isVercel
  };
  serverConfig = {
    enableSocketIO: !isVercel,
    enableRateUpdater: !isVercel,
    healthCheckPath: '/health'
  };
  console.log(`📦 Platform: ${platform.name}`);
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware - CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Note: File uploads now go to S3, but keep static route for backward compatibility
app.use('/uploads', express.static('uploads'));

// Database connection - optimized for Vercel serverless
const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // If connecting, wait for it
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', resolve);
      });
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }
    }

    // Connect with platform-optimized settings
    const dbConfig = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: (database && database.serverSelectionTimeoutMS) || 5000,
      socketTimeoutMS: (database && database.socketTimeoutMS) || 45000,
      maxPoolSize: (database && database.maxPoolSize) || 10,
      minPoolSize: (database && database.minPoolSize) || 1,
      retryWrites: (database && database.retryWrites) !== undefined ? database.retryWrites : true,
      retryReads: (database && database.retryReads) !== undefined ? database.retryReads : true,
    };
    
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/jain_silver', dbConfig);
    console.log('✅ MongoDB Connected');
    return conn;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message || err);
    if (err.message && err.message.includes('whitelist')) {
      console.error('⚠️  IP Whitelist Issue: Add 0.0.0.0/0 to MongoDB Atlas Network Access');
      console.error('📖 See: backend/MONGODB_VERCEL_SETUP.md for instructions');
    }
    // Don't throw in serverless - let routes handle it gracefully
    if (!process.env.VERCEL) {
      throw err;
    }
    return null;
  }
};

// Connect to database
connectDB();

// Helper function to ensure DB connection before operations
const ensureDBConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  try {
    await connectDB();
    return mongoose.connection.readyState === 1;
  } catch (error) {
    console.error('Failed to ensure DB connection:', error);
    return false;
  }
};

// Make helper available to routes
app.locals.ensureDBConnection = ensureDBConnection;

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Jain Silver API Server',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      admin: '/api/admin',
      rates: '/api/rates',
      store: '/api/store'
    }
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/rates', require('./routes/rates'));
app.use('/api/store', require('./routes/store'));

// Socket.io for real-time updates (only if enabled for platform)
if (serverConfig && serverConfig.enableSocketIO) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
  
  // Store io instance for use in routes
  app.set('io', io);
} else {
  console.log('⚠️  Socket.io disabled for this platform (serverless)');
  app.set('io', null);
}

// Platform-specific initialization
if (platform) {
  if (platform.isVercel) {
    console.log('🚀 Running on Vercel (serverless mode)');
    console.log('⚠️  Socket.io WebSocket connections are not supported on Vercel');
    console.log('📡 Real-time updates will use HTTP polling fallback');
  } else if (platform.isAWS) {
    console.log('☁️  Running on AWS');
    console.log('✅ Full features enabled (Socket.io, rate updater)');
  } else if (platform.isDocker) {
    console.log('🐳 Running in Docker container');
    console.log('✅ Full features enabled');
  } else {
    console.log('💻 Running locally');
    console.log('✅ Full features enabled');
  }
}

// Export app for both Vercel and local development
// Vercel will use this export, local dev will start server below
module.exports = app;

// Only start server if not on Vercel
if (!process.env.VERCEL) {
  // Start server - listen on all network interfaces (for local development)
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

  // Get local IP address dynamically
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  
  // Find the first non-internal IPv4 address
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
    if (localIP !== 'localhost') break;
  }

  server.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📱 Accessible from network at: http://${localIP}:${PORT}`);
    console.log(`🌐 API endpoints available at: http://${localIP}:${PORT}/api`);
    console.log(`\n💡 Update mobile app config with: http://${localIP}:${PORT}`);
  });
}

// Initialize admin user (wait for MongoDB connection)
mongoose.connection.once('open', async () => {
  console.log('📦 Starting server initialization...');
  
  try {
    // Initialize admin user
    console.log('👤 Initializing admin user...');
    await require('./utils/initAdmin')();
    console.log('✅ Admin user check completed');
    
    // Check if rates exist, if not initialize them
    console.log('💰 Checking silver rates...');
    const SilverRate = require('./models/SilverRate');
    const rateCount = await SilverRate.countDocuments({ location: 'Andhra Pradesh' });
    
    if (rateCount === 0) {
      console.log('⚠️ No rates found. Initializing default rates...');
      try {
        // Initialize rates using the API endpoint logic
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
        console.log(`✅ Andhra Pradesh silver rates initialized successfully (${defaultRates.length} rates)`);
      } catch (initError) {
        console.error('❌ Error initializing rates:', initError.message || initError);
        console.error('Stack trace:', initError.stack);
      }
    } else {
      console.log(`✅ Found ${rateCount} silver rates in database`);
    }
    
    // Initialize store information if it doesn't exist
    console.log('🏪 Checking store information...');
    try {
      const StoreInfo = require('./models/StoreInfo');
      const storeInfo = await StoreInfo.getStoreInfo();
      console.log('✅ Store information initialized/verified');
    } catch (storeError) {
      console.error('❌ Error initializing store info:', storeError.message || storeError);
    }
    
    // Start rate updater (only if enabled for platform)
    if (serverConfig && serverConfig.enableRateUpdater) {
      console.log('🔄 Starting rate updater...');
      try {
        const { startRateUpdater } = require('./utils/rateUpdater');
        const io = app.get('io');
        if (io) {
          startRateUpdater(io);
          console.log('✅ Rate updater started (updates every second)');
        } else {
          console.log('⚠️  Rate updater skipped (Socket.io not available)');
        }
      } catch (updaterError) {
        console.error('❌ Error starting rate updater:', updaterError.message || updaterError);
      }
    } else {
      console.log('⚠️  Rate updater disabled for serverless platform');
    }
    
    console.log('🎉 Server initialization completed successfully!');
  } catch (error) {
    console.error('❌ Error during initialization:', error.message || error);
    console.error('Stack trace:', error.stack);
  }
});

