# Jain Silver - Mobile App & Backend

A complete mobile application for Jain Silver with real-time silver rate updates, user management, and KYC verification.

## 📱 Features

- **Real-time Silver Rates**: Live updates every second from multiple sources
- **User Authentication**: Secure login/registration with JWT
- **KYC Verification**: Aadhar and PAN document upload for compliance
- **Profile Management**: User profile with bank details and contact information
- **Store Information**: Store timings, address, and social media links
- **Professional UI**: Modern blue theme with smooth animations

## 🏗️ Project Structure

```
jain_silver/
├── backend/          # Node.js/Express backend API
├── mobile-app/       # React Native/Expo mobile application
└── README.md         # This file
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
npm install
# Create .env file with MongoDB URI and JWT_SECRET
npm start
```

### Mobile App Setup

```bash
cd mobile-app
npm install
npm start
```

## 📚 Documentation

- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Quick Checklist**: [QUICK_DEPLOYMENT_CHECKLIST.md](./QUICK_DEPLOYMENT_CHECKLIST.md)
- **Backend Setup**: [backend/README.md](./backend/README.md)

## 🔧 Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time updates)
- JWT Authentication
- Vercel (deployment)

### Mobile App
- React Native + Expo
- React Navigation
- React Native Paper
- Socket.io Client
- AsyncStorage

## 📦 Deployment

### Backend (Vercel)
See [backend/README_DEPLOYMENT.md](./backend/README_DEPLOYMENT.md)

### Mobile App (Play Store)
See [mobile-app/README_DEPLOYMENT.md](./mobile-app/README_DEPLOYMENT.md)

## 🔐 Environment Variables

### Backend
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key (min 32 characters)
- `NODE_ENV` - Environment (development/production)

See `.env.example` for full list.

## 📞 Contact

- Phone: +91 98480 34323
- Instagram: [@jainsilverplaza](https://www.instagram.com/jainsilverplaza)
- Facebook: [Jain Silver Plaza](https://www.facebook.com/share/1CaCEfRxST/)
- YouTube: [Jain Silver Plaza](https://youtube.com/@jainsilverplaza6932)

## 📄 License

Private project - All rights reserved

---

**Repository**: https://github.com/saikiran0729/jain_silver
