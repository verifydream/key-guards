import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "keyguard-token";

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw === "keyguard-jwt-dev-secret-change-in-prod") {
    if (process.env.NODE_ENV === "production" && process.env.NEXT_RUNTIME !== "edge") {
      throw new Error("JWT_SECRET must be set to a strong random value in production");
    }
  }
  return new TextEncoder().encode(raw || "keyguard-jwt-dev-secret-change-in-prod");
}

/**
 * Represents the payload stored within an authentication JWT.
 */
export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Creates and signs a new JSON Web Token (JWT) for the given payload.
 *
 * @param {JWTPayload} payload - The user data to include in the token payload.
 * @returns {Promise<string>} A promise that resolves to the signed JWT string.
 * @throws {Error} Throws an error if JWT_SECRET is insecure in production.
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/**
 * Verifies the signature and validity of a given JWT.
 *
 * @param {string} token - The JWT string to verify.
 * @returns {Promise<JWTPayload | null>} A promise that resolves to the decoded payload if valid, or null if invalid or expired.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Sets an HttpOnly, secure authentication cookie containing the provided JWT.
 *
 * @param {string} token - The JWT string to store in the cookie.
 * @returns {Promise<void>} A promise that resolves when the cookie has been set.
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

/**
 * Removes the authentication cookie by deleting it from the user's browser.
 *
 * @returns {Promise<void>} A promise that resolves when the cookie has been removed.
 */
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Retrieves and verifies the JWT from the current user's request cookies.
 *
 * @returns {Promise<JWTPayload | null>} A promise that resolves to the decoded JWT payload of the current user, or null if not authenticated.
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
