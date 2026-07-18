import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken, setAuthCookie } from "@/lib/auth";

/**
 * POST handler to register a new user.
 *
 * @param {Request} request - The incoming HTTP request containing the JSON payload with `email`, `password`, and optional `name`.
 * @returns {Promise<NextResponse>} JSON response containing the created user object upon successful registration.
 * Returns 400 for missing fields, 409 if the email is already registered, and 500 on server errors.
 * Also sets an HttpOnly secure cookie with the authentication token for automatic login.
 */
export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name: name || null },
    });

    const token = await createToken({ userId: user.id, email: user.email });
    await setAuthCookie(token);

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
