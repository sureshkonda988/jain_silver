const { S3Client } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

// AWS Configuration
// IMPORTANT: Set these values in your .env file or environment variables
// Never commit credentials to git!
const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
};

if (!awsConfig.accessKeyId || !awsConfig.secretAccessKey) {
  console.warn('⚠️  AWS credentials not found in environment variables!');
  console.warn('⚠️  Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file');
}

// S3 Client Configuration
const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

// DynamoDB Client Configuration
const dynamoDBClient = new DynamoDBClient({
  region: awsConfig.region,
  credentials: {
    accessKeyId: awsConfig.accessKeyId,
    secretAccessKey: awsConfig.secretAccessKey,
  },
});

// DynamoDB Document Client (simplified operations)
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoDBClient);

// AWS Constants
const AWS_CONFIG = {
  S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'jain-storage',
  CLOUDFRONT_URL: process.env.AWS_CLOUDFRONT_URL || 'https://dglrmjf688z0y.cloudfront.net',
  DYNAMODB_TABLE_NAME: process.env.AWS_DYNAMODB_TABLE_NAME || 'Jain_Users',
  REGION: awsConfig.region,
};

module.exports = {
  s3Client,
  dynamoDBClient,
  dynamoDocClient,
  AWS_CONFIG,
  awsConfig,
};

