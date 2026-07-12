# Architecture

## Overview

```
┌─────────────────────────────────────────────┐
│                 Browser                      │
│  Next.js SSR + Client Components             │
└──────────────┬──────────────────────────────┘
               │ HTTP
┌──────────────▼──────────────────────────────┐
│              Next.js Server                  │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Middleware   │  │   API Routes         │  │
│  │  (JWT auth)  │  │   /api/auth/*        │  │
│  │             │  │   /api/keys/*         │  │
│  │             │  │   /api/scan           │  │
│  └─────────────┘  └──────────┬───────────┘  │
│                              │               │
│  ┌───────────────────────────▼──────────┐   │
│  │         Prisma ORM                    │   │
│  │    ┌─────────────────────────────┐    │   │
│  │    │  AES-256-GCM Encryption     │    │   │
│  │    │  (encrypt before store,     │    │   │
│  │    │   decrypt only on /reveal)  │    │   │
│  │    └─────────────────────────────┘    │   │
│  └──────────────────┬────────────────────┘   │
│                     │                        │
│  ┌──────────────────▼────────────────────┐   │
│  │         SQLite Database               │   │
│  │    User → ApiKey → UsageLog/Rotation  │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Data Flow

1. **User stores key** → value encrypted (AES-256-GCM) → stored in SQLite
2. **Dashboard loads** → keys returned WITHOUT encryptedValue/iv/tag
3. **User copies key** → `/reveal` endpoint decrypts → clipboard only
4. **Usage logging** → API calls logged with metadata (endpoint, status, timing)
5. **Rotation** → old key hash stored, new key encrypted, grace period configured

## Security Model

| Layer | Protection |
|-------|-----------|
| Transport | HTTP (dev) / HTTPS (prod with COOKIE_SECURE=true) |
| Auth | JWT tokens, httpOnly cookies |
| API responses | Encrypted fields stripped via Prisma `select` |
| Database | AES-256-GCM encryption at rest |
| UI display | Always redacted (`sk-pr***redacted***w3`) |
| Clipboard | Only on explicit user action via `/reveal` |

## Directory Structure

```
src/
├── app/
│   ├── (auth)/          # Login, Register pages
│   ├── api/             # API routes
│   │   ├── auth/        # Register, Login, Logout, Me
│   │   ├── keys/        # CRUD, Reveal, Rotate, Usage
│   │   └── scan/        # Git exposure scanner
│   ├── dashboard/       # Dashboard pages
│   │   ├── keys/[id]/   # Key detail
│   │   └── rotate/      # Rotation wizard
│   └── settings/        # User settings
├── components/ui/       # Shadcn UI components
├── lib/
│   ├── auth.ts          # JWT utilities
│   ├── db.ts            # Prisma client
│   ├── encryption.ts    # AES-256-GCM
│   └── utils.ts         # Helpers
└── middleware.ts         # Auth middleware
```

## CI/CD Pipeline

```
PR Opened/Synced
       │
       ├──→ CI Job (build + lint + test)
       │         │
       │         └──→ Docker Build (main only)
       │
       └──→ PR-Agent (AI Code Review)
                 │
                 ├── /review  → Security, bugs, quality
                 ├── /improve → Code suggestions
                 └── /describe → Auto PR description
```

### GitHub Actions

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push to main, PR | Build, lint, Docker build |
| `pr_agent.yml` | PR open/sync, `/review` comment | AI-powered code review |

### Deployment

- **Docker**: `docker compose up -d` on VPS
- **PM2**: `pm2 start npm --name keyguard -- start`
- **Port**: 3100 (configurable via `PORT` env)
