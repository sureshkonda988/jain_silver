# Backend Deployment to Vercel

## Quick Start

1. **Set up MongoDB Atlas**
   - Create account at https://mongodb.com/cloud/atlas
   - Create cluster and get connection string

2. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   cd backend
   vercel login
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard**
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A random secret key (min 32 characters)
   - `NODE_ENV`: production

4. **Get Your Vercel URL**
   - After deployment, you'll get: `https://your-app.vercel.app`
   - Update this in mobile app config files

## Important Notes

⚠️ **Socket.io Limitation**: Vercel serverless functions don't support WebSocket connections. The app will use HTTP polling as fallback for real-time updates.

## File Structure for Vercel

```
backend/
├── api/
│   └── index.js          # Vercel entry point
├── routes/               # API routes
├── models/               # MongoDB models
├── utils/                # Utility functions
├── server.js             # Express app
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## Testing Deployment

After deployment, test these endpoints:
- `https://your-app.vercel.app/` - Health check
- `https://your-app.vercel.app/api/store/info` - Store info
- `https://your-app.vercel.app/api/rates` - Silver rates

