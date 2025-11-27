# AWS Configuration Guide

This backend is configured to use AWS services for file storage and database operations.

## AWS Services Used

1. **Amazon S3** - File storage (user documents)
2. **CloudFront** - CDN for serving files
3. **DynamoDB** - NoSQL database (optional, MongoDB is primary)

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# AWS Credentials
# IMPORTANT: Replace with your actual AWS credentials
AWS_ACCESS_KEY_ID=your_aws_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key_here
AWS_REGION=us-east-1

# AWS Services
AWS_S3_BUCKET_NAME=jain-storage
AWS_CLOUDFRONT_URL=https://dglrmjf688z0y.cloudfront.net
AWS_DYNAMODB_TABLE_NAME=Jain_Users
```

**⚠️ IMPORTANT: AWS Credentials**
- Set your AWS Access Key ID and Secret Access Key in the `.env` file
- Never commit credentials to git
- Use environment variables or AWS IAM roles in production
- Rotate credentials regularly for security

### AWS Setup Steps

1. **S3 Bucket Configuration**
   - Bucket name: `jain-storage`
   - Enable public read access for uploaded files
   - Configure CORS for web access
   - Enable versioning (optional)

2. **CloudFront Distribution**
   - Distribution URL: `dglrmjf688z0y.cloudfront.net`
   - Origin: S3 bucket `jain-storage`
   - Enable HTTPS
   - Configure caching policies

3. **DynamoDB Table** (if using)
   - Table name: `Jain_Users`
   - Primary key: `id` (String)
   - Configure read/write capacity

4. **IAM Permissions**
   Ensure your AWS credentials have these permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::jain-storage/*",
           "arn:aws:s3:::jain-storage"
         ]
       },
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:PutItem",
           "dynamodb:GetItem",
           "dynamodb:UpdateItem",
           "dynamodb:DeleteItem",
           "dynamodb:Scan",
           "dynamodb:Query"
         ],
         "Resource": "arn:aws:dynamodb:*:*:table/Jain_Users"
       }
     ]
   }
   ```

## File Upload Flow

1. User uploads file via `/api/auth/register`
2. File is stored in memory by multer
3. File is uploaded to S3 bucket `jain-storage/documents/`
4. CloudFront URL is generated and stored in database
5. Files are served via CloudFront CDN

## File URLs

Files are accessible via CloudFront:
- Format: `https://dglrmjf688z0y.cloudfront.net/documents/filename.jpg`
- Files are publicly accessible
- CDN caching improves performance

## Security Notes

⚠️ **Important**: 
- Never commit AWS credentials to git
- Use environment variables for all sensitive data
- Rotate access keys regularly
- Use IAM roles when deploying to AWS (EC2, Lambda, etc.)
- Enable S3 bucket encryption
- Configure CloudFront security headers

## Testing

Test S3 upload:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -F "name=Test User" \
  -F "email=test@example.com" \
  -F "phone=1234567890" \
  -F "password=test123" \
  -F "aadharNumber=123456789012" \
  -F "panNumber=ABCDE1234F" \
  -F "aadharFront=@test.jpg" \
  -F "aadharBack=@test.jpg" \
  -F "panImage=@test.jpg"
```

## Troubleshooting

### S3 Upload Fails
- Check AWS credentials in `.env`
- Verify bucket name and permissions
- Check IAM policy for S3 access

### CloudFront Not Serving Files
- Verify CloudFront distribution is active
- Check origin configuration
- Verify S3 bucket public access settings

### DynamoDB Errors
- Verify table exists and name matches
- Check IAM permissions for DynamoDB
- Verify region matches AWS_REGION

