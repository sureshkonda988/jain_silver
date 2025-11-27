# Complete Fix Instructions - Backend & Frontend

## ✅ What Has Been Fixed

1. **Backend Code Updated** - Now uses `multiSourceRateFetcher` to fetch from both endpoints
2. **No Fallback Rates** - System only uses live rates from endpoints (₹161.xx/gram)
3. **Rate Updates Every Second** - Backend fetches and updates rates every 1 second
4. **Socket.IO Updates** - Backend emits rate updates via Socket.IO every second
5. **Frontend API Config** - Configured to use `http://192.168.0.5:5000/api`
6. **Startup Script Created** - `backend/start-backend.ps1` for easy startup

## 🚀 How to Start Everything

### Step 1: Start Backend

Open a **NEW PowerShell terminal** and run:

```powershell
cd D:\jain_silver\backend
.\start-backend.ps1
```

**OR manually:**

```powershell
cd D:\jain_silver\backend
node server.js
```

**What you should see:**
- `MongoDB Connected` ✅
- `🚀 Server running on http://0.0.0.0:5000` ✅
- `✅ Rate updater started (updates every second)` ✅
- `✅ Fetched live rate: ₹161.xx/gram...` (every second) ✅

### Step 2: Verify Backend is Working

Open browser: `http://localhost:5000/api/rates`

You should see JSON with rates showing **₹161.xx/gram** (NOT ₹75.5)

### Step 3: Start Frontend (Mobile App)

In a **DIFFERENT PowerShell terminal**:

```powershell
cd D:\jain_silver\mobile-app
npx expo start -c
```

### Step 4: Test in Mobile App

1. Open the app on your phone
2. Pull to refresh - should show ₹161.xx/gram rates
3. Watch the console - should see Socket.IO updates every second with new rates

## 🔧 Troubleshooting

### Backend Not Starting

**Error: "MongoDB connection error"**
```powershell
# Start MongoDB service
net start MongoDB
```

**Error: "Port 5000 already in use"**
```powershell
# Find the process
netstat -ano | findstr :5000
# Kill it (replace <PID> with the number)
taskkill /PID <PID> /F
```

**Backend starts but shows ₹75.5 rates:**
- The backend is using old cached code
- **Solution:** Stop backend (Ctrl+C), wait 2 seconds, restart
- Make sure you're in `D:\jain_silver\backend` directory

### Frontend Network Errors

**Error: "Network Error" or "Unable to connect"**
1. Check backend is running: `netstat -ano | findstr :5000`
2. Check backend URL in `mobile-app/config/api.js` is `http://192.168.0.5:5000/api`
3. Check firewall isn't blocking port 5000
4. Make sure phone and computer are on same WiFi network

**Socket.IO not updating:**
1. Check backend logs show: `📡 Emitted Socket.IO update: ...`
2. Check frontend logs show: `📡 Socket.IO update received: ...`
3. If not, restart both backend and frontend

## 📊 Expected Behavior

### Backend Terminal Should Show:
```
✅ Fetched live rate: ₹161.15/gram (₹161150/kg, source: bcast.rbgoldspot.com)
📡 Emitted Socket.IO update: Silver Coin 1 Gram - ₹161.15/gram
📡 Emitted Socket.IO update: Silver Coin 5 Grams - ₹161.15/gram
... (10 rates updated)
✅ Updated 10 rates (Base: ₹161.15/gram from bcast.rbgoldspot.com)
```

### Frontend (Mobile App) Should Show:
- Initial load: Rates from API showing ₹161.xx/gram
- Every second: Socket.IO updates with new rates
- Console logs: `📡 Socket.IO update received: Silver Coin 1 Gram - ₹161.xx/gram`

## 🎯 Key Files

- **Backend Rate Fetcher:** `backend/utils/multiSourceRateFetcher.js`
- **Backend Rate Updater:** `backend/utils/rateUpdater.js`
- **Backend Server:** `backend/server.js`
- **Frontend API Config:** `mobile-app/config/api.js`
- **Frontend Home Screen:** `mobile-app/screens/HomeScreen.js`

## ✅ Verification Checklist

- [ ] Backend starts without errors
- [ ] Backend shows `✅ Fetched live rate: ₹161.xx/gram...` (NOT ₹75.5)
- [ ] Browser shows rates at `http://localhost:5000/api/rates` with ₹161.xx/gram
- [ ] Mobile app loads rates showing ₹161.xx/gram
- [ ] Socket.IO updates appear every second in mobile app console
- [ ] Rates change every second (not stuck at same value)

If all checkboxes are ✅, everything is working correctly!

