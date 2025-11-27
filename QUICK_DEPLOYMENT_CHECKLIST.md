# 🚀 Quick Deployment Checklist

## Backend (Vercel) ✅

- [ ] MongoDB Atlas account created
- [ ] MongoDB cluster created and connection string obtained
- [ ] Vercel account created
- [ ] Backend code pushed to GitHub (optional but recommended)
- [ ] Deployed to Vercel (via CLI or GitHub integration)
- [ ] Environment variables set in Vercel:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET` (min 32 characters)
  - [ ] `NODE_ENV=production`
- [ ] Vercel URL obtained: `https://your-app.vercel.app`
- [ ] Tested API endpoints:
  - [ ] `GET /` - Health check
  - [ ] `GET /api/store/info` - Store info
  - [ ] `GET /api/rates` - Silver rates

## Mobile App (Play Store) ✅

- [ ] Expo account created
- [ ] EAS CLI installed: `npm i -g eas-cli`
- [ ] Logged in to Expo: `eas login`
- [ ] EAS configured: `eas build:configure`
- [ ] **API URLs updated in mobile app:**
  - [ ] `mobile-app/config/api.js` - Set production URL
  - [ ] `mobile-app/screens/HomeScreen.js` - Set Socket.io URL
- [ ] `app.json` updated:
  - [ ] Version number set
  - [ ] Version code incremented
  - [ ] EAS project ID set
- [ ] App icon and splash screen verified
- [ ] Production build created: `eas build --platform android --profile production`
- [ ] AAB file downloaded from Expo dashboard
- [ ] Google Play Console account created ($25 fee)
- [ ] Play Store listing prepared:
  - [ ] App name: "Jain Silver"
  - [ ] App icon (512x512)
  - [ ] Feature graphic (1024x500)
  - [ ] Screenshots (at least 2)
  - [ ] Short description (80 chars)
  - [ ] Full description (4000 chars)
  - [ ] Privacy policy URL
- [ ] AAB uploaded to Play Store
- [ ] Content rating completed
- [ ] App submitted for review

## Post-Deployment ✅

- [ ] Tested production API endpoints
- [ ] Tested mobile app with production backend
- [ ] Verified all features working:
  - [ ] User registration/login
  - [ ] Silver rates display
  - [ ] Profile information
  - [ ] News/Store info
  - [ ] Social media links
- [ ] Monitored error logs
- [ ] Set up monitoring/alerts (optional)

## Important Reminders ⚠️

1. **Update API URLs** in mobile app before building!
2. **Socket.io won't work** on Vercel - app uses HTTP polling
3. **MongoDB Atlas** - Whitelist IP `0.0.0.0/0` for Vercel
4. **JWT Secret** - Use a strong random string (min 32 chars)
5. **Version Management** - Increment version for each release

## Support Links

- Vercel Dashboard: https://vercel.com/dashboard
- Expo Dashboard: https://expo.dev
- Google Play Console: https://play.google.com/console
- MongoDB Atlas: https://cloud.mongodb.com

---

**Once all items are checked, your app is ready for production! 🎉**

