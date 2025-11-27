# Jain Silver App

A comprehensive mobile application for managing silver rates with user registration, document verification, and admin approval system.

## Features

### User Features
- **Registration**: New users can register with email/phone
- **Document Upload**: Upload Aadhar card (front & back) and PAN card
- **OTP Verification**: Secure OTP-based verification during registration
- **Sign In**: Multiple sign-in options (email or phone)
- **Real-time Silver Rates**: Live silver rates updated every second
- **Rate Display**: View different silver coins and bars with various purity levels

### Admin Features
- **Admin Login**: Separate admin authentication
- **User Approval**: Approve or reject pending user registrations
- **User Management**: View all users and their status
- **Document Review**: Review uploaded documents before approval

## Project Structure

```
jain_silver/
├── backend/              # Node.js/Express backend
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── mobile-app/          # React Native mobile app
│   ├── screens/         # App screens
│   ├── config/          # Configuration files
│   ├── context/         # React context
│   └── App.js           # Main app component
└── README.md
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- React Native development environment
- Expo CLI (for mobile app)

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jain_silver
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=admin123
OTP_EXPIRY_MINUTES=10
NODE_ENV=development
```

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the backend server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

6. Initialize default silver rates:
```bash
# Make a POST request to http://localhost:5000/api/rates/initialize
# Or use Postman/curl
curl -X POST http://localhost:5000/api/rates/initialize
```

The backend will be running on `http://localhost:5000`

## Mobile App Setup

1. Navigate to the mobile-app directory:
```bash
cd mobile-app
```

2. Install dependencies:
```bash
npm install
```

3. Update the API URL in `mobile-app/config/api.js`:
   - Replace `192.168.1.100` with your local IP address (for development)
   - Or use your production URL

4. Start the Expo development server:
```bash
npm start
# or
expo start
```

5. Build APK for Android:
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK
eas build --platform android --profile preview
```

Or use Expo's build service:
```bash
expo build:android -t apk
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/resend-otp` - Resend OTP
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/admin/signin` - Admin sign in

### Users
- `GET /api/users/profile` - Get current user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)

### Admin
- `GET /api/admin/pending-users` - Get pending users (requires admin auth)
- `GET /api/admin/users` - Get all users (requires admin auth)
- `PUT /api/admin/approve-user/:userId` - Approve user (requires admin auth)
- `PUT /api/admin/reject-user/:userId` - Reject user (requires admin auth)
- `GET /api/admin/user/:userId` - Get user details (requires admin auth)

### Rates
- `GET /api/rates` - Get all silver rates (requires auth)
- `PUT /api/rates/:id` - Update rate (requires auth)
- `POST /api/rates/initialize` - Initialize default rates

## Default Admin Credentials

- **Email**: admin@jainsilver.com
- **Password**: admin123

**Important**: Change these credentials in production!

## Real-time Updates

The app uses Socket.io for real-time silver rate updates. Rates are automatically updated every second on the server and broadcast to all connected clients.

## Document Upload

Users must upload:
- Aadhar Card (front and back)
- PAN Card image

Documents are stored in the `backend/uploads/documents/` directory.

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- OTP verification for registration
- Admin approval system
- Role-based access control

## Production Deployment

### Backend
1. Set up MongoDB Atlas or your preferred MongoDB hosting
2. Update `.env` with production values
3. Deploy to Heroku, AWS, or your preferred hosting
4. Set up proper SSL certificates

### Mobile App
1. Update API URLs in `config/api.js`
2. Build production APK using EAS Build or Expo
3. Sign the APK with your keystore
4. Distribute via Google Play Store or direct download

## Troubleshooting

### Backend Issues
- Ensure MongoDB is running
- Check `.env` file configuration
- Verify port 5000 is not in use
- Check file upload permissions for `uploads/` directory

### Mobile App Issues
- Ensure backend is running and accessible
- Update API URL with correct IP address
- Check network connectivity
- Verify all dependencies are installed

## License

This project is proprietary software for Jain Silver.

## Support

For issues and questions, please contact the development team.

