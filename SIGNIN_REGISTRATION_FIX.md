# Sign In and Registration Fixes

## Issues Fixed

### 1. Incorrect IP Address Configuration ✅
**Problem**: Frontend was configured to use `192.168.29.215:5000` but actual IP is `192.168.0.5:5000`

**Files Updated**:
- `mobile-app/config/api.js` - Updated API base URL
- `mobile-app/screens/HomeScreen.js` - Updated Socket.IO URL
- `mobile-app/screens/UserDocumentsScreen.js` - Updated document URL
- `backend/server.js` - Updated console log messages

**Fix**: Changed all IP addresses from `192.168.29.215` to `192.168.0.5`

### 2. Improved Error Handling ✅
**Problem**: Error messages were not detailed enough, making debugging difficult

**Improvements**:
- Added console logging for all API calls
- Better error message extraction from API responses
- Handles multiple error formats (message, errors array, etc.)
- Shows connection errors clearly

### 3. Email/Phone Normalization ✅
**Problem**: Email and phone might not be normalized before sending

**Fix**: 
- Email is now lowercased and trimmed
- Phone is trimmed
- Applied to both signin and admin signin

## Testing the Fixes

### Test Customer Sign In:
1. Open the app
2. Enter email or phone
3. Enter password
4. Tap "Sign In"
5. Check console logs for connection status
6. Should navigate to Home screen on success

### Test Admin Sign In:
1. Open the app
2. Tap "Admin Login"
3. Enter:
   - Email: `admin@jainsilver.com`
   - Password: `admin123`
4. Tap "Sign In"
5. Should navigate to Admin Dashboard on success

### Test Registration:
1. Open the app
2. Tap "Register"
3. Fill all fields:
   - Name
   - Email
   - Phone
   - Password
   - Confirm Password
   - Aadhar Number
   - PAN Number
4. Upload all documents (Aadhar Front, Aadhar Back, PAN Image)
5. Tap "Register"
6. Should show OTP and navigate to OTP verification

## Troubleshooting

### If sign in still doesn't work:

1. **Check Backend is Running**:
   ```bash
   cd backend
   npm start
   ```
   Should see: `🚀 Server running on http://localhost:5000`

2. **Check IP Address**:
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```
   Update `mobile-app/config/api.js` if IP changed

3. **Check Network Connection**:
   - Ensure phone and computer are on same WiFi network
   - Try accessing `http://192.168.0.5:5000` from phone browser
   - Should see JSON response with API endpoints

4. **Check Console Logs**:
   - Open React Native debugger
   - Look for error messages in console
   - Check network requests in Network tab

5. **Test Backend Directly**:
   ```bash
   # Test signin endpoint
   curl -X POST http://192.168.0.5:5000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   
   # Test admin signin
   curl -X POST http://192.168.0.5:5000/api/auth/admin/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@jainsilver.com","password":"admin123"}'
   ```

## Common Error Messages

### "Network Error" or "Connection refused"
- Backend is not running
- Wrong IP address
- Firewall blocking connection
- Phone and computer not on same network

### "Invalid credentials"
- Wrong email/phone or password
- User not approved (for customer signin)
- Check admin has approved the user

### "Account is pending"
- User registered but not approved by admin
- Admin needs to approve user first

### "Token is not valid"
- Token expired
- Invalid token format
- Clear app data and try again

## Next Steps

If issues persist:
1. Check backend logs for detailed error messages
2. Verify MongoDB is running and connected
3. Check user exists in database
4. Verify admin user was created on backend startup
5. Test API endpoints directly with curl/Postman

