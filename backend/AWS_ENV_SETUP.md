# AWS Environment Variables Setup

## Required Environment Variables

Add these to your `.env` file in the `backend` directory:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=jain-storage
AWS_CLOUDFRONT_URL=dglrmjf688z0y.cloudfront.net
AWS_DYNAMODB_TABLE_NAME=Jain_Users

# Admin Credentials
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=Admin@123
```

## For Vercel Deployment

Add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable (use your actual credentials):

   - `AWS_ACCESS_KEY_ID` = `your_aws_access_key_id`
   - `AWS_SECRET_ACCESS_KEY` = `your_aws_secret_access_key`
   - `AWS_REGION` = `ap-south-1`
   - `AWS_S3_BUCKET_NAME` = `jain-storage`
   - `AWS_CLOUDFRONT_URL` = `dglrmjf688z0y.cloudfront.net`
   - `ADMIN_EMAIL` = `admin@jainsilver.com`
   - `ADMIN_PASSWORD` = `Admin@123`

## Admin Login Credentials

- **Email**: `admin@jainsilver.com`
- **Password**: `Admin@123`

⚠️ **Important**: Change the admin password after first login!

## CloudFront URL Format

All document URLs will be served via CloudFront:
- Format: `https://dglrmjf688z0y.cloudfront.net/documents/[filename]`
- Images are automatically uploaded to S3 and served via CloudFront

## Security Note

⚠️ **Never commit `.env` file to git!** It contains sensitive credentials.
The `.env` file is already in `.gitignore`.

