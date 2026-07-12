# Deployment Guide

## Quick Start (Docker)

```bash
# Clone and configure
git clone https://github.com/verifydream/key-guards.git
cd key-guards
cp .env.example .env
# Edit .env with real secrets

# Run
docker compose up -d
# App at http://localhost:3100
```

## VPS Deployment (PM2)

```bash
# Install
npm install
npx prisma migrate deploy
npm run build

# Run with PM2
PORT=3100 HOSTNAME=0.0.0.0 pm2 start npm --name keyguard -- start
pm2 save
pm2 startup  # follow instructions
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `file:./prod.db` | SQLite database path |
| `ENCRYPTION_KEY` | Yes | — | 64-char hex string for AES-256-GCM |
| `JWT_SECRET` | Yes | — | 64-char hex string for JWT signing |
| `PORT` | No | `3000` | Server port |
| `HOSTNAME` | No | `0.0.0.0` | Bind address |
| `COOKIE_SECURE` | No | `false` | Set `true` behind HTTPS |

### Generating secrets

```bash
openssl rand -hex 32  # generates a 64-char hex string
```

## HTTPS Setup

Behind a reverse proxy (Caddy, Nginx, etc.):

```bash
# Set in .env
COOKIE_SECURE=true
```

## Backup

```bash
# SQLite database
cp prisma/prod.db prisma/prod.db.bak

# Or with Docker
docker compose exec app cp /app/data/prod.db /app/data/prod.db.bak
```
