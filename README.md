# KeyGuard

> Dashboard keamanan API key untuk solo dev & tim kecil

## Features

- 🔐 **Encrypted Key Vault** — AES-256-GCM encryption for all stored API keys
- 📊 **Visual Health Monitor** — Color-coded status (healthy, rotate soon, overdue)
- 🔄 **One-Click Rotation** — Zero-downtime key rotation with grace periods
- 🔍 **Git Exposure Scanner** — Detect accidentally hardcoded keys before commit
- 📈 **Usage Analytics** — Track API calls with anomaly detection

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind CSS, Shadcn UI |
| Backend | Next.js API Routes |
| Database | SQLite (Prisma ORM) |
| Auth | JWT (email/password) |
| Encryption | AES-256-GCM (Node.js crypto) |

## Getting Started

```bash
# Install dependencies
npm install

# Setup database
npx prisma migrate dev

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Design Decisions

### Auth Method
The PRD (Issue #1) specifies passwordless magic-link auth via Supabase Auth. For this MVP
deployed on a VPS, email+password auth with JWT was chosen instead because:
- No Supabase dependency needed for self-hosted deployment
- Simpler initial setup for solo-dev use case
- Can be upgraded to magic-link/Supabase later without schema changes

When migrating to Supabase, swap the auth routes and update `src/lib/auth.ts` — the rest of
the app (middleware, key CRUD) stays the same since it only depends on `getCurrentUser()`.

## Environment Variables

Copy `.env.example` to `.env`:

```bash
DATABASE_URL="file:./dev.db"
ENCRYPTION_KEY="your-encryption-key"
JWT_SECRET="your-jwt-secret"
```

## License

MIT
