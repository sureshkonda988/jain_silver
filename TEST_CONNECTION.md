# Test Backend Connection

## Quick Test Commands

### 1. Check if Backend is Running
```powershell
netstat -ano | findstr :5000
```
Should show: `TCP    0.0.0.0:5000           0.0.0.0:0              LISTENING       <PID>`

### 2. Test Backend from Browser
Open: `http://localhost:5000/api/rates`
Should show JSON with rates showing ₹160.xx/gram

### 3. Test from PowerShell
```powershell
Invoke-WebRequest -Uri "http://localhost:5000/api/rates" -UseBasicParsing
```

### 4. Test from Mobile App Network
Make sure:
- Phone and computer are on same WiFi network
- Backend is accessible at `http://192.168.0.5:5000`
- Firewall allows port 5000

## If Backend is Not Running

**Start it:**
```powershell
cd D:\jain_silver\backend
node server.js
```

**You should see:**
- `MongoDB Connected` ✅
- `🚀 Server running on http://0.0.0.0:5000` ✅
- `✅ Fetched live rate: ₹160.xx/gram...` ✅

## If Mobile App Shows Network Error

1. **Check backend is running:** `netstat -ano | findstr :5000`
2. **Check IP address:** Make sure it's `192.168.0.5` (not `192.168.29.215`)
3. **Test from phone browser:** Open `http://192.168.0.5:5000/api/rates` on your phone
4. **Check firewall:** Windows Firewall might be blocking port 5000

## Fix Firewall (if needed)

```powershell
# Allow port 5000 through firewall
New-NetFirewallRule -DisplayName "Jain Silver Backend" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

