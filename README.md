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

## Environment Variables

Copy `.env.example` to `.env`:

```bash
DATABASE_URL="file:./dev.db"
ENCRYPTION_KEY="your-encryption-key"
JWT_SECRET="your-jwt-secret"
```

## License

MIT
