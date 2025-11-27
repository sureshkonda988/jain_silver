# Push Docker Image to ECR - Step by Step Guide

## Prerequisites Check

1. **Docker Desktop** - Must be running
2. **AWS CLI** - Must be installed and configured

## Step 1: Install AWS CLI (if not installed)

### Windows:
```powershell
# Download and install from:
# https://awscli.amazonaws.com/AWSCLIV2.msi

# Or using winget:
winget install Amazon.AWSCLI
```

### Verify Installation:
```powershell
aws --version
```

## Step 2: Configure AWS Credentials

```powershell
aws configure
```

Enter:
- **AWS Access Key ID**: (Your AWS Access Key ID)
- **AWS Secret Access Key**: (Your AWS Secret Access Key)
- **Default region**: `ap-south-1`
- **Default output format**: `json`

**Note**: Use your actual AWS credentials. Never commit credentials to git!

## Step 3: Start Docker Desktop

Make sure Docker Desktop is running on your Windows machine.

## Step 4: Build Docker Image

```powershell
cd backend
docker build --target production -t jain-silver-backend:latest -t 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest -f Dockerfile .
```

## Step 5: Login to ECR

```powershell
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 942465943091.dkr.ecr.ap-south-1.amazonaws.com
```

## Step 6: Create ECR Repository (if it doesn't exist)

```powershell
aws ecr create-repository --repository-name jainsilver --region ap-south-1 --image-scanning-configuration scanOnPush=true --encryption-configuration encryptionType=AES256
```

## Step 7: Tag the Image

```powershell
docker tag jain-silver-backend:latest 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest
```

## Step 8: Push to ECR

```powershell
docker push 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest
```

## Quick Script (After AWS CLI is installed)

You can also use the provided script:

```powershell
.\push-to-ecr.ps1
```

## Verify Push

```powershell
aws ecr list-images --repository-name jainsilver --region ap-south-1
```

## Troubleshooting

### Docker Desktop not running
- Start Docker Desktop application
- Wait for it to fully start
- Verify with: `docker ps`

### AWS CLI not found
- Install AWS CLI from official website
- Restart PowerShell after installation
- Verify with: `aws --version`

### Authentication failed
- Check AWS credentials: `aws configure list`
- Re-run: `aws configure`
- Verify credentials are correct

### Repository already exists error
- This is fine, just proceed to push step
- Or check existing images: `aws ecr list-images --repository-name jainsilver --region ap-south-1`

## Complete Command Sequence

```powershell
# 1. Navigate to backend directory
cd backend

# 2. Build image
docker build --target production -t 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest -f Dockerfile .

# 3. Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 942465943091.dkr.ecr.ap-south-1.amazonaws.com

# 4. Create repository (if needed - will error if exists, that's OK)
aws ecr create-repository --repository-name jainsilver --region ap-south-1 --image-scanning-configuration scanOnPush=true --encryption-configuration encryptionType=AES256

# 5. Push image
docker push 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver:latest

# 6. Verify
aws ecr list-images --repository-name jainsilver --region ap-south-1
```

