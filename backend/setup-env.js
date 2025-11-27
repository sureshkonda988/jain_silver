const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/jain_silver
JWT_SECRET=jain_silver_secret_key_2024_change_in_production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=Admin@123
OTP_EXPIRY_MINUTES=10
NODE_ENV=development

# AWS Configuration
# IMPORTANT: Set these in your .env file (not committed to git)
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=jain-storage
AWS_CLOUDFRONT_URL=dglrmjf688z0y.cloudfront.net
AWS_DYNAMODB_TABLE_NAME=Jain_Users
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✓ .env file created successfully!');
  console.log('⚠ Please update JWT_SECRET and other values for production!');
} else {
  console.log('⚠ .env file already exists. Skipping creation.');
  console.log('If you want to recreate it, delete the existing .env file first.');
}

