# Network Error Troubleshooting - Registration Endpoint

## Problem
Getting `ERR_NETWORK` error when trying to register from mobile app. Request is not reaching the server.

## Symptoms
- Error: `ERR_NETWORK` or `Network Error`
- No response object (`response: undefined`)
- File size is small (0.14MB - well under 4.5MB limit)
- Request never reaches Vercel (no logs in Vercel)

## Root Cause Analysis

The `ERR_NETWORK` error with no response means the request is being blocked **before** it reaches the server. This is different from a server error (which would have a response object).

### Possible Causes:

1. **Vercel Serverless Function Timeout**
   - Vercel has a 4.5MB request body limit
   - But more importantly, serverless functions might timeout on large requests
   - Current timeout: 120 seconds

2. **React Native FormData Format**
   - React Native FormData might not be compatible with Vercel's serverless functions
   - The multipart/form-data format might be incorrect

3. **Network/Firewall Issues**
   - Mobile device network blocking the request
   - Corporate firewall
   - VPN issues

4. **Vercel Request Size Limit**
   - Even though files are small, the total request might exceed limits
   - Headers and metadata add to the size

## Solutions to Try

### Solution 1: Test Without Files First

Test if the endpoint is reachable without files:

```javascript
// In mobile app, test this endpoint:
POST https://jain-silver.vercel.app/api/auth/register/test
Content-Type: application/json

{
  "test": "data"
}
```

If this works, the issue is with file uploads specifically.

### Solution 2: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on latest deployment → Logs
3. Look for any errors when the request is made
4. Check if the request is even reaching Vercel

### Solution 3: Reduce Image Quality Further

In `mobile-app/screens/RegisterScreen.js`:
```javascript
quality: 0.4, // Reduce from 0.6 to 0.4
```

### Solution 4: Upload Files One at a Time

Instead of uploading all 3 files at once, upload them sequentially:
1. Upload aadharFront
2. Upload aadharBack  
3. Upload panImage
4. Then submit registration

### Solution 5: Use Direct S3 Upload (Recommended)

Instead of uploading through Vercel, upload directly to S3 from the mobile app:

1. Get presigned URLs from backend
2. Upload files directly to S3 from mobile app
3. Send file URLs to registration endpoint

This bypasses Vercel's request size limits entirely.

### Solution 6: Check Network Connection

- Try on different network (WiFi vs Mobile data)
- Disable VPN if active
- Check if other API calls work (like GET /api/auth)

### Solution 7: Increase Vercel Function Timeout

In `vercel.json`:
```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 300  // Increase to 5 minutes (Pro plan required)
    }
  }
}
```

Note: This requires Vercel Pro plan.

## Debugging Steps

1. **Check if endpoint is reachable:**
   ```bash
   curl -X POST https://jain-silver.vercel.app/api/auth/register/test \
     -H "Content-Type: application/json" \
     -d '{"test":"data"}'
   ```

2. **Check Vercel logs:**
   - Look for any request logs
   - Check for errors or timeouts

3. **Test from Postman/Insomnia:**
   - Try uploading files from Postman
   - See if it works from desktop

4. **Check mobile app logs:**
   - Look for detailed error messages
   - Check network request details

## Alternative: Use Base64 Encoding

As a workaround, you could:
1. Convert images to base64 in mobile app
2. Send as JSON (not multipart/form-data)
3. Decode on server and upload to S3

This avoids multipart/form-data issues but increases payload size.

## Next Steps

1. Test the `/register/test` endpoint first
2. Check Vercel logs when making the request
3. Try reducing image quality further
4. Consider implementing direct S3 upload

## Current Status

- ✅ Endpoint is configured correctly
- ✅ CORS headers are set
- ✅ File size is small (0.14MB)
- ❌ Request not reaching server
- ❌ Need to identify why request is blocked

