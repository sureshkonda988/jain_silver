# Jain Silver - Deployment Guide

Complete guide for deploying the backend to Vercel and the mobile app to Google Play Store.

## 📋 Table of Contents
1. [Backend Deployment (Vercel)](#backend-deployment-vercel)
2. [Mobile App Deployment (Play Store)](#mobile-app-deployment-play-store)
3. [Environment Variables](#environment-variables)
4. [Post-Deployment Steps](#post-deployment-steps)

---

## 🚀 Backend Deployment (Vercel)

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- MongoDB Atlas account (for production database)
- GitHub account (recommended for easy deployment)

### Step 1: Prepare MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up and create a free cluster

2. **Get Connection String**
   - Create a database user
   - Whitelist IP addresses (or use `0.0.0.0/0` for all)
   - Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/jain_silver?retryWrites=true&w=majority`

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to backend directory
cd backend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? jain-silver-backend
# - Directory? ./
# - Override settings? No
```

#### Option B: Using GitHub Integration

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/jain-silver.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Select `backend` as root directory
   - Add environment variables (see below)
   - Deploy

### Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jain_silver?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
NODE_ENV=production
PORT=5000
```

**Important Notes:**
- ⚠️ **Socket.io Limitations**: Vercel serverless functions don't support persistent WebSocket connections. Real-time updates will work via polling instead.
- The app will automatically fall back to HTTP polling if Socket.io fails.

### Step 4: Get Your Vercel URL

After deployment, you'll get a URL like:
```
https://jain-silver-backend.vercel.app
```

**Update this in mobile app config!**

---

## 📱 Mobile App Deployment (Play Store)

### Prerequisites
- Expo account (sign up at https://expo.dev)
- Google Play Console account ($25 one-time fee)
- EAS CLI installed

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Configure EAS

```bash
cd mobile-app

# Login to Expo
eas login

# Configure EAS
eas build:configure

# This creates eas.json
```

### Step 3: Update API Configuration

**Update `mobile-app/config/api.js`:**
```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:5000/api' // For development
  : 'https://YOUR_VERCEL_APP.vercel.app/api'; // Your Vercel URL
```

**Update `mobile-app/screens/HomeScreen.js`:**
```javascript
const SOCKET_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:5000'
  : 'https://YOUR_VERCEL_APP.vercel.app';
```

### Step 4: Update app.json

**Important fields to update:**
- `version`: Increment for each release (e.g., "1.0.1")
- `android.versionCode`: Increment for each release (e.g., 2)
- `extra.eas.projectId`: Get from Expo dashboard

### Step 5: Build Android APK/AAB

```bash
cd mobile-app

# Build for Android (AAB format for Play Store)
eas build --platform android --profile production

# Or build APK for testing
eas build --platform android --profile preview
```

**Build Profiles:**
- `production`: For Play Store (AAB format)
- `preview`: For testing (APK format)

### Step 6: Submit to Play Store

1. **Download the AAB file** from Expo dashboard
2. **Go to Google Play Console**
   - https://play.google.com/console
3. **Create New App**
   - App name: "Jain Silver"
   - Default language: English
   - App or game: App
   - Free or paid: Free
4. **Complete Store Listing**
   - App icon (512x512)
   - Feature graphic (1024x500)
   - Screenshots (at least 2)
   - Short description (80 chars)
   - Full description (4000 chars)
5. **Upload AAB**
   - Go to Production → Create new release
   - Upload AAB file
   - Release notes
6. **Content Rating**
   - Complete questionnaire
7. **Privacy Policy**
   - Required URL
8. **Submit for Review**

---

## 🔐 Environment Variables

### Backend (.env for local, Vercel for production)

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jain_silver

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Server
NODE_ENV=production
PORT=5000

# Optional: Twilio (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Mobile App

No environment variables needed. Configuration is in:
- `mobile-app/config/api.js` - API endpoints
- `mobile-app/screens/HomeScreen.js` - Socket.io URL

---

## ✅ Post-Deployment Checklist

### Backend
- [ ] MongoDB Atlas cluster created and accessible
- [ ] Environment variables set in Vercel
- [ ] Backend deployed and accessible
- [ ] API endpoints tested
- [ ] CORS configured correctly
- [ ] Database initialized with rates

### Mobile App
- [ ] API URLs updated in config files
- [ ] App icon and splash screen set
- [ ] App version and versionCode updated
- [ ] EAS project configured
- [ ] Production build created
- [ ] AAB file downloaded
- [ ] Play Store listing completed
- [ ] App submitted for review

---

## 🔧 Troubleshooting

### Backend Issues

**Socket.io not working on Vercel:**
- This is expected. Vercel doesn't support WebSockets.
- The app will automatically use HTTP polling as fallback.
- For real-time features, consider using a service like Pusher or Ably.

**MongoDB Connection Issues:**
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Check environment variables in Vercel

### Mobile App Issues

**Build Fails:**
- Check `eas.json` configuration
- Verify all dependencies in `package.json`
- Check Expo SDK version compatibility

**API Not Connecting:**
- Verify API URL in `config/api.js`
- Check CORS settings on backend
- Test API endpoints in browser/Postman

---

## 📞 Support

For issues or questions:
- Check Vercel logs: Dashboard → Your Project → Logs
- Check Expo build logs: Dashboard → Your Project → Builds
- Review error messages in app console

---

## 🎉 Success!

Once deployed:
- Backend: `https://your-app.vercel.app`
- Mobile App: Available on Google Play Store

**Remember to update API URLs in mobile app before building!**

