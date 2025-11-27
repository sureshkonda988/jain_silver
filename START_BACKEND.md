# 🚀 START BACKEND - CRITICAL INSTRUCTIONS

## ⚠️ The Backend MUST Be Running for the Mobile App to Work

### Step 1: Open a NEW PowerShell Terminal

**DO NOT** run this in the same terminal as the mobile app.

### Step 2: Navigate to Backend Directory

```powershell
cd D:\jain_silver\backend
```

### Step 3: Start the Backend

```powershell
node server.js
```

### Step 4: Verify It's Working

**You MUST see these messages:**

```
✅ MongoDB Connected
🚀 Server running on http://0.0.0.0:5000
✅ Rate updater started (updates every second)
✅ Fetched live rate: ₹160.xx/gram...
```

**If you see ₹75.5 → STOP and restart (old code is running)**

### Step 5: Keep This Terminal Open

**DO NOT close this terminal** - the backend must keep running!

### Step 6: Test Backend is Accessible

Open browser: `http://localhost:5000/api/rates`

Should show JSON with rates showing **₹160.xx/gram** (NOT ₹75.5)

---

## 🔧 If Backend Won't Start

### Error: "MongoDB connection error"
```powershell
net start MongoDB
```

### Error: "Port 5000 already in use"
```powershell
# Find the process
netstat -ano | findstr :5000
# Kill it (replace <PID> with the number shown)
taskkill /PID <PID> /F
# Then start again
node server.js
```

### Error: "Cannot find module"
```powershell
# Make sure you're in the backend directory
cd D:\jain_silver\backend
# Install dependencies if needed
npm install
# Then start
node server.js
```

---

## ✅ Success Indicators

1. ✅ Backend terminal shows: `✅ Fetched live rate: ₹160.xx/gram...` (every second)
2. ✅ Browser shows rates at `http://localhost:5000/api/rates`
3. ✅ Mobile app can connect (no more "Network Error")
4. ✅ Mobile app shows rates updating every second

---

## 🎯 Current Status

- **Backend Code:** ✅ Fixed (uses new multi-source fetcher)
- **Rate Fetcher:** ✅ Working (fetches ₹160.xx/gram from endpoints)
- **Socket.IO:** ✅ Working (emits updates every second)
- **Frontend Code:** ✅ Fixed (better error handling)

**ONLY THING NEEDED:** Backend must be running!

