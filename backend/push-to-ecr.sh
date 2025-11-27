#!/bin/bash

# Script to build and push Docker image to AWS ECR
# ECR Repository: 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver

set -e

# ECR Configuration
AWS_REGION="ap-south-1"
AWS_ACCOUNT_ID="942465943091"
ECR_REPOSITORY="jainsilver"
IMAGE_NAME="jain-silver-backend"
IMAGE_TAG="${1:-latest}"

# Full ECR URL
ECR_BASE_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
ECR_FULL_URL="${ECR_BASE_URL}/${ECR_REPOSITORY}"

echo "🚀 Building and pushing Docker image to ECR..."
echo "📍 Repository: ${ECR_FULL_URL}"
echo "🏷️  Tag: ${IMAGE_TAG}"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_BASE_URL}

# Check if repository exists, create if it doesn't
echo "📦 Checking ECR repository..."
if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} &> /dev/null; then
    echo "📝 Creating ECR repository..."
    aws ecr create-repository \
        --repository-name ${ECR_REPOSITORY} \
        --region ${AWS_REGION} \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo "✅ Repository created successfully!"
fi

# Build the Docker image
echo "🏗️  Building Docker image..."
docker build \
    --target production \
    -t ${IMAGE_NAME}:${IMAGE_TAG} \
    -t ${ECR_FULL_URL}:${IMAGE_TAG} \
    -t ${ECR_FULL_URL}:latest \
    -f Dockerfile \
    .

# Tag the image
echo "🏷️  Tagging image..."
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_FULL_URL}:${IMAGE_TAG}
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_FULL_URL}:latest

# Push to ECR
echo "📤 Pushing image to ECR..."
docker push ${ECR_FULL_URL}:${IMAGE_TAG}
docker push ${ECR_FULL_URL}:latest

echo ""
echo "✅ Successfully pushed to ECR!"
echo "📍 Image URL: ${ECR_FULL_URL}:${IMAGE_TAG}"
echo "📍 Latest URL: ${ECR_FULL_URL}:latest"
echo ""
echo "💡 To pull the image:"
echo "   docker pull ${ECR_FULL_URL}:${IMAGE_TAG}"

