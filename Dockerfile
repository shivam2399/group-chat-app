# Production-grade Node.js 20 Alpine Linux container for Group Chat App
FROM node:20-alpine

# Set production environment
ENV NODE_ENV=production

# Set base application directory
WORKDIR /usr/src/app

# Copy server package manifests first for optimal layer caching
COPY server/package*.json ./server/

# Install server production dependencies cleanly
WORKDIR /usr/src/app/server
RUN npm ci --only=production

# Copy application source directories
WORKDIR /usr/src/app
COPY server/ ./server/
COPY client/ ./client/

# Set non-root ownership for least privilege security
RUN chown -R node:node /usr/src/app

# Switch to non-root node user
USER node

# Set active working directory to server where server.js runs
WORKDIR /usr/src/app/server

# Expose server port
EXPOSE 5000

# Docker health check probe against /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => { if (r.statusCode !== 200) process.exit(1); })" || exit 1

# Start application server
CMD ["node", "server.js"]

