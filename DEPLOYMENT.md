# Deployment Guide for Jain Silver App

## Backend Deployment to Vercel

### Prerequisites
1. Vercel account (sign up at https://vercel.com)
2. MongoDB Atlas account (or your MongoDB database)
3. Git repository

### Steps to Deploy Backend to Vercel

1. **Install Vercel CLI** (optional, can also use web interface):
   ```bash
   npm i -g vercel
   ```

2. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   Or use the Vercel web interface to connect your Git repository.

4. **Set Environment Variables in Vercel**:
   Go to your Vercel project settings and add these environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong secret key for JWT tokens
   - `PORT`: (Optional, Vercel sets this automatically)
   - `NODE_ENV`: `production`

5. **Update API URLs**:
   After deployment, Vercel will provide you with a URL like `https://your-app.vercel.app`
   - Update `mobile-app/config/api.js` with your Vercel URL
   - Update `mobile-app/screens/HomeScreen.js` with your Vercel URL for Socket.io

### Important Notes for Vercel Deployment

⚠️ **Socket.io Limitations on Vercel**:
- Vercel uses serverless functions which have limitations with WebSocket connections
- Socket.io may not work perfectly on Vercel's serverless environment
- Consider using:
  - **Alternative 1**: Use polling instead of WebSocket for Socket.io
  - **Alternative 2**: Deploy Socket.io server separately on a platform that supports WebSockets (Railway, Render, etc.)
  - **Alternative 3**: Use a service like Pusher or Ably for real-time updates

### Socket.io Configuration for Vercel

If you need Socket.io to work on Vercel, you may need to:
1. Use polling transport only:
   ```javascript
   const io = socketIo(server, {
     transports: ['polling'],
     // ... other options
   });
   ```

2. Or deploy Socket.io server separately on a platform that supports persistent connections.

## Mobile App Deployment to Play Store

### Prerequisites
1. Expo account
2. Google Play Developer account ($25 one-time fee)
3. EAS Build access (Expo's build service)

### Steps to Deploy to Play Store

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS**:
   ```bash
   cd mobile-app
   eas build:configure
   ```

4. **Update app.json**:
   - Update `package` in `android` section with your unique package name
   - Update `versionCode` for each new release
   - Update `version` for each new release

5. **Build Android APK/AAB**:
   ```bash
   eas build --platform android
   ```

6. **Submit to Play Store**:
   ```bash
   eas submit --platform android
   ```
   Or manually upload the generated AAB file to Google Play Console.

### Before Publishing

1. **Update Store Information**:
   - Edit `backend/routes/store.js` and update:
     - Phone number
     - Address
     - Store timings
     - Social media URLs (Instagram, Facebook, YouTube)
     - Bank details
     - Welcome message

2. **Update API URLs**:
   - Replace `your-vercel-app.vercel.app` in:
     - `mobile-app/config/api.js`
     - `mobile-app/screens/HomeScreen.js`

3. **Test the App**:
   - Test all features on a physical device
   - Test with production backend URL
   - Verify all tabs work correctly
   - Test profile, news, and home screens

4. **Prepare Store Assets**:
   - App icon (1024x1024)
   - Screenshots (at least 2, up to 8)
   - Feature graphic (1024x500)
   - Short description (80 characters)
   - Full description (4000 characters)

## Environment Variables

### Backend (.env file for local, Vercel environment variables for production)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/jain_silver
JWT_SECRET=your-strong-secret-key-here
PORT=5000
NODE_ENV=production
```

### Mobile App
Update the API URLs in:
- `mobile-app/config/api.js`
- `mobile-app/screens/HomeScreen.js`

## Post-Deployment Checklist

- [ ] Backend deployed to Vercel
- [ ] Environment variables set in Vercel
- [ ] API URLs updated in mobile app
- [ ] Store information updated in backend
- [ ] App tested with production backend
- [ ] APK/AAB built successfully
- [ ] App submitted to Play Store
- [ ] Store listing information completed
- [ ] App approved and published

## Troubleshooting

### Backend Issues
- **MongoDB Connection**: Ensure MongoDB Atlas allows connections from Vercel IPs (0.0.0.0/0)
- **CORS Errors**: Check CORS configuration in `server.js`
- **Socket.io**: May need separate deployment for WebSocket support

### Mobile App Issues
- **API Connection**: Verify API URL is correct and accessible
- **Build Errors**: Check `app.json` for correct configuration
- **Permissions**: Ensure all required permissions are listed in `app.json`

## Support

For issues or questions:
1. Check the error logs in Vercel dashboard
2. Check Expo build logs
3. Review the codebase documentation

