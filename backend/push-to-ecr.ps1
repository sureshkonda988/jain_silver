# PowerShell script to build and push Docker image to AWS ECR
# ECR Repository: 942465943091.dkr.ecr.ap-south-1.amazonaws.com/jainsilver

param(
    [string]$ImageTag = "latest"
)

# ECR Configuration
$AWS_REGION = "ap-south-1"
$AWS_ACCOUNT_ID = "942465943091"
$ECR_REPOSITORY = "jainsilver"
$IMAGE_NAME = "jain-silver-backend"

# Full ECR URL
$ECR_BASE_URL = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
$ECR_FULL_URL = "${ECR_BASE_URL}/${ECR_REPOSITORY}"

Write-Host "🚀 Building and pushing Docker image to ECR..." -ForegroundColor Cyan
Write-Host "📍 Repository: ${ECR_FULL_URL}" -ForegroundColor Yellow
Write-Host "🏷️  Tag: ${ImageTag}" -ForegroundColor Yellow
Write-Host ""

# Check if AWS CLI is installed
try {
    $null = aws --version
} catch {
    Write-Host "❌ AWS CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    $null = aws sts get-caller-identity 2>&1
} catch {
    Write-Host "❌ AWS credentials not configured. Please run 'aws configure' first." -ForegroundColor Red
    exit 1
}

# Login to ECR
Write-Host "🔐 Logging in to ECR..." -ForegroundColor Cyan
$loginCommand = aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_BASE_URL
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to ECR" -ForegroundColor Red
    exit 1
}

# Check if repository exists, create if it doesn't
Write-Host "📦 Checking ECR repository..." -ForegroundColor Cyan
$repoExists = aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "📝 Creating ECR repository..." -ForegroundColor Cyan
    aws ecr create-repository `
        --repository-name $ECR_REPOSITORY `
        --region $AWS_REGION `
        --image-scanning-configuration scanOnPush=true `
        --encryption-configuration encryptionType=AES256
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Repository created successfully!" -ForegroundColor Green
    }
}

# Build the Docker image
Write-Host "🏗️  Building Docker image..." -ForegroundColor Cyan
docker build `
    --target production `
    -t "${IMAGE_NAME}:${ImageTag}" `
    -t "${ECR_FULL_URL}:${ImageTag}" `
    -t "${ECR_FULL_URL}:latest" `
    -f Dockerfile `
    .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

# Tag the image
Write-Host "🏷️  Tagging image..." -ForegroundColor Cyan
docker tag "${IMAGE_NAME}:${ImageTag}" "${ECR_FULL_URL}:${ImageTag}"
docker tag "${IMAGE_NAME}:${ImageTag}" "${ECR_FULL_URL}:latest"

# Push to ECR
Write-Host "📤 Pushing image to ECR..." -ForegroundColor Cyan
docker push "${ECR_FULL_URL}:${ImageTag}"
docker push "${ECR_FULL_URL}:latest"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Successfully pushed to ECR!" -ForegroundColor Green
    Write-Host "📍 Image URL: ${ECR_FULL_URL}:${ImageTag}" -ForegroundColor Yellow
    Write-Host "📍 Latest URL: ${ECR_FULL_URL}:latest" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 To pull the image:" -ForegroundColor Cyan
    Write-Host "   docker pull ${ECR_FULL_URL}:${ImageTag}"
} else {
    Write-Host "❌ Failed to push image to ECR" -ForegroundColor Red
    exit 1
}

