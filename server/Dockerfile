# Use lightweight Node.js 20 Alpine Linux base image
FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production

# Set application working directory
WORKDIR /usr/src/app

# Copy package manifests for dependency installation
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source files
COPY . .

# Set non-root ownership for least privilege security
RUN chown -R node:node /usr/src/app

# Run as non-root node user
USER node

# Expose server port
EXPOSE 5000

# Container health probe checking /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { if (r.statusCode !== 200) process.exit(1); })" || exit 1

# Launch application
CMD ["node", "server.js"]

