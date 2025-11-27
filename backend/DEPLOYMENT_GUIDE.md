# Deployment Guide - AWS & Vercel

This guide covers deploying the Jain Silver backend to both **AWS** and **Vercel** platforms.

## Platform Comparison

| Feature | AWS (ECS/Fargate) | Vercel |
|---------|------------------|--------|
| **File Storage** | S3 (Required) | S3 (Required - ephemeral filesystem) |
| **Database** | MongoDB Atlas | MongoDB Atlas |
| **Socket.io** | ✅ Full support | ❌ Not supported (HTTP polling) |
| **Rate Updater** | ✅ Background jobs | ❌ Not supported |
| **Cold Starts** | Minimal | Possible (serverless) |
| **Scaling** | Manual/Auto | Automatic |
| **Cost** | Pay per use | Free tier + usage |

## Prerequisites

### Common Requirements
- MongoDB Atlas account and connection string
- AWS S3 bucket for file storage
- AWS CloudFront distribution (optional but recommended)
- Environment variables configured

### AWS-Specific
- AWS account
- AWS CLI installed and configured
- Docker installed (for building images)
- ECR repository created

### Vercel-Specific
- Vercel account
- Vercel CLI (optional, can use web interface)

## Environment Variables

### Required for Both Platforms

```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/jain_silver

# JWT
JWT_SECRET=your_secure_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

# Admin
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=secure_password

# AWS (Required for file uploads on both platforms)
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=jain-storage
AWS_CLOUDFRONT_URL=https://dglrmjf688z0y.cloudfront.net
AWS_DYNAMODB_TABLE_NAME=Jain_Users
```

## Deployment to Vercel

### Option 1: Using Vercel Dashboard

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Project**
   - Root Directory: `backend`
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

3. **Set Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables from above

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

### Option 2: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd backend
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
# ... add all other variables

# Deploy to production
vercel --prod
```

### Vercel Configuration

The `vercel.json` file is already configured:
- Routes all `/api/*` requests to serverless function
- Sets CORS headers
- Configures function timeout and memory

### Vercel Limitations

- ❌ Socket.io WebSocket connections (use HTTP polling)
- ❌ Background jobs/rate updater (use scheduled functions or external service)
- ❌ Persistent file storage (must use S3)
- ⚠️ Cold starts possible (first request may be slow)

## Deployment to AWS

### Option 1: ECS/Fargate (Recommended)

#### Step 1: Build and Push to ECR

```bash
cd backend

# Build and push
./push-to-ecr.ps1  # Windows
# or
./push-to-ecr.sh   # Linux/Mac
```

#### Step 2: Create ECS Task Definition

```json
{
  "family": "jain-silver-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "jain-silver-backend",
      "image": "942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:942465943091:secret:jain-silver/mongodb"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/jain-silver-backend",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 3: Create ECS Service

```bash
aws ecs create-service \
  --cluster jain-silver-cluster \
  --service-name jain-silver-backend \
  --task-definition jain-silver-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Option 2: Docker on EC2

```bash
# SSH into EC2 instance
ssh ec2-user@your-ec2-ip

# Install Docker
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 942465943091.dkr.ecr.ap-south-1.amazonaws.com

# Pull and run
docker pull 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest
docker run -d \
  --name jain-silver-backend \
  -p 5000:5000 \
  --env-file .env \
  942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest
```

### Option 3: Using Docker Compose

```bash
cd backend
docker-compose up -d
```

## Platform Detection

The application automatically detects the platform:

```javascript
// Automatically detected:
- Vercel: process.env.VERCEL === 'true'
- AWS: process.env.AWS_EXECUTION_ENV exists
- Docker: process.env.DOCKER_CONTAINER === 'true'
- Local: None of the above
```

## File Upload Strategy

### Both Platforms Use S3

The application automatically uses S3 for file uploads on both platforms:

1. **Vercel**: Required (ephemeral filesystem)
2. **AWS**: Recommended (scalable, reliable)

Files are uploaded to:
- S3 Bucket: `jain-storage`
- Path: `documents/{timestamp}-{random}-{filename}`
- Served via: CloudFront CDN

## Database Connection

### Both Platforms Use MongoDB Atlas

Connection is optimized per platform:
- **Vercel**: Smaller connection pool (1 connection)
- **AWS**: Larger connection pool (10 connections)
- **Retry logic**: Enabled for both

## Real-time Updates

### Vercel
- ❌ Socket.io WebSocket (not supported)
- ✅ HTTP polling fallback
- Client should poll `/api/rates` every few seconds

### AWS
- ✅ Full Socket.io support
- ✅ Real-time rate updates
- ✅ Background rate updater

## Health Checks

### Vercel
- Automatic health checks via Vercel platform
- Endpoint: `/` or `/api/`

### AWS
- ECS health checks configured in task definition
- Endpoint: `/health` (if implemented)
- Docker health check in Dockerfile

## Monitoring

### Vercel
- Built-in analytics
- Function logs in dashboard
- Real-time metrics

### AWS
- CloudWatch Logs
- CloudWatch Metrics
- ECS service metrics

## Scaling

### Vercel
- Automatic scaling
- No configuration needed
- Scales to zero when idle

### AWS
- Manual scaling: Update desired count
- Auto-scaling: Configure target tracking
- Load balancer: Use ALB for multiple instances

## Cost Optimization

### Vercel
- Free tier: 100GB bandwidth, 100GB-hours execution
- Pro: $20/month for more resources
- Pay per use after limits

### AWS
- ECS Fargate: ~$0.04/vCPU-hour, ~$0.004/GB-hour
- S3: $0.023/GB storage, $0.005/1000 requests
- CloudFront: $0.085/GB data transfer

## Troubleshooting

### Vercel Issues

**Cold Start Timeout**
- Increase function timeout in `vercel.json`
- Use edge functions for faster response

**File Upload Fails**
- Verify S3 credentials
- Check IAM permissions
- Verify bucket exists

**Database Connection Issues**
- Check MongoDB Atlas IP whitelist (allow all IPs for Vercel)
- Verify connection string
- Check connection pool settings

### AWS Issues

**Container Won't Start**
- Check CloudWatch logs
- Verify task definition
- Check security groups

**Image Pull Fails**
- Verify ECR login
- Check IAM permissions
- Verify image exists

**High Costs**
- Use Fargate Spot for non-critical workloads
- Optimize container resources
- Use S3 lifecycle policies

## Best Practices

1. **Always use S3 for file storage** (required on Vercel, best practice on AWS)
2. **Use MongoDB Atlas** for managed database
3. **Set up CloudWatch/Vercel monitoring**
4. **Use secrets management** (AWS Secrets Manager / Vercel Environment Variables)
5. **Enable HTTPS** on both platforms
6. **Set up CI/CD** for automated deployments
7. **Monitor costs** regularly
8. **Test on both platforms** before production

## Quick Reference

### Vercel Deployment
```bash
cd backend
vercel --prod
```

### AWS ECR Push
```bash
cd backend
./push-to-ecr.ps1
```

### Check Platform
```bash
# The app automatically detects and logs platform on startup
# Check logs to see: "🚀 Running on platform: VERCEL" or "AWS"
```

## Support

For issues:
- Vercel: Check Vercel dashboard logs
- AWS: Check CloudWatch logs
- Both: Check application logs in console

