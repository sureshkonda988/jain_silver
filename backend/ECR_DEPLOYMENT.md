# AWS ECR Deployment Guide

This guide explains how to build and push the Jain Silver backend Docker image to AWS Elastic Container Registry (ECR).

## ECR Configuration

- **Account ID**: `942465943091`
- **Region**: `ap-south-1` (Mumbai)
- **Repository**: `jainsilver`
- **Full ECR URL**: `942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver`

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws --version
   aws configure
   ```

2. **Docker installed and running**
   ```bash
   docker --version
   ```

3. **AWS credentials with ECR permissions**
   - `ecr:GetAuthorizationToken`
   - `ecr:BatchCheckLayerAvailability`
   - `ecr:GetDownloadUrlForLayer`
   - `ecr:BatchGetImage`
   - `ecr:PutImage`
   - `ecr:InitiateLayerUpload`
   - `ecr:UploadLayerPart`
   - `ecr:CompleteLayerUpload`
   - `ecr:CreateRepository` (if creating new repository)

## Quick Start

### Option 1: Using Scripts (Recommended)

**Linux/Mac:**
```bash
cd backend
chmod +x push-to-ecr.sh
./push-to-ecr.sh [tag]
```

**Windows (PowerShell):**
```powershell
cd backend
.\push-to-ecr.ps1 -ImageTag "v1.0.0"
```

### Option 2: Manual Steps

#### 1. Login to ECR

```bash
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  942465943091.dkr.ecr.ap-south-1.amazonaws.com
```

#### 2. Create Repository (if it doesn't exist)

```bash
aws ecr create-repository \
  --repository-name jainsilver \
  --region ap-south-1 \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256
```

#### 3. Build Docker Image

```bash
docker build \
  --target production \
  -t jain-silver-backend:latest \
  -t 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest \
  -f Dockerfile .
```

#### 4. Tag Image

```bash
docker tag jain-silver-backend:latest \
  942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest

docker tag jain-silver-backend:latest \
  942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:v1.0.0
```

#### 5. Push to ECR

```bash
docker push 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest
docker push 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:v1.0.0
```

## Using the Image

### Pull from ECR

```bash
# Login first
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  942465943091.dkr.ecr.ap-south-1.amazonaws.com

# Pull image
docker pull 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest
```

### Run Container

```bash
docker run -d \
  --name jain-silver-backend \
  -p 5000:5000 \
  --env-file .env \
  942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest
```

## Deploying to ECS/Fargate

### Task Definition Example

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
        },
        {
          "name": "PORT",
          "value": "5000"
        }
      ],
      "secrets": [
        {
          "name": "MONGODB_URI",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:942465943091:secret:jain-silver/mongodb"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:ap-south-1:942465943091:secret:jain-silver/jwt"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/jain-silver-backend",
          "awslogs-region": "ap-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": [
          "CMD-SHELL",
          "node -e \"require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""
        ],
        "interval": 30,
        "timeout": 3,
        "retries": 3,
        "startPeriod": 40
      }
    }
  ]
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push to ECR

on:
  push:
    branches: [ main ]

env:
  AWS_REGION: ap-south-1
  ECR_REPOSITORY: jainsilver
  AWS_ACCOUNT_ID: 942465943091

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build --target production -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f backend/Dockerfile backend/
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
```

## Image Tags

Use semantic versioning for tags:
- `latest` - Always points to the most recent build
- `v1.0.0` - Specific version
- `v1.0.0-beta` - Pre-release versions
- `main-abc123` - Git commit-based tags

## Repository Management

### List Images

```bash
aws ecr list-images \
  --repository-name jainsilver \
  --region ap-south-1
```

### Delete Old Images

```bash
# Delete specific image
aws ecr batch-delete-image \
  --repository-name jainsilver \
  --region ap-south-1 \
  --image-ids imageTag=v1.0.0

# Delete images older than 30 days (requires jq)
aws ecr describe-images \
  --repository-name jainsilver \
  --region ap-south-1 \
  --query 'imageDetails[?imagePushedAt<`'$(date -d '30 days ago' -u +%Y-%m-%dT%H:%M:%S)'`].imageTags[0]' \
  --output json | jq -r '.[]' | xargs -I {} aws ecr batch-delete-image \
  --repository-name jainsilver \
  --region ap-south-1 \
  --image-ids imageTag={}
```

### Set Lifecycle Policy

```bash
aws ecr put-lifecycle-policy \
  --repository-name jainsilver \
  --region ap-south-1 \
  --lifecycle-policy-text '{
    "rules": [
      {
        "rulePriority": 1,
        "description": "Keep last 10 images",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 10
        },
        "action": {
          "type": "expire"
        }
      }
    ]
  }'
```

## Security Best Practices

1. **Enable Image Scanning**
   - Already enabled with `scanOnPush=true`
   - Review scan results in ECR console

2. **Use IAM Roles**
   - Use IAM roles instead of access keys when possible
   - Limit permissions to minimum required

3. **Encryption**
   - Images are encrypted at rest (AES256)
   - Use HTTPS for all ECR operations

4. **Access Control**
   - Use resource-based policies
   - Implement least privilege access

## Troubleshooting

### Authentication Errors

```bash
# Re-authenticate
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  942465943091.dkr.ecr.ap-south-1.amazonaws.com
```

### Permission Denied

- Check IAM permissions
- Verify repository exists
- Ensure correct region

### Image Push Fails

- Check Docker daemon is running
- Verify network connectivity
- Check image size limits (ECR has 10GB per layer limit)

## Cost Optimization

- Use lifecycle policies to delete old images
- Enable ECR image replication only if needed
- Monitor storage usage
- Use appropriate image sizes

## Next Steps

1. Set up ECS/Fargate service
2. Configure Application Load Balancer
3. Set up CloudWatch logging
4. Configure auto-scaling
5. Set up CI/CD pipeline

