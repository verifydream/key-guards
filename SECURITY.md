# Security Policy

## Threat Model

KeyGuard is designed with security as the foundational priority. Our threat model focuses on protecting sensitive API keys from unauthorized access, accidental exposure, and data breaches.

**What is protected:**
- API Key values
- Authentication tokens (JWTs)
- User credentials

**Attack Surfaces & Mitigations:**
- **Database Compromise:** If an attacker gains access to the database (e.g., SQLite file), they cannot read the API keys. All keys are encrypted at rest using AES-256-GCM. The encryption keys are derived from the `ENCRYPTION_KEY` environment variable, which is not stored in the database.
- **XSS (Cross-Site Scripting):** Authentication relies on HttpOnly, secure cookies, preventing JavaScript from accessing session tokens. The application utilizes React and Next.js, which have built-in XSS protections.
- **Accidental Exposure (Source Code):** The built-in Git Exposure Scanner is designed to prevent developers from accidentally committing hardcoded secrets to version control.
- **Over-the-shoulder / Screen Sharing:** The UI always redacts API keys by default, ensuring they are never accidentally shown on screen during a presentation or screen share.

## Encryption Implementation Details

KeyGuard relies heavily on robust cryptography to secure your secrets:

- **Algorithm:** AES-256-GCM (Advanced Encryption Standard with Galois/Counter Mode). This provides both confidentiality and data authenticity (integrity).
- **Key Derivation:** The raw `ENCRYPTION_KEY` from the environment is never used directly. We use `scrypt` (a memory-hard key derivation function) with a salt to derive a 32-byte master key. This defends against brute-force attacks on the encryption key itself.
- **Initialization Vector (IV):** A random 16-byte IV is generated using a secure random number generator (`crypto.randomBytes`) for every encryption operation. This ensures that encrypting the same API key multiple times produces different ciphertexts.
- **Authentication Tag:** GCM mode automatically generates an authentication tag, which is verified upon decryption to ensure the ciphertext has not been tampered with.

## Reporting a Vulnerability

We take the security of KeyGuard very seriously. If you discover a security vulnerability within KeyGuard, please do not disclose it publicly.

Instead, please send an email to the maintainers at [your-email@example.com] or open a private security advisory on GitHub if enabled.

Please include the following information in your report:
- A description of the vulnerability.
- Steps to reproduce the issue.
- Potential impact.

We will endeavor to respond to your report within 48 hours and work with you to resolve the issue promptly.

## Supported Versions

Currently, only the latest `main` branch and the most recent release tag are supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |
