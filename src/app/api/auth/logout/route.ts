import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";

/**
 * POST handler to log out the current user by removing their authentication cookie.
 *
 * @returns {Promise<NextResponse>} JSON response indicating successful logout (`{ ok: true }`).
 */
export async function POST() {
  await removeAuthCookie();
  return NextResponse.json({ ok: true });
}
