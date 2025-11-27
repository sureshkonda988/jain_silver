# Quick Start Guide - Backend Server

## Start the Backend

**Option 1: Use the startup script (Recommended)**
```powershell
cd D:\jain_silver\backend
.\start-backend.ps1
```

**Option 2: Manual start**
```powershell
cd D:\jain_silver\backend
node server.js
```

## What to Look For

When the backend starts successfully, you should see:

1. ✅ `MongoDB Connected` - Database connection successful
2. ✅ `🚀 Server running on http://0.0.0.0:5000` - Server started
3. ✅ `✅ Rate updater started (updates every second)` - Rate updater active
4. ✅ `✅ Fetched live rate: ₹161.xx/gram...` - Rates being fetched every second

## Troubleshooting

### MongoDB Not Running
If you see "MongoDB connection error":
- Start MongoDB service: `net start MongoDB`
- Or check Windows Services and start MongoDB manually

### Port Already in Use
If you see "EADDRINUSE: address already in use :::5000":
```powershell
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

### Network Errors in Mobile App
- Make sure backend is running on `http://192.168.0.5:5000`
- Check firewall isn't blocking port 5000
- Verify mobile app API URL is `http://192.168.0.5:5000/api`

## Verify Backend is Working

Open browser and go to: `http://localhost:5000/api/rates`

You should see JSON with silver rates showing ₹161.xx/gram (not ₹75.5)

