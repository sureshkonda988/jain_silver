/**
 * Platform Detection and Configuration
 * Handles differences between AWS (ECS/Fargate/Docker) and Vercel deployments
 */

const isVercel = process.env.VERCEL === 'true' || process.env.VERCEL_ENV;
const isAWS = process.env.AWS_EXECUTION_ENV || process.env.ECS_CONTAINER_METADATA_URI || process.env.AWS_LAMBDA_FUNCTION_NAME;
const isDocker = process.env.DOCKER_CONTAINER === 'true' || process.env.IS_DOCKER === 'true';

// Detect platform
const platform = {
  isVercel: !!isVercel,
  isAWS: !!isAWS,
  isDocker: !!isDocker,
  isLocal: !isVercel && !isAWS && !isDocker,
  name: isVercel ? 'vercel' : (isAWS ? 'aws' : (isDocker ? 'docker' : 'local'))
};

// File storage configuration
const fileStorage = {
  // Use S3 if AWS credentials are available, otherwise use local/Vercel storage
  useS3: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME),
  // Vercel has ephemeral file system, so we must use S3
  requireS3: platform.isVercel,
  fallbackToLocal: !platform.isVercel && !platform.isAWS
};

// Database configuration
const database = {
  // Connection pooling settings
  maxPoolSize: platform.isVercel ? 1 : 10,
  minPoolSize: platform.isVercel ? 0 : 1,
  serverSelectionTimeoutMS: platform.isVercel ? 5000 : 10000,
  socketTimeoutMS: platform.isVercel ? 45000 : 60000,
  // Connection retry settings
  retryWrites: !platform.isVercel,
  retryReads: !platform.isVercel
};

// Server configuration
const server = {
  // Socket.io doesn't work on Vercel serverless
  enableSocketIO: !platform.isVercel,
  // Rate updater runs differently on serverless
  enableRateUpdater: !platform.isVercel,
  // Health check endpoint
  healthCheckPath: '/health'
};

// Logging
const logging = {
  level: process.env.LOG_LEVEL || (platform.isVercel ? 'error' : 'info'),
  format: platform.isVercel ? 'json' : 'text'
};

module.exports = {
  platform,
  fileStorage,
  database,
  server,
  logging,
  // Helper to get environment-specific config
  getConfig: () => ({
    platform: platform.name,
    fileStorage: fileStorage.useS3 ? 's3' : 'local',
    database: 'mongodb',
    socketIO: server.enableSocketIO,
    rateUpdater: server.enableRateUpdater
  })
};

