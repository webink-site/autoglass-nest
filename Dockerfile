# Multi-stage build for production optimization
FROM node:18-alpine AS dependencies

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client
RUN npx prisma generate

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY prisma/ ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copy dependencies and built application
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package*.json ./

# Create uploads directory
RUN mkdir -p uploads && chown -R nestjs:nodejs uploads

# Switch to non-root user
USER nestjs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["npm", "run", "start:prod"]
