# MongoDB Connection String for Vercel

## Your MongoDB Details

Based on the information provided:
- **Username**: `Vercel-Admin-jain-silver`
- **Cluster**: `jain-silver.etdwbxx.mongodb.net`
- **Database Name**: `jain_silver`

## Complete Connection String

Your full MongoDB connection string should be:

```
mongodb+srv://Vercel-Admin-jain-silver:YOUR_PASSWORD@jain-silver.etdwbxx.mongodb.net/jain_silver?retryWrites=true&w=majority
```

**Replace `YOUR_PASSWORD` with your actual database password.**

## Important Notes

### 1. Password URL Encoding
If your password contains special characters, you need to URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`
- `/` → `%2F`
- ` ` (space) → `%20`

### 2. Database Name
Make sure to include `/jain_silver` at the end of the hostname (before the `?`).

## Steps to Set in Vercel

### Step 1: Get Your Password
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Security** → **Database Access**
3. Find user `Vercel-Admin-jain-silver`
4. Click **Edit** to see or reset the password
5. Copy the password

### Step 2: Build Connection String
Replace `YOUR_PASSWORD` in this string:
```
mongodb+srv://Vercel-Admin-jain-silver:YOUR_PASSWORD@jain-silver.etdwbxx.mongodb.net/jain_silver?retryWrites=true&w=majority
```

**Example** (if password is `MyPass123`):
```
mongodb+srv://Vercel-Admin-jain-silver:MyPass123@jain-silver.etdwbxx.mongodb.net/jain_silver?retryWrites=true&w=majority
```

**Example** (if password is `My@Pass#123`, URL-encoded):
```
mongodb+srv://Vercel-Admin-jain-silver:My%40Pass%23123@jain-silver.etdwbxx.mongodb.net/jain_silver?retryWrites=true&w=majority
```

### Step 3: Set in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **jain-silver**
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `MONGODB_URI`
   - **Value**: Your complete connection string (from Step 2)
   - **Environment**: Select all three:
     - ☑ Production
     - ☑ Preview
     - ☑ Development
6. Click **Save**

### Step 4: Redeploy
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **three dots** (⋯) menu
4. Click **Redeploy**
5. Wait for deployment to complete

### Step 5: Verify
1. Go to **Deployments** → Latest deployment → **Logs**
2. Look for: `✅ MongoDB Connected successfully`
3. If you see errors, check the error message

## Test Connection

After setting up, test the endpoint:
```
https://jain-silver.vercel.app/api/auth
```

Should return JSON with auth statistics.

## Troubleshooting

### Error: "authentication failed"
- Check if password is correct
- Make sure password is URL-encoded if it has special characters
- Verify username is exactly: `Vercel-Admin-jain-silver`

### Error: "ENOTFOUND"
- Check if cluster URL is correct: `jain-silver.etdwbxx.mongodb.net`
- Verify cluster is running (not paused)

### Error: "MONGODB_URI is not set"
- Make sure environment variable is set in Vercel
- Make sure it's set for the correct environment (Production/Preview/Development)
- Redeploy after setting the variable

### Still Not Working?
1. Double-check the connection string format
2. Test the connection string in MongoDB Compass or VS Code MongoDB extension
3. Check Vercel logs for detailed error messages
4. Verify IP whitelist has `0.0.0.0/0` (already done)

