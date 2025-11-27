# Quick Setup Guide

## Step 1: Backend Setup

1. **Install MongoDB**
   - Download and install MongoDB from https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment**
   - Copy `.env.example` to `.env` (if it exists) or create `.env` file
   - Update MongoDB URI and other settings

4. **Start Backend**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

5. **Initialize Rates** (in a new terminal or using Postman)
   ```bash
   curl -X POST http://localhost:5000/api/rates/initialize
   ```

## Step 2: Mobile App Setup

1. **Install Expo CLI** (if not installed)
   ```bash
   npm install -g expo-cli
   ```

2. **Setup Mobile App**
   ```bash
   cd mobile-app
   npm install
   ```

3. **Update API Configuration**
   - Open `mobile-app/config/api.js`
   - Replace `192.168.1.100` with your computer's local IP address
   - Find your IP:
     - Windows: `ipconfig` (look for IPv4 Address)
     - Mac/Linux: `ifconfig` or `ip addr`

4. **Start Mobile App**
   ```bash
   npm start
   # or
   expo start
   ```

5. **Run on Device**
   - Install Expo Go app on your Android/iOS device
   - Scan the QR code from terminal
   - Or press `a` for Android emulator, `i` for iOS simulator

## Step 3: Build APK

### Option 1: Using EAS Build (Recommended)

```bash
cd mobile-app
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

### Option 2: Using Expo Build

```bash
cd mobile-app
expo build:android -t apk
```

## Default Credentials

### Admin Login
- **Email**: admin@jainsilver.com
- **Password**: admin123

**⚠️ IMPORTANT**: Change these in production!

## Testing the App

1. **Test Registration**
   - Open app → Register
   - Fill all fields
   - Upload documents (Aadhar front/back, PAN)
   - Submit registration
   - Verify OTP (check console/backend logs for OTP)

2. **Test Admin Approval**
   - Login as admin
   - Go to Admin Dashboard
   - View pending users
   - Approve the registered user

3. **Test User Login**
   - Login with approved user credentials
   - View silver rates (should update every second)

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify port 5000 is available
- Check `.env` file exists and has correct values

### Mobile app can't connect
- Verify backend is running
- Check API URL in `config/api.js`
- Ensure phone and computer are on same network
- Check firewall settings

### OTP not received
- Check backend console for OTP (development mode)
- In production, integrate SMS service (Twilio, etc.)

### Documents not uploading
- Check `backend/uploads/` directory exists
- Verify write permissions
- Check file size limits (5MB max)

## Next Steps

1. **Production Setup**
   - Deploy backend to cloud (Heroku, AWS, etc.)
   - Use MongoDB Atlas for database
   - Update mobile app API URL
   - Set up proper SMS service for OTP
   - Configure SSL certificates

2. **Security Enhancements**
   - Change default admin credentials
   - Use strong JWT secret
   - Enable HTTPS
   - Add rate limiting
   - Implement proper file validation

3. **Features to Add**
   - Email notifications
   - Push notifications
   - User profile management
   - Order management
   - Payment integration

