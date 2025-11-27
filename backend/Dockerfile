# Multi-stage Dockerfile for Jain Silver Backend
# Stage 1: Base image with dependencies
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci && \
    npm cache clean --force

# Stage 2: Production image
FROM base AS production

# Copy application files
COPY --chown=nodejs:nodejs . .

# Create uploads directory (for backward compatibility, though we use S3 now)
RUN mkdir -p uploads/documents && \
    chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Set environment to production
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server.js"]

# Stage 3: Development image (optional)
FROM base AS development

# Install dev dependencies
RUN npm install --only=development

# Copy application files
COPY --chown=nodejs:nodejs . .

# Create uploads directory
RUN mkdir -p uploads/documents && \
    chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Set environment to development
ENV NODE_ENV=development

# Expose port
EXPOSE 5000

# Use nodemon for development
CMD ["npm", "run", "dev"]
