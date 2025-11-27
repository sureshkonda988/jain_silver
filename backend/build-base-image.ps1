# PowerShell script to build the base Docker image
# This base image can be reused across multiple builds for faster builds

Write-Host "🏗️  Building base Docker image for Jain Silver Backend..." -ForegroundColor Cyan

# Build the base image
docker build `
  --target base `
  -t jain-silver-backend-base:latest `
  -f Dockerfile `
  .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Base image built successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 Image: jain-silver-backend-base:latest" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 You can now build production or development images using this base:" -ForegroundColor Cyan
    Write-Host "   docker build --target production -t jain-silver-backend:prod ."
    Write-Host "   docker build --target development -t jain-silver-backend:dev ."
} else {
    Write-Host "❌ Failed to build base image" -ForegroundColor Red
    exit 1
}

