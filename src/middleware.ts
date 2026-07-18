import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"];

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
 * Next.js Middleware to handle route protection and JWT verification.
 * Permits unauthenticated access to specific public routes and API auth routes.
 * Redirects unauthenticated users to the login page for protected UI routes,
 * or returns a 401 Unauthorized JSON response for protected API routes.
 *
 * @param {NextRequest} request - The incoming HTTP request.
 * @returns {Promise<NextResponse>} The Next.js response indicating whether to proceed, redirect, or block.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith("/api/auth/"))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("keyguard-token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
