# Common Errors and Fixes

## Fixed Issues

### 1. Missing .env File
**Error**: Environment variables not loading
**Fix**: Created `.env` file with default values
**Run**: `node setup-env.js` (already done)

### 2. Async Initialization Error
**Error**: `initAdmin()` called before MongoDB connection
**Fix**: Wait for MongoDB connection using `mongoose.connection.once('open')`
**Location**: `backend/server.js` lines 71-87

### 3. Rate Updater Error (No Rates)
**Error**: Rate updater fails when no rates exist
**Fix**: Check if rates exist before starting updater
**Location**: `backend/server.js` and `backend/utils/rateUpdater.js`

### 4. Console Logging Spam
**Error**: Too many "Rates updated" messages
**Fix**: Log only once per minute
**Location**: `backend/utils/rateUpdater.js`

## Common Errors You Might See

### MongoDB Connection Error
```
MongoDB connection error: MongoServerError: connect ECONNREFUSED
```
**Solution**: 
- Make sure MongoDB is running: `mongod` or check Windows Services
- Verify connection string in `.env` file

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: 
- Kill the process using port 5000
- Or change PORT in `.env` file

### Module Not Found
```
Error: Cannot find module 'xxx'
```
**Solution**: 
- Run `npm install` in backend directory
- Check if all dependencies are installed

### JWT Secret Missing
```
Error: jwt secret is required
```
**Solution**: 
- Check `.env` file exists
- Verify JWT_SECRET is set in `.env`

## How to Restart Server

1. Stop current server (Ctrl+C in terminal)
2. Start again:
   ```bash
   cd backend
   npm start
   ```

Or use nodemon for auto-restart:
```bash
npm run dev
```

## Verify Server is Working

1. Check root endpoint: `http://localhost:5000`
   - Should return JSON with server info

2. Check MongoDB connection:
   - Look for "MongoDB Connected" in console
   - If error, check MongoDB service

3. Check admin initialization:
   - Look for "Admin user created" or "Admin user already exists"

4. Check rate updater:
   - Should see "Rates updated" message (once per minute)
   - Or "No rates found" if rates not initialized

## Still Having Issues?

1. Check terminal output for specific error messages
2. Verify MongoDB is running
3. Check `.env` file exists and has correct values
4. Run `npm install` to ensure all dependencies are installed
5. Check if port 5000 is available

