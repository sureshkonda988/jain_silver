# Fix S3 Bucket ACL Error

## Error Message
```
Failed to upload file to S3: The bucket does not allow ACLs
```

## Solution

The code has been fixed to remove ACLs, but you need to ensure:

1. **Vercel has deployed the latest changes** (wait 1-2 minutes after git push)
2. **S3 bucket is configured correctly** for CloudFront access

## Option 1: Enable ACLs on S3 Bucket (Quick Fix)

If you need a quick fix, you can enable ACLs on your S3 bucket:

1. Go to AWS S3 Console
2. Select your bucket: `jain-storage`
3. Go to **Permissions** tab
4. Scroll to **Object Ownership**
5. Click **Edit**
6. Select **ACLs enabled**
7. Check **Bucket owner preferred**
8. Click **Save changes**

⚠️ **Note**: This is less secure but will work immediately.

## Option 2: Configure Bucket Policy (Recommended)

Since ACLs are disabled, configure the bucket policy to allow CloudFront access:

1. Go to AWS S3 Console
2. Select your bucket: `jain-storage`
3. Go to **Permissions** tab
4. Scroll to **Bucket policy**
5. Add this policy (replace `YOUR_CLOUDFRONT_OAI_ID` with your CloudFront OAI):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR_CLOUDFRONT_OAI_ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::jain-storage/*"
    }
  ]
}
```

Or, if you want public read access (simpler but less secure):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::jain-storage/documents/*"
    }
  ]
}
```

## Option 3: Use CloudFront Origin Access Control (OAC) - Best Practice

1. Go to CloudFront Console
2. Select your distribution
3. Go to **Origins** tab
4. Edit your S3 origin
5. Under **Origin access**, select **Origin access control settings**
6. Create a new OAC or use existing
7. Update the bucket policy with the OAC ARN

## Verify Fix

After making changes:

1. **Wait for Vercel to deploy** (check Vercel dashboard)
2. **Try registration again** from mobile app
3. **Check Vercel logs** for S3 upload success

## Current Code Status

✅ Code has been updated to remove ACL parameter
✅ Files will be uploaded without ACLs
✅ CloudFront will serve files (if configured correctly)

## Quick Test

To verify the fix is deployed, check Vercel logs when you try to register. You should see:
- ✅ `Uploaded aadharFront to S3: documents/...`
- ✅ `Uploaded aadharBack to S3: documents/...`
- ✅ `Uploaded panImage to S3: documents/...`

If you still see ACL errors, the bucket configuration needs to be updated as described above.

