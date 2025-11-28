# Fix MongoDB Connection on Vercel

## Quick Fix Steps

### 1. Check Vercel Environment Variables

Go to your Vercel project dashboard:
1. Navigate to **Settings** → **Environment Variables**
2. Look for `MONGODB_URI`
3. Make sure it's set correctly

### 2. MongoDB URI Format

Your `MONGODB_URI` should look like this:
```
mongodb+srv://username:password@cluster-name.xxxxx.mongodb.net/jain_silver?retryWrites=true&w=majority
```

**Important:**
- Replace `username` with your MongoDB Atlas username
- Replace `password` with your MongoDB Atlas password (URL-encoded if it has special characters)
- Replace `cluster-name.xxxxx.mongodb.net` with your actual cluster URL
- Replace `jain_silver` with your database name

### 3. Get Your MongoDB Connection String

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Add your database name: `jain_silver`

### 4. Set in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add or update `MONGODB_URI`:
   - **Key**: `MONGODB_URI`
   - **Value**: Your full connection string (from step 3)
   - **Environment**: Select all (Production, Preview, Development)
3. Click **Save**

### 5. Redeploy

After setting the environment variable:
1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger redeploy

### 6. Verify Connection

After redeploy, check Vercel logs:
1. Go to **Deployments** → Latest deployment → **Logs**
2. Look for: `✅ MongoDB Connected successfully`
3. If you see errors, check the error message for specific issues

## Common Issues

### Issue: "authentication failed"
**Solution**: Check username and password in connection string

### Issue: "ENOTFOUND" or "getaddrinfo"
**Solution**: Check if MongoDB URI is correct and cluster is running

### Issue: "timeout"
**Solution**: 
- Check MongoDB Atlas cluster status
- Verify IP whitelist has `0.0.0.0/0`
- Wait 2-3 minutes after IP whitelist changes

### Issue: "MONGODB_URI is not set"
**Solution**: Make sure environment variable is set in Vercel for all environments

## Test Connection

After fixing, test the endpoint:
```
https://jain-silver.vercel.app/api/auth
```

Should return JSON with auth statistics (not an error).

## Still Not Working?

1. Check Vercel logs for detailed error messages
2. Verify MongoDB Atlas cluster is running (not paused)
3. Check database user has correct permissions
4. Try connecting from MongoDB Compass with the same URI to verify it works

