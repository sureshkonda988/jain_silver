# 🚀 Vercel Deployment Guide for Backend

## Quick Deploy Steps

### Option 1: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to backend directory
cd backend

# Login to Vercel
vercel login

# Deploy (first time)
vercel

# Follow the prompts:
# - Set up and deploy? → Yes
# - Which scope? → Your account
# - Link to existing project? → No
# - Project name? → jain-silver-backend (or your preferred name)
# - Directory? → ./
# - Override settings? → No

# For production deployment
vercel --prod
```

### Option 2: Using GitHub Integration

1. **Push your code to GitHub** (already done ✅)
   - Repository: https://github.com/saikiran0729/jain_silver

2. **Import to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repository: `saikiran0729/jain_silver`
   - Configure:
     - **Root Directory**: `backend`
     - **Framework Preset**: Other
     - **Build Command**: (leave empty)
     - **Output Directory**: (leave empty)
     - **Install Command**: `npm install`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add the following:

```
MONGODB_URI=mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=admin123
OTP_EXPIRY_MINUTES=10
NODE_ENV=production
```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

## 📋 Required Environment Variables

Set these in Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable | Description | Required Value |
|----------|-------------|----------------|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-key-here` (change this!) |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `ADMIN_EMAIL` | Admin user email | `admin@jainsilver.com` |
| `ADMIN_PASSWORD` | Admin user password | `admin123` (change this!) |
| `OTP_EXPIRY_MINUTES` | OTP expiration time | `10` |
| `NODE_ENV` | Environment mode | `production` |

## 🔗 After Deployment

Once deployed, you'll get a URL like:
```
https://jain-silver-backend.vercel.app
```

### Test Your Deployment

1. **Health Check**
   ```
   GET https://your-app.vercel.app/
   ```

2. **Store Info**
   ```
   GET https://your-app.vercel.app/api/store/info
   ```

3. **Silver Rates**
   ```
   GET https://your-app.vercel.app/api/rates
   ```

## ⚠️ Important Notes

### Socket.io Limitation
- **Vercel serverless functions don't support WebSocket connections**
- Socket.io will not work on Vercel
- The app will automatically use HTTP polling as fallback
- Real-time updates will still work, but via HTTP requests instead of WebSockets

### MongoDB Atlas Setup
1. Create account at https://mongodb.com/cloud/atlas
2. Create a free cluster
3. Create database user
4. **Whitelist IP**: Add `0.0.0.0/0` to allow all IPs (or Vercel's IP ranges)
5. Get connection string and add to Vercel environment variables

### File Structure for Vercel
```
backend/
├── api/
│   └── index.js          # Vercel entry point ✅
├── routes/               # API routes ✅
├── models/               # MongoDB models ✅
├── utils/                # Utility functions ✅
├── server.js             # Express app ✅
├── vercel.json           # Vercel config ✅
└── package.json          # Dependencies ✅
```

## 🔧 Troubleshooting

### Deployment Fails
- Check that `api/index.js` exists
- Verify `vercel.json` is in the `backend/` directory
- Check build logs in Vercel dashboard

### API Returns 404
- Verify routes in `vercel.json` are correct
- Check that `api/index.js` exports the Express app
- Ensure all routes start with `/api/`

### MongoDB Connection Error
- Verify `MONGODB_URI` is set correctly in Vercel
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify database user credentials

### CORS Issues
- CORS is configured in `vercel.json` headers
- Check that mobile app uses correct API URL
- Verify `Access-Control-Allow-Origin` is set to `*`

## 📝 Update Mobile App After Deployment

After getting your Vercel URL, update these files in `mobile-app/`:

1. **`mobile-app/config/api.js`**
   ```javascript
   const API_BASE_URL = __DEV__ 
     ? 'http://YOUR_LOCAL_IP:5000/api'
     : 'https://YOUR_VERCEL_APP.vercel.app/api'; // UPDATE THIS!
   ```

2. **`mobile-app/screens/HomeScreen.js`**
   ```javascript
   const SOCKET_URL = __DEV__ 
     ? 'http://YOUR_LOCAL_IP:5000'
     : 'https://YOUR_VERCEL_APP.vercel.app'; // UPDATE THIS!
   ```

## ✅ Deployment Checklist

- [ ] Vercel account created
- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] MongoDB connection string obtained
- [ ] Environment variables set in Vercel
- [ ] Backend deployed to Vercel
- [ ] Vercel URL obtained
- [ ] API endpoints tested
- [ ] Mobile app API URLs updated

## 🎉 Success!

Your backend is now live at: `https://your-app.vercel.app`

**Next Steps:**
1. Update mobile app with Vercel URL
2. Build mobile app for Play Store
3. Deploy mobile app to Google Play Store

---

**Need Help?** Check Vercel logs: Dashboard → Your Project → Logs

