# MongoDB Atlas Configuration

## Connection String

Your MongoDB Atlas connection string is:

```
mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority
```

## Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variable:

   **Name:** `MONGODB_URI`
   
   **Value:** `mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority`
   
   **Environment:** Production, Preview, Development (select all)

4. Click **Save**

## MongoDB Atlas IP Whitelist

**Important:** Make sure your MongoDB Atlas cluster allows connections from Vercel:

1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access**
3. Click **Add IP Address**
4. Add `0.0.0.0/0` to allow all IPs (or add Vercel's IP ranges for better security)

## Testing the Connection

After setting up the environment variable in Vercel:

1. Deploy your backend to Vercel
2. Check the deployment logs for "MongoDB Connected" message
3. Test the API endpoints:
   - `GET https://your-app.vercel.app/` - Should return server info
   - `GET https://your-app.vercel.app/api/rates` - Should return silver rates

## Local Development

For local development, you can use the same MongoDB Atlas connection string or a local MongoDB instance.

Create a `.env` file in the `backend/` directory:

```env
MONGODB_URI=mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_local_jwt_secret_key
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=admin123
OTP_EXPIRY_MINUTES=10
NODE_ENV=development
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change the admin password** in production
2. **Use a strong JWT_SECRET** (minimum 32 characters)
3. **Restrict MongoDB IP whitelist** to Vercel IP ranges if possible
4. **Never commit `.env` files** to Git (already in `.gitignore`)

