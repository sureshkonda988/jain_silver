# Docker Setup Guide

This guide explains how to run the Jain Silver backend using Docker with a multi-stage build and base image approach.

## Prerequisites

- Docker installed on your system
- Docker Compose (usually included with Docker Desktop)

## Base Image

The Dockerfile uses a multi-stage build with a base image that contains Node.js and dependencies. This allows for:
- Faster rebuilds (base layer is cached)
- Smaller production images
- Separate development and production builds

### Build Base Image First (Recommended)

**Linux/Mac:**
```bash
chmod +x build-base-image.sh
./build-base-image.sh
```

**Windows:**
```powershell
.\build-base-image.ps1
```

Or manually:
```bash
docker build --target base -t jain-silver-backend-base:latest .
```

### Build Production Image from Base

```bash
docker build --target production -t jain-silver-backend:prod .
```

### Build Development Image from Base

```bash
docker build --target development -t jain-silver-backend:dev .
```

## Quick Start

### 1. Build and Run with Docker Compose

```bash
cd backend
docker-compose up -d
```

This will:
- Build the backend Docker image
- Start MongoDB container
- Start the backend API container
- Set up networking between containers

### 2. View Logs

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View MongoDB logs only
docker-compose logs -f mongo
```

### 3. Stop Containers

```bash
docker-compose down
```

### 4. Stop and Remove Volumes (Clean Slate)

```bash
docker-compose down -v
```

## Environment Variables

Create a `.env` file in the `backend` directory with your configuration:

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://mongo:27017/jain_silver

# JWT
JWT_SECRET=your_secure_jwt_secret_here_min_32_chars
JWT_EXPIRES_IN=7d

# Admin
ADMIN_EMAIL=admin@jainsilver.com
ADMIN_PASSWORD=admin123

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=jain-storage
AWS_CLOUDFRONT_URL=https://dglrmjf688z0y.cloudfront.net
AWS_DYNAMODB_TABLE_NAME=Jain_Users
```

## Building Docker Image Manually

### Build Image

```bash
docker build -t jain-silver-backend:latest .
```

### Run Container

```bash
docker run -d \
  --name jain-silver-backend \
  -p 5000:5000 \
  --env-file .env \
  jain-silver-backend:latest
```

## Docker Commands

### View Running Containers

```bash
docker ps
```

### Execute Commands in Container

```bash
# Access shell
docker exec -it jain-silver-backend sh

# Run npm commands
docker exec -it jain-silver-backend npm run init-rates
```

### View Container Logs

```bash
docker logs -f jain-silver-backend
```

### Restart Container

```bash
docker restart jain-silver-backend
```

### Stop Container

```bash
docker stop jain-silver-backend
```

### Remove Container

```bash
docker rm jain-silver-backend
```

## Production Deployment

### Using Docker Compose

1. Update `.env` with production values
2. Build and start:

```bash
docker-compose -f docker-compose.yml up -d --build
```

### Using Docker Swarm or Kubernetes

The Dockerfile is compatible with orchestration platforms. You'll need to:
- Configure secrets management for environment variables
- Set up persistent volumes for MongoDB
- Configure load balancing
- Set up health checks

## Health Checks

The container includes health checks:
- Backend: HTTP GET to `/`
- MongoDB: `mongosh ping` command

Check health status:
```bash
docker ps  # Look for "healthy" status
```

## Troubleshooting

### Container Won't Start

1. Check logs:
```bash
docker-compose logs backend
```

2. Verify environment variables:
```bash
docker exec jain-silver-backend env
```

3. Check MongoDB connection:
```bash
docker exec jain-silver-mongo mongosh --eval "db.adminCommand('ping')"
```

### Port Already in Use

If port 5000 is already in use, change it in `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Host:Container
```

### MongoDB Connection Issues

Ensure MongoDB container is running:
```bash
docker-compose ps
```

Check MongoDB logs:
```bash
docker-compose logs mongo
```

### AWS S3 Upload Issues

1. Verify AWS credentials are set in `.env`
2. Check IAM permissions for S3 bucket
3. Verify bucket name and region

### Rebuild After Code Changes

```bash
docker-compose up -d --build
```

## Volume Management

### Backup MongoDB Data

```bash
docker exec jain-silver-mongo mongodump --out /data/backup
docker cp jain-silver-mongo:/data/backup ./backup
```

### Restore MongoDB Data

```bash
docker cp ./backup jain-silver-mongo:/data/backup
docker exec jain-silver-mongo mongorestore /data/backup
```

## Multi-Stage Build (Optional)

For smaller images, you can use a multi-stage build. The current Dockerfile uses a single stage for simplicity.

## Security Best Practices

1. **Never commit `.env` files** - Use secrets management
2. **Use Docker secrets** in production
3. **Run as non-root user** (add to Dockerfile if needed)
4. **Keep images updated** - Regularly update base image
5. **Scan for vulnerabilities**:
   ```bash
   docker scan jain-silver-backend
   ```

## Performance Optimization

1. **Use .dockerignore** - Reduces build context size
2. **Layer caching** - Order Dockerfile commands efficiently
3. **Multi-stage builds** - Reduce final image size
4. **Production dependencies only** - Use `npm ci --only=production`

## Network Configuration

The `docker-compose.yml` creates a bridge network. Containers can communicate using service names:
- Backend → MongoDB: `mongodb://mongo:27017/jain_silver`
- External → Backend: `http://localhost:5000`

## Next Steps

1. Set up CI/CD pipeline
2. Configure monitoring and logging
3. Set up reverse proxy (nginx)
4. Configure SSL/TLS certificates
5. Set up automated backups

