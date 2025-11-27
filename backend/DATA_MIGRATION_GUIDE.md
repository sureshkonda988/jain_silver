# 📦 Data Migration Guide - Transfer to MongoDB Atlas

This guide will help you transfer all your data from your current MongoDB to MongoDB Atlas.

## 🎯 Quick Migration (Recommended)

The easiest way to transfer all your data:

```bash
cd backend
npm run quick-migrate
```

This script will:
- ✅ Connect to your current MongoDB (from `.env` or local default)
- ✅ Connect to MongoDB Atlas
- ✅ Transfer ALL collections and documents
- ✅ Verify the migration

## 📋 Detailed Migration

For more control over the migration process:

```bash
cd backend
npm run migrate
```

This script uses Mongoose models and provides detailed statistics.

## 🔧 Setup

### Option 1: Using Current Database Connection

If your `.env` file already has `MONGODB_URI` pointing to your current database:

1. **No changes needed** - Just run:
   ```bash
   npm run quick-migrate
   ```

### Option 2: Specify Source Database

If you want to migrate from a different database:

1. **Set environment variable** (temporarily):
   ```bash
   # Windows PowerShell
   $env:SOURCE_MONGODB_URI="mongodb://localhost:27017/jain_silver"
   npm run migrate
   
   # Or create a temporary .env file with:
   # SOURCE_MONGODB_URI=mongodb://localhost:27017/jain_silver
   ```

## 📊 What Gets Migrated

The migration transfers:

1. **Users Collection** (`users`)
   - All user accounts
   - User documents (Aadhar, PAN)
   - OTP data
   - Approval status
   - All user metadata

2. **Silver Rates Collection** (`silverrates`)
   - All silver rate records
   - Rate history
   - Location data
   - All rate metadata

3. **Any Other Collections**
   - The quick-migrate script transfers ALL collections automatically

## ⚠️ Important Notes

### Before Migration

1. **Backup your data** (recommended):
   ```bash
   # Export from current database
   mongodump --uri="mongodb://localhost:27017/jain_silver" --out=./backup
   ```

2. **Verify MongoDB Atlas Connection**:
   - Make sure your Atlas cluster is running
   - Check Network Access allows your IP (or `0.0.0.0/0` for all IPs)
   - Verify database user credentials

3. **Check Current Data**:
   ```bash
   # Connect to your current database and check counts
   mongo mongodb://localhost:27017/jain_silver
   > db.users.count()
   > db.silverrates.count()
   ```

### During Migration

- The migration will **preserve all document IDs** (unless duplicates exist)
- Duplicate documents (same `_id`) will be skipped
- The migration is **safe** - it won't delete existing data in Atlas

### After Migration

1. **Verify Data in Atlas**:
   - Go to MongoDB Atlas Dashboard
   - Browse Collections
   - Verify document counts match

2. **Test Your Application**:
   - Update your `.env` to use Atlas connection string
   - Restart your backend server
   - Test API endpoints

3. **Update Vercel Environment Variables**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Update `MONGODB_URI` to Atlas connection string
   - Redeploy

## 🔍 Troubleshooting

### Connection Errors

**Error: `MongoNetworkError: connect ECONNREFUSED`**
- Check if your local MongoDB is running
- Verify the connection string is correct

**Error: `MongoServerError: Authentication failed`**
- Check MongoDB Atlas username/password
- Verify database user has read/write permissions

**Error: `MongoServerError: IP not whitelisted`**
- Go to MongoDB Atlas → Network Access
- Add your IP address or `0.0.0.0/0` (less secure but works for all IPs)

### Migration Errors

**Error: `E11000 duplicate key error`**
- This is normal - documents with same `_id` already exist in Atlas
- The script will skip duplicates and continue

**Error: `ValidationError`**
- Some documents might not match the schema
- Check the error message for specific field issues
- The script will continue with other documents

### Performance Issues

If migration is slow:
- Check your internet connection
- Large collections might take time
- The script shows progress for each collection

## 📝 Manual Migration (Alternative)

If the scripts don't work, you can use MongoDB's native tools:

### Using mongodump and mongorestore

```bash
# 1. Export from current database
mongodump --uri="mongodb://localhost:27017/jain_silver" --out=./backup

# 2. Restore to Atlas
mongorestore --uri="mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority" ./backup/jain_silver
```

## ✅ Verification Checklist

After migration, verify:

- [ ] Users collection has all documents
- [ ] Silver rates collection has all documents
- [ ] Document counts match between source and target
- [ ] Test user login works
- [ ] Test API endpoints work
- [ ] Silver rates are displaying correctly
- [ ] Admin functions work

## 🎉 Success!

Once migration is complete:

1. Update your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://Vercel-Admin-jain-silver:DIaRe6ezdzWd0gZ9@jain-silver.etdwbxx.mongodb.net/?retryWrites=true&w=majority
   ```

2. Restart your backend server

3. Update Vercel environment variables

4. Test everything works!

---

**Need Help?** Check the migration script output for detailed error messages.

