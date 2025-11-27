# Backend Troubleshooting Guide

## Quick Status Check

Run this command to check if the server is running:
```powershell
.\check-backend.ps1
```

## Common Issues and Solutions

### 1. Port Already in Use (EADDRINUSE)

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
The server is already running! You have two options:

**Option A: Use the existing server**
- The server is already running and working fine
- Just use it - no need to start it again

**Option B: Restart the server**
```powershell
# Stop the existing server
.\stop-backend.ps1

# Start it again
.\start-backend.ps1
```

Or use the restart script:
```powershell
.\restart-backend.ps1
```

### 2. MongoDB Not Running

**Error:**
```
MongoDB connection error: MongoServerError: connect ECONNREFUSED
```

**Solution:**
1. Start MongoDB service:
   ```powershell
   # Check if MongoDB is running
   Get-Service MongoDB
   
   # Start MongoDB if it's stopped
   Start-Service MongoDB
   ```

2. Or start MongoDB manually:
   ```powershell
   mongod
   ```

3. Verify MongoDB is running:
   ```powershell
   .\check-backend.ps1
   ```

### 3. Missing .env File

**Error:**
```
Environment variables not loading
```

**Solution:**
```powershell
node setup-env.js
```

This will create a `.env` file with default values.

### 4. Missing Dependencies

**Error:**
```
Error: Cannot find module 'xxx'
```

**Solution:**
```powershell
npm install
```

### 5. Mobile App Can't Connect to Backend

**Symptoms:**
- App shows connection errors
- API calls fail

**Solution:**
1. Check your computer's IP address:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like '192.168.*'}
   ```

2. Update `mobile-app/config/api.js` with the correct IP address:
   ```javascript
   const API_BASE_URL = __DEV__ 
     ? 'http://YOUR_IP_ADDRESS:5000/api'
     : 'https://your-production-url.com/api';
   ```

3. Make sure:
   - Backend is running (check with `.\check-backend.ps1`)
   - Your phone and computer are on the same WiFi network
   - Firewall allows connections on port 5000

## Helper Scripts

### Start Server
```powershell
.\start-backend.ps1
```

### Stop Server
```powershell
.\stop-backend.ps1
```

### Restart Server
```powershell
.\restart-backend.ps1
```

### Check Status
```powershell
.\check-backend.ps1
```

## Manual Commands

### Start Server Manually
```powershell
cd backend
npm start
```

### Start with Auto-Reload (Development)
```powershell
cd backend
npm run dev
```

### Stop Server Manually
1. Find the process:
   ```powershell
   Get-NetTCPConnection -LocalPort 5000
   ```

2. Kill the process:
   ```powershell
   Stop-Process -Id <PROCESS_ID> -Force
   ```

## Verify Server is Working

1. **Check root endpoint:**
   ```powershell
   curl http://localhost:5000
   ```
   Should return: `{"message":"Jain Silver API Server","status":"running",...}`

2. **Check server status:**
   ```powershell
   .\check-backend.ps1
   ```

3. **Test from mobile app:**
   - Make sure IP address in `mobile-app/config/api.js` is correct
   - Try registering a new user
   - Check backend console for logs

## Current Status

✅ **Server is RUNNING** on port 5000
✅ **MongoDB is CONNECTED** on port 27017
✅ **All endpoints are accessible**

## Need More Help?

1. Check server logs in the terminal where it's running
2. Check MongoDB logs
3. Verify firewall settings
4. Check network connectivity between devices

