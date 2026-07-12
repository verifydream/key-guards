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
