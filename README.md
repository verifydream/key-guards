# KeyGuard

> Dashboard keamanan API key untuk solo dev & tim kecil

[![CI](https://github.com/verifydream/key-guards/actions/workflows/ci.yml/badge.svg)](https://github.com/verifydream/key-guards/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- 🔐 **Encrypted Key Vault** — AES-256-GCM encryption, keys never stored as plaintext
- 📊 **Visual Health Monitor** — Color-coded status (healthy, rotate soon, overdue)
- 🔄 **One-Click Rotation** — Zero-downtime key rotation with configurable grace periods
- 🔍 **Git Exposure Scanner** — Detect 13+ hardcoded key patterns before commit
- 📈 **Usage Analytics** — Track API calls with status codes, response times, endpoints
- 🔒 **Always Redacted** — Key values never shown as plain text in the UI

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/verifydream/key-guards.git
cd key-guards
cp .env.example .env
# Edit .env with real secrets (see below)
docker compose up -d
```

Open `http://localhost:3100`

### Local Development

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

### VPS (PM2)

```bash
npm install && npx prisma migrate deploy && npm run build
PORT=3100 HOSTNAME=0.0.0.0 pm2 start npm --name keyguard -- start
pm2 save && pm2 startup
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | SQLite path (`file:./prod.db`) |
| `ENCRYPTION_KEY` | ✅ | 64-char hex — `openssl rand -hex 32` |
| `JWT_SECRET` | ✅ | 64-char hex — `openssl rand -hex 32` |
| `PORT` | — | Server port (default: 3000) |
| `COOKIE_SECURE` | — | `true` behind HTTPS |

## Makefile

```bash
make dev              # Start dev server
make build            # Production build
make docker-up        # Run with Docker
make docker-down      # Stop Docker
make migrate          # Run Prisma migration
make pm2-start        # Start with PM2
make pm2-logs         # View logs
make clean            # Reset node_modules
make reset-db         # Reset database
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, Register
│   ├── api/              # REST API
│   │   ├── auth/         # Authentication
│   │   ├── keys/         # Key CRUD + rotation
│   │   └── scan/         # Git scanner
│   ├── dashboard/        # Dashboard UI
│   └── settings/         # User settings
├── components/ui/        # Shadcn UI
└── lib/                  # Auth, DB, Encryption, Utils
```

## Security Model

| Layer | Protection |
|-------|-----------|
| Database | AES-256-GCM encrypted at rest |
| API responses | Sensitive fields stripped |
| UI display | Always redacted (`sk-pr***redacted***w3`) |
| Clipboard | Copy-only, explicit user action |
| Auth | JWT + httpOnly cookies |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js, Tailwind CSS, Shadcn UI |
| Backend | Next.js API Routes |
| Database | SQLite (Prisma ORM) |
| Auth | JWT (jose) |
| Encryption | AES-256-GCM (Node.js crypto) |
| Deployment | Docker, PM2, GitHub Actions |

## Contributing

1. Fork & clone the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Install deps: `npm install`
4. Start dev: `make dev`
5. Run lint: `npm run lint`
6. Commit with conventional format: `feat:`, `fix:`, `docs:`, etc.
7. Push & open a PR

PR-Agent will automatically review your PR for security issues, bugs, and code quality.

### Code Review

This repo uses [PR-Agent](https://github.com/The-PR-Agent/pr-agent) for AI-powered code reviews:

- **Auto-review** runs on every PR open/sync
- **Manual trigger**: Comment `/review` on any PR
- **Suggestions**: Comment `/improve` for actionable code suggestions

## Documentation

- [Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Deployment Guide](docs/deployment.md)

## License

[MIT](LICENSE)
