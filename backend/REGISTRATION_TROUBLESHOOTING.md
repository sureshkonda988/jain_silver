# Registration Endpoint Troubleshooting

## The Issue You're Seeing

The error you're seeing:
```json
{
  "message": "Method not allowed",
  "error": "Registration endpoint requires POST method, not GET"
}
```

**This happens when someone (or a browser) tries to access `/api/auth/register` with a GET request.**

## Why This Happens

1. **Browser Testing**: When you open `https://jain-silver.vercel.app/api/auth/register` in a browser, it automatically makes a GET request. Browsers default to GET for all URLs.

2. **The Mobile App Uses POST**: Your mobile app correctly uses `api.post('/auth/register', data)` which sends a POST request.

3. **The GET Handler Was Removed**: I've removed the GET handler that was returning the 405 error. Now GET requests will return 404 (Not Found), which is the standard behavior.

## How to Verify POST Endpoint is Working

### 1. Check Vercel Logs for POST Requests

Look for logs that start with:
```
✅ POST /api/auth/register - Registration request received
```

If you see this, the POST request is reaching the server correctly.

### 2. Test with cURL (Command Line)

```bash
curl -X POST https://jain-silver.vercel.app/api/auth/register \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "phone=9123456789" \
  -F "password=test123" \
  -F "aadharNumber=123456789012" \
  -F "panNumber=ABCDE1234F" \
  -F "aadharFront=@/path/to/image.jpg" \
  -F "aadharBack=@/path/to/image.jpg" \
  -F "panImage=@/path/to/image.jpg"
```

### 3. Check Mobile App Logs

In your mobile app terminal, you should see:
```
🌐 Making API request to: https://jain-silver.vercel.app/api/auth/register
📦 FormData size check: { ... }
```

If you see network errors (ERR_NETWORK), that's a different issue (network connectivity, timeout, etc.).

## Common Issues and Solutions

### Issue 1: Network Error (ERR_NETWORK)

**Symptoms:**
- Mobile app shows "Cannot connect to backend server"
- No logs in Vercel for POST requests

**Solutions:**
1. Check internet connection
2. Verify Vercel deployment is active: https://jain-silver.vercel.app
3. Check if files are too large (max 5MB each)
4. Increase timeout in mobile app (already set to 90 seconds)

### Issue 2: 404 Not Found

**Symptoms:**
- GET request returns 404
- POST request might also return 404

**Solutions:**
1. Verify Vercel deployment is up to date
2. Check that route is loaded: Look for `✅ Route loaded: /api/auth` in Vercel logs
3. Ensure `backend/routes/auth.js` is deployed correctly

### Issue 3: 500 Internal Server Error

**Symptoms:**
- POST request reaches server but fails
- Error logs in Vercel

**Solutions:**
1. Check MongoDB connection (should be in logs)
2. Verify AWS S3 credentials are set in Vercel environment variables
3. Check file upload limits (5MB per file)
4. Review error logs for specific error messages

### Issue 4: Timeout Errors

**Symptoms:**
- Request takes too long
- 408 Request Timeout

**Solutions:**
1. Reduce image file sizes (compress images before upload)
2. Check S3 upload speed
3. Verify network connection is stable

## What to Look For in Vercel Logs

### Successful Registration:
```
✅ POST /api/auth/register - Registration request received
📋 Request details: { method: 'POST', ... }
📦 Multer middleware - Processing file uploads...
✅ Multer processing completed
📤 Uploading files to S3...
✅ All files uploaded successfully to S3
👤 Creating user in MongoDB (collection: users)...
✅ User saved to MongoDB collection "users": [user_id]
```

### Failed Registration:
```
❌ Registration error: [error message]
📊 Error details: { message: ..., code: ..., ... }
```

## Important Notes

1. **GET requests will return 404** - This is normal. Only POST requests work for registration.

2. **The mobile app uses POST** - Your `RegisterScreen.js` correctly uses `api.post()`, so it should work.

3. **File uploads require multipart/form-data** - The mobile app correctly uses FormData, which axios handles automatically.

4. **Check Vercel Function Logs** - The most important thing is to check if POST requests are reaching the server. Look for the `✅ POST /api/auth/register` log message.

## Still Having Issues?

1. **Check Vercel Deployment**: Ensure latest code is deployed
2. **Check Environment Variables**: Verify AWS credentials are set in Vercel
3. **Check MongoDB**: Ensure MongoDB Atlas IP whitelist includes Vercel IPs (0.0.0.0/0 for all)
4. **Test with cURL**: Use the cURL command above to test the endpoint directly
5. **Check Mobile App Logs**: Look for the actual error message, not just the 405 from GET requests

## Summary

- **GET 405/404 errors are normal** - They happen when testing in a browser
- **POST requests from mobile app should work** - Check Vercel logs for `✅ POST /api/auth/register`
- **If POST requests aren't reaching server** - Check network connectivity and Vercel deployment status
- **If POST requests fail** - Check error logs for specific error messages (MongoDB, S3, validation, etc.)

