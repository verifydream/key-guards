# API Reference

All endpoints require JWT auth (via cookie) unless noted.

## Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{email, password, name?}` | Create account |
| POST | `/api/auth/login` | `{email, password}` | Sign in |
| POST | `/api/auth/logout` | — | Sign out |
| GET | `/api/auth/me` | — | Current user |

## Keys

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| GET | `/api/keys` | — | List all keys (metadata only) |
| POST | `/api/keys` | `{serviceName, keyValue, environment?, keyAlias?, expiryDays?}` | Create key |
| GET | `/api/keys/[id]` | — | Key detail + usage logs |
| PUT | `/api/keys/[id]` | `{serviceName?, environment?, keyAlias?, expiryDays?, keyValue?}` | Update key |
| DELETE | `/api/keys/[id]` | — | Delete key |
| GET | `/api/keys/[id]/reveal` | — | Decrypt + return value (clipboard) |
| POST | `/api/keys/[id]/rotate` | `{newKeyValue?, gracePeriodHours?}` | Rotate key |
| GET | `/api/keys/[id]/usage` | — | Usage logs + analytics |
| POST | `/api/keys/[id]/usage` | `{endpoint, method, statusCode?, responseTime?}` | Log usage |

## Scanner

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/scan` | `{files: [{name, content}]}` | Scan code for exposed keys |

### Supported patterns
OpenAI, Stripe, AWS, GitHub, Google, SendGrid, Supabase, Heroku, generic API keys, private keys, passwords, bearer tokens, connection strings.

## Response Format

All responses are JSON. Successful mutations return the created/updated resource.
Errors return `{error: "message"}` with appropriate HTTP status.
