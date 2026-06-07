# Deployment & DevOps Guide
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Infrastructure:** Hetzner VPS + Docker  
**Deployment Method:** Git-based + Docker Compose  

---

## 1. Infrastructure Setup

### 1.1 VPS Provisioning (Hetzner)

**Recommended:** CPX31 (8 vCPU, 32 GB RAM, 160 GB NVMe)

```bash
# 1. Create server via Hetzner Cloud Console or hcloud CLI
hcloud server create \
  --name amazon-optimizer \
  --type cpx31 \
  --image ubuntu-24.04 \
  --location nbg1 \
  --ssh-key ~/.ssh/id_ed25519.pub

# 2. SSH into server
ssh root@<server-ip>

# 3. Update system
apt update && apt upgrade -y

# 4. Install Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# 5. Install Docker Compose
apt install docker-compose-plugin -y

# 6. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 7. Install PM2 globally
npm install -g pm2

# 8. Install Nginx
apt install nginx -y

# 9. Install Certbot for SSL
apt install certbot python3-certbot-nginx -y
```

### 1.2 Server Hardening

```bash
# Create non-root user
adduser deploy
usermod -aG sudo deploy
usermod -aG docker deploy

# Disable root SSH
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Setup UFW firewall
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # App (internal)
ufw enable

# Install fail2ban
apt install fail2ban -y
```

---

## 2. Application Deployment

### 2.1 Directory Structure on Server

```
/opt/amazon-optimizer/
├── app/                    # Application code
│   ├── dist/              # Built frontend
│   ├── api/               # Backend code
│   ├── db/                # Database schema
│   ├── contracts/         # Shared types
│   ├── package.json
│   └── .env
├── docker/
│   ├── docker-compose.yml
│   └── postgres-init/
├── nginx/
│   └── amazon-optimizer.conf
├── scripts/
│   ├── deploy.sh
│   └── backup.sh
├── logs/
└── backups/
```

### 2.2 Docker Compose Configuration

```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: ../app
      dockerfile: Dockerfile
    container_name: amazon-optimizer-app
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    env_file:
      - ../app/.env
    depends_on:
      - postgres
      - qdrant
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:16
    container_name: amazon-optimizer-postgres
    restart: unless-stopped
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: amazon_optimizer
      POSTGRES_USER: ${POSTGRES_USER}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres-init:/docker-entrypoint-initdb.d
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - app-network

  qdrant:
    image: qdrant/qdrant:latest
    container_name: amazon-optimizer-qdrant
    restart: unless-stopped
    volumes:
      - qdrant_data:/qdrant/storage
    ports:
      - "127.0.0.1:6333:6333"
    networks:
      - app-network

volumes:
  postgres_data:
  qdrant_data:

networks:
  app-network:
    driver: bridge
```

### 2.3 Application Dockerfile

```dockerfile
# app/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/db ./db
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["node", "dist/api/boot.js"]
```

---

## 3. Nginx Configuration

### 3.1 Reverse Proxy Setup

```nginx
# /etc/nginx/sites-available/amazon-optimizer

upstream app {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.openai.com https://api.paddle.com;" always;
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Static files (frontend)
    location /assets/ {
        alias /opt/amazon-optimizer/app/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /trpc/ {
        proxy_pass http://app/trpc/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # API routes
    location /api/ {
        proxy_pass http://app/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://app/health;
        access_log off;
    }

    # Root
    location / {
        proxy_pass http://app/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3.2 Enable Site

```bash
ln -s /etc/nginx/sites-available/amazon-optimizer \
      /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx
```

---

## 4. SSL Certificate Setup

```bash
# Obtain certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal test
certbot renew --dry-run

# Setup cron for auto-renewal
echo "0 3 * * * certbot renew --quiet" | crontab -
```

---

## 5. Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

APP_DIR="/opt/amazon-optimizer/app"
DOCKER_DIR="/opt/amazon-optimizer/docker"
BRANCH="main"

echo "=== Starting Deployment ==="

# 1. Pull latest code
cd $APP_DIR
git fetch origin
git reset --hard origin/$BRANCH

# 2. Install dependencies
npm ci

# 3. Run database migrations
echo "Running migrations..."
npm run db:migrate

# 4. Build application
echo "Building application..."
npm run build

# 5. Rebuild and restart Docker containers
cd $DOCKER_DIR
docker-compose down
docker-compose up -d --build

# 6. Health check
echo "Waiting for health check..."
sleep 10

if curl -sf http://localhost:3000/health > /dev/null; then
    echo "Deployment successful!"
else
    echo "Health check failed! Rolling back..."
    docker-compose down
    docker-compose up -d
    exit 1
fi

echo "=== Deployment Complete ==="
```

---

## 6. Backup Strategy

### 6.1 Database Backup

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/opt/amazon-optimizer/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="amazon_optimizer"
RETENTION_DAYS=30

# Create backup
pg_dump -U $POSTGRES_USER -d $DB_NAME \
    | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://your-backup-bucket/

# Clean old backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: db_$DATE.sql.gz"
```

### 6.2 Automated Backups (Cron)

```bash
# Daily backup at 3 AM
0 3 * * * /opt/amazon-optimizer/scripts/backup.sh >> /var/log/backup.log 2>&1

# Weekly full backup (Sunday)
0 4 * * 0 /opt/amazon-optimizer/scripts/backup.sh full >> /var/log/backup.log 2>&1
```

---

## 7. Monitoring & Alerting

### 7.1 Health Check Endpoint

```typescript
// api/health.ts
app.get('/health', (c) => {
  const checks = {
    database: checkDatabase(),
    qdrant: checkQdrant(),
    openai: checkOpenAI(),
    timestamp: new Date().toISOString(),
  };
  
  const allHealthy = Object.values(checks).every(c => c === true);
  
  return c.json({
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    version: process.env.APP_VERSION,
  }, allHealthy ? 200 : 503);
});
```

### 7.2 PM2 Process Management

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'amazon-optimizer',
    script: './api/boot.js',
    instances: 1, // Change to 'max' for cluster mode
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 3000,
    max_restarts: 5,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
  }],
};
```

### 7.3 Sentry Integration

**Frontend: React + Vite**

Install packages:
```bash
npm install @sentry/react
npm install -D @sentry/vite-plugin
```

Initialize in `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.0,
  replaysOnErrorSampleRate: 1.0,
});
```

Add Error Boundary in `src/components/ErrorBoundary.tsx`:
```typescript
import { ErrorBoundary as SentryErrorBoundary } from "@sentry/react";

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <button onClick={resetError}>Try again</button>
        </div>
      )}
    >
      {children}
    </SentryErrorBoundary>
  );
}
```

Set user context after auth:
```typescript
Sentry.setUser({
  id: user.id.toString(),
  email: user.email,
  username: user.name,
});
```

On logout:
```typescript
Sentry.setUser(null);
```

Configure `vite.config.ts` for source maps upload:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "your-sentry-org",
      project: "amazon-optimizer-frontend",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: "**/*.map",
      },
    }),
  ],
  build: {
    sourcemap: true,
  },
});
```

**Backend: Hono + tRPC**

Install packages:
```bash
npm install @sentry/node @sentry/profiling-node
```

Initialize before app creation in `api/boot.ts`:
```typescript
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
  integrations: [
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
```

Add Hono error handler in `api/index.ts`:
```typescript
import * as Sentry from "@sentry/node";
import { Hono } from "hono";

const app = new Hono();

// Sentry request instrumentation
Sentry.setupHonoErrorHandler(app);
```

Capture tRPC errors in `api/trpc.ts`:
```typescript
import * as Sentry from "@sentry/node";

export const t = initTRPC.context<Context>().create({
  onError: ({ path, error, ctx }) => {
    Sentry.captureException(error, {
      tags: { procedure: path },
      user: ctx?.user
        ? { id: ctx.user.id.toString(), email: ctx.user.email }
        : undefined,
    });
    console.error(`tRPC Error in ${path}:`, error);
  },
});
```

Tag user context in auth middleware (`api/middleware.ts`):
```typescript
Sentry.setUser({
  id: user.id.toString(),
  email: user.email,
});
```

**Environment Configuration**

Ensure these variables are set in production:
```env
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
SENTRY_AUTH_TOKEN=sntrys_xxx
VITE_SENTRY_DSN=${SENTRY_DSN}
VITE_APP_VERSION=1.0.0
APP_VERSION=1.0.0
```

> **Note:** `SENTRY_AUTH_TOKEN` is only required during the build step to upload source maps. It does not need to be present in the production runtime environment.

**Profiling Consideration:**
`@sentry/profiling-node` requires native compilation. If using `node:20-alpine` in Docker, add build dependencies:
```dockerfile
RUN apk add --no-cache python3 make g++
```
If native builds fail, omit profiling by removing `nodeProfilingIntegration` and `profilesSampleRate`.

**Verification:**
1. Trigger a test error in dev: `throw new Error("Sentry test")`
2. Check Sentry dashboard for the error with stack trace and user context
3. Confirm source maps resolve to original TypeScript files

---

## 8. Scaling Roadmap

| Metric | Current | Scale Trigger | Action |
|--------|---------|---------------|--------|
| CPU | 8 vCPU | >70% sustained | Upgrade to CPX41 (16 vCPU) |
| RAM | 32 GB | >80% sustained | Add swap or upgrade |
| Disk | 160 GB | >80% used | Add volume or cleanup |
| Users | 100 | >500 | Separate DB server |
| Concurrent | 100 | >500 | PM2 cluster mode |
| Global | EU only | >30% US users | US region VPS |

---

## 9. Disaster Recovery

### 9.1 Recovery Procedures

| Scenario | Recovery Time | Procedure |
|----------|--------------|-----------|
| Application crash | <2 min | PM2 auto-restart |
| Database corruption | <30 min | Restore from latest backup |
| Server failure | <1 hour | Provision new server, restore from backup |
| Data center outage | <2 hours | Switch to standby region |

### 9.2 Backup Verification

```bash
# Monthly backup test
# 1. Create test environment
docker run -d --name postgres-test -e POSTGRES_PASSWORD=test postgres:16

# 2. Restore latest backup
gunzip < /opt/amazon-optimizer/backups/db_$(ls -t backups/ | head -1) \
    | docker exec -i postgres-test psql -U postgres -d amazon_optimizer

# 3. Verify data integrity
docker exec postgres-test psql -U postgres -d amazon_optimizer -c "SELECT COUNT(*) FROM users;"

# 4. Cleanup
docker stop postgres-test && docker rm postgres-test
```
