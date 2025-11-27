#!/bin/bash

# Script to build the base Docker image
# This base image can be reused across multiple builds for faster builds

set -e

echo "🏗️  Building base Docker image for Jain Silver Backend..."

# Build the base image
docker build \
  --target base \
  -t jain-silver-backend-base:latest \
  -f Dockerfile \
  .

echo "✅ Base image built successfully!"
echo ""
echo "📦 Image: jain-silver-backend-base:latest"
echo ""
echo "💡 You can now build production or development images using this base:"
echo "   docker build --target production -t jain-silver-backend:prod ."
echo "   docker build --target development -t jain-silver-backend:dev ."

