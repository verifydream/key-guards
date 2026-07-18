# KeyGuard

> A secure, comprehensive API key management dashboard for solo developers and small teams.

[![CI](https://github.com/verifydream/key-guards/actions/workflows/ci.yml/badge.svg)](https://github.com/verifydream/key-guards/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Description

KeyGuard is designed to solve the problem of securely managing API keys across multiple projects. It provides an encrypted vault, an active monitoring system for key health, and automated tools to help prevent accidental exposure.

## Features

- 🔐 **Encrypted Key Vault** — AES-256-GCM encryption, keys never stored as plaintext.
- 📊 **Visual Health Monitor** — Color-coded status (healthy, rotate soon, overdue) to track key lifecycles.
- 🔄 **One-Click Rotation** — Zero-downtime key rotation with configurable grace periods.
- 🔍 **Git Exposure Scanner** — Detect 13+ hardcoded key patterns before committing code.
- 📈 **Usage Analytics** — Track API calls with status codes, response times, and endpoints.
- 🔒 **Always Redacted** — Key values are never shown as plain text in the UI.

## Screenshots

<!-- Add screenshots here -->
![Dashboard Overview](placeholder-dashboard.png)
![Key Vault](placeholder-vault.png)

## Architecture Overview

KeyGuard combines three main components that work together to secure your secrets:

1. **Encrypted Vault**: The core database securely stores all API keys using AES-256-GCM encryption. It utilizes a master key to derive individual encryption keys, ensuring that even if the database is compromised, the keys remain unreadable.
2. **Scanner**: An integrated tool designed to scan files (like code repositories) for hardcoded secrets, preventing accidental exposure of your keys in version control systems.
3. **Analytics Engine**: Logs and analyzes API key usage. This module tracks API calls, execution times, and status codes to help monitor for suspicious activity and optimize resource usage.

These components are connected through Next.js API routes, feeding data securely to the frontend dashboard.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | The connection URL for the SQLite database (e.g., `file:./prod.db`). |
| `ENCRYPTION_KEY` | ✅ | A 64-character hex string used as the master secret for encrypting API keys in the database. Generate with `openssl rand -hex 32`. |
| `JWT_SECRET` | ✅ | A 64-character hex string used to sign authentication tokens. Generate with `openssl rand -hex 32`. |
| `PORT` | ❌ | The port the application will run on (default: `3000`). |
| `COOKIE_SECURE` | ❌ | Set to `true` if the application is running behind HTTPS to ensure secure cookies. |
| `NODE_ENV` | ❌ | Environment mode (`development`, `production`). |

## API Endpoint Reference

| Method | Path | Parameters | Response Shape | Description |
|--------|------|------------|----------------|-------------|
| **POST** | `/api/auth/register` | Body: `{ email, password, name }` | `{ user: { id, email, name } }` | Register a new user. |
| **POST** | `/api/auth/login` | Body: `{ email, password }` | `{ user: { id, email, name } }` | Authenticate and get session. |
| **GET** | `/api/auth/me` | None | `{ user: { id, email, name, createdAt } }` | Get current authenticated user. |
| **POST** | `/api/auth/logout` | None | `{ ok: true }` | Logout user. |
| **GET** | `/api/keys` | None | `{ keys: [ApiKey] }` | List all API keys for the user. |
| **POST** | `/api/keys` | Body: `{ serviceName, environment, keyValue, keyAlias, expiryDays }` | `{ key: ApiKey }` | Create a new stored API key. |
| **GET** | `/api/keys/[id]` | Path: `id` (Key ID) | `{ key: ApiKeyWithDetails }` | Get details of a specific key. |
| **PUT** | `/api/keys/[id]` | Path: `id`. Body: `{ serviceName, environment, keyAlias, expiryDays, keyValue }` | `{ key: ApiKey }` | Update an existing API key. |
| **DELETE** | `/api/keys/[id]` | Path: `id` (Key ID) | `{ ok: true }` | Delete an API key. |
| **GET** | `/api/keys/[id]/reveal`| Path: `id` (Key ID) | `{ value: "plaintext" }` | Retrieve the decrypted API key value. |
| **POST** | `/api/keys/[id]/rotate`| Path: `id`. Body: `{ newKeyValue, gracePeriodHours }`| `{ rotationId, status }` | Initiate a key rotation process. |
| **GET** | `/api/keys/[id]/usage`| Path: `id` (Key ID) | `{ logs: [UsageLog], summary: Object }` | Get usage analytics for a key. |
| **POST** | `/api/scan` | Body: `{ files: [{ name, content }] }` | `{ results: [ScanResult], summary: Object }` | Scan file contents for exposed secrets. |

*Note: The `ApiKey` response shape excludes the encrypted value, IV, and auth tag for security reasons.*

## Deployment Guide (Docker)

Docker is the recommended way to deploy KeyGuard.

### 1. Prerequisites
Ensure you have Docker and Docker Compose installed on your host machine.

### 2. Setup
Clone the repository and set up your environment:
```bash
git clone https://github.com/verifydream/key-guards.git
cd key-guards
cp .env.example .env
```

### 3. Configuration
Edit the `.env` file and set the required variables, particularly `ENCRYPTION_KEY` and `JWT_SECRET`.

### 4. Running the container
Start the application using Docker Compose:
```bash
docker compose up -d
```
This configuration uses a bridged network setup. The application will be exposed on port `3100` by default.

### Volume Mounts
The `docker-compose.yml` mounts a persistent volume for the SQLite database:
- `keyguard-data:/app/data`: Ensures your database survives container restarts.

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- npm

### 2. Installation
```bash
npm install
```

### 3. Configuration
```bash
cp .env.example .env
# Make sure to update the environment variables
```

### 4. Database Setup
Run the Prisma migrations to initialize the SQLite database:
```bash
npx prisma migrate dev
```

### 5. Running the Application
Start the development server:
```bash
npm run dev
```

### 6. Testing
Run the test suite using Vitest:
```bash
npx vitest run
# or for coverage
npx vitest run --coverage
```

## Security Model

KeyGuard prioritizes the security of your secrets through multiple layers of protection:

- **AES-256-GCM Encryption:** All API keys are encrypted at rest using AES-256-GCM, an authenticated encryption algorithm that ensures both the confidentiality and integrity of the data.
- **Key Derivation:** The master `ENCRYPTION_KEY` provided in the environment variables is never used directly as the cipher key. Instead, we use `scrypt` to derive a 32-byte key specifically for encryption. This protects against brute-force attacks.
- **Never-Plaintext Guarantee:** Key values are never stored as plaintext in the database. When retrieving lists of keys, the encrypted value, initialization vector (IV), and authentication tag are stripped from the response. The UI always redacts the keys unless explicitly requested via the `/reveal` endpoint.
- **Secure Authentication:** User sessions are managed via JWTs stored in secure, HttpOnly cookies, protecting against XSS attacks.
