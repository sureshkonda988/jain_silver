# Admin Login Troubleshooting Guide

## Default Admin Credentials

- **Email**: `admin@jainsilver.com`
- **Password**: `Admin@123`

## Common Issues and Solutions

### 1. "Invalid admin credentials" Error

**Possible Causes:**
- Admin user doesn't exist in MongoDB
- Wrong email or password
- MongoDB connection issue

**Solutions:**

#### Check if Admin Exists:
```bash
# Connect to MongoDB and check
db.users.find({ role: "admin" })
```

#### Create Admin Manually:
The admin is automatically created when the server starts. If it doesn't exist:

1. **Restart the server** - Admin will be created automatically
2. **Or create manually via MongoDB:**
   ```javascript
   // In MongoDB shell or Compass
   db.users.insertOne({
     name: "Admin",
     email: "admin@jainsilver.com",
     phone: "9999999999",
     password: "$2a$10$...", // Hashed password for "Admin@123"
     role: "admin",
     status: "approved",
     isVerified: true
   })
   ```

#### Check Server Logs:
Look for these messages when server starts:
```
✅ Admin user created successfully in MongoDB
📧 Email: admin@jainsilver.com
🔑 Password: Admin@123
```

Or:
```
✅ Admin user already exists in MongoDB
📧 Email: admin@jainsilver.com
```

### 2. MongoDB Connection Error

**Error**: "Database connection failed"

**Solution:**
- Check MongoDB URI in `.env` file
- Verify MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Vercel)
- Check network connectivity

### 3. Password Not Working

**Solution:**
1. Verify you're using: `Admin@123` (case-sensitive)
2. Check server logs for password verification errors
3. Reset admin password by updating `.env`:
   ```env
   ADMIN_PASSWORD=YourNewPassword
   ```
   Then restart the server

### 4. "Admin user not found" Error

**Solution:**
1. Check if admin exists:
   ```bash
   # In MongoDB
   db.users.find({ role: "admin" })
   ```

2. If no admin exists, restart the server - it will create one automatically

3. Verify email is correct: `admin@jainsilver.com` (lowercase)

## Testing Admin Login

### Via API:
```bash
curl -X POST https://jain-silver.vercel.app/api/auth/admin/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jainsilver.com",
    "password": "Admin@123"
  }'
```

### Expected Response:
```json
{
  "message": "Admin sign in successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin",
    "email": "admin@jainsilver.com",
    "role": "admin"
  }
}
```

## Server Logs to Check

When you try to login, check the server logs for:

1. **Connection check:**
   ```
   🔐 Admin login attempt: { email: 'admin@jainsilver.com' }
   ```

2. **User search:**
   ```
   🔍 Searching for admin user with email: admin@jainsilver.com
   ✅ Admin user found: { id: '...', email: '...', name: '...' }
   ```

3. **Password verification:**
   ```
   ✅ Password verified successfully
   ✅ Admin login successful
   ```

4. **Errors:**
   ```
   ❌ Admin user not found: admin@jainsilver.com
   ❌ Invalid password for admin: admin@jainsilver.com
   ❌ MongoDB connection failed: ...
   ```

## Quick Fix: Recreate Admin

If admin login is not working, you can force recreate the admin:

1. **Delete existing admin** (if any):
   ```javascript
   // In MongoDB
   db.users.deleteMany({ role: "admin" })
   ```

2. **Restart the server** - Admin will be created automatically

3. **Try login again** with:
   - Email: `admin@jainsilver.com`
   - Password: `Admin@123`

## Environment Variables

Make sure these are set in your `.env` file:

```env
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=Admin@123
MONGODB_URI=your_mongodb_connection_string
```

For Vercel, add these in **Settings → Environment Variables**.

