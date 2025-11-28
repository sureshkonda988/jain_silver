# Deploy to Vercel

## Quick Deploy

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel:**

   **Option A: Using Vercel CLI**
   ```bash
   npm i -g vercel
   vercel
   ```

   **Option B: Using GitHub**
   - Push this folder to GitHub
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration
   - Click "Deploy"

## Environment Variables

No environment variables needed - uses the same backend API as mobile app.

## Features

- ✅ User authentication (sign in/register)
- ✅ Real-time silver rates (updates every second)
- ✅ Admin dashboard
- ✅ Responsive design
- ✅ Material-UI components
- ✅ React Router navigation

## Build Output

The build output will be in the `dist` folder, ready for deployment.

