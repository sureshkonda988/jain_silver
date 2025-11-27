const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = `PORT=5000
MONGODB_URI=mongodb://localhost:27017/jain_silver
JWT_SECRET=jain_silver_secret_key_2024_change_in_production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=admin123
OTP_EXPIRY_MINUTES=10
NODE_ENV=development
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✓ .env file created successfully!');
  console.log('⚠ Please update JWT_SECRET and other values for production!');
} else {
  console.log('⚠ .env file already exists. Skipping creation.');
  console.log('If you want to recreate it, delete the existing .env file first.');
}

