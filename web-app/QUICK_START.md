# Jain Silver Plaza - Web Application

Complete web version of the Jain Silver Plaza mobile app, ready to deploy on Vercel.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

### 3. Build for Production
```bash
npm run build
```

### 4. Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm i -g vercel
vercel
```

**Option B: GitHub + Vercel Dashboard**
1. Push `web-app` folder to GitHub
2. Go to https://vercel.com
3. Click "New Project"
4. Import your repository
5. Root directory: `web-app`
6. Click "Deploy"

## 📁 Project Structure

```
web-app/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── context/        # React context (Auth)
│   ├── config/         # API configuration
│   ├── theme/          # Theme and colors
│   ├── App.jsx         # Main app component
│   └── main.jsx        # Entry point
├── public/             # Static assets
├── package.json        # Dependencies
├── vite.config.js     # Vite configuration
├── vercel.json        # Vercel deployment config
└── index.html         # HTML template
```

## ✨ Features

- ✅ User Authentication (Sign In/Register)
- ✅ Real-time Silver Rates (updates every second)
- ✅ Admin Dashboard
- ✅ User Profile Management
- ✅ Store Information & Location
- ✅ Responsive Design
- ✅ Material-UI Components

## 🔧 Technologies

- React 18
- React Router DOM
- Material-UI (MUI)
- Axios
- Vite

## 🌐 API

Uses the same backend API as mobile app:
- Base URL: `https://jain-silver.vercel.app/api`

## 📝 Notes

- All authentication uses localStorage (web-compatible)
- Real-time rates poll every second
- Fully responsive design
- Ready for Vercel deployment

