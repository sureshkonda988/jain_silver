# Quick Start Guide

Get your Jain Silver app running in 5 minutes!

## Prerequisites Check
- [ ] Node.js installed (v14+)
- [ ] MongoDB installed and running
- [ ] Expo CLI installed (`npm install -g expo-cli`)

## Step 1: Backend (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example or create new)
# Add these lines:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/jain_silver
# JWT_SECRET=your_secret_key_here
# ADMIN_EMAIL=admin@jainsilver.com
# ADMIN_PASSWORD=admin123

# Start server
npm start
```

✅ Backend should be running on http://localhost:5000

## Step 2: Initialize Rates (30 seconds)

In a new terminal:
```bash
cd backend
npm run init-rates
```

Or use curl:
```bash
curl -X POST http://localhost:5000/api/rates/initialize
```

## Step 3: Mobile App (2 minutes)

```bash
# Navigate to mobile app
cd mobile-app

# Install dependencies
npm install

# Update API URL in config/api.js
# Replace 192.168.1.100 with your computer's IP address
# Find IP: Windows (ipconfig) or Mac/Linux (ifconfig)

# Start Expo
npm start
```

## Step 4: Test on Device

1. Install **Expo Go** app on your phone
2. Scan QR code from terminal
3. App will load on your device

## Test Flow

1. **Register a User**
   - Tap "Register"
   - Fill all fields
   - Upload documents
   - Submit
   - Enter OTP (check backend console)

2. **Approve as Admin**
   - Tap "Admin Login"
   - Email: `admin@jainsilver.com`
   - Password: `admin123`
   - Go to Pending Users
   - Approve the user

3. **Login as User**
   - Sign in with registered credentials
   - View live silver rates!

## Troubleshooting

**Backend not starting?**
- Check MongoDB is running: `mongod`
- Check port 5000 is free
- Verify .env file exists

**App can't connect?**
- Check backend is running
- Verify IP address in `config/api.js`
- Ensure phone and computer on same WiFi

**OTP not working?**
- Check backend console for OTP code
- In production, integrate SMS service

## Build APK

```bash
cd mobile-app
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

## Default Credentials

**Admin:**
- Email: admin@jainsilver.com
- Password: admin123

⚠️ **Change these in production!**

---

That's it! Your app is ready! 🎉

