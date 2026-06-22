# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools for potential native module compilation (e.g. better-sqlite3)
RUN apk add --no-cache python3 make g++ gcc libc-dev

COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Compile TypeScript API server
RUN npm run build:server

# Prune node_modules to keep only production dependencies
RUN npm prune --production

# Stage 2: Runner stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Install runtime utilities (like curl for container health checks)
RUN apk add --no-cache curl

# Copy compiled files, database schemas/migrations, and production dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Healthcheck to ensure the container is healthy and responding
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/api/daemon.js"]
