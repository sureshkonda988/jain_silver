# Jain Silver Backend API

Backend server for Jain Silver mobile application.

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and update with your values:

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

## Running the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## API Documentation

See main README.md for API endpoint documentation.

## Database Models

### User
- User registration and authentication
- Document storage (Aadhar, PAN)
- OTP verification
- Admin approval status

### SilverRate
- Silver rate information
- Coin types and purity levels
- Real-time rate updates

## Real-time Updates

The server uses Socket.io to broadcast rate updates every second to all connected clients.

## File Uploads

User documents are stored in `uploads/documents/` directory. Ensure this directory has write permissions.

