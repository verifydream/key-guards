import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { decrypt } from "@/lib/encryption";

/**
 * GET handler to explicitly reveal the plaintext value of an API key.
 * Retrieves the ciphertext from the database and decrypts it on the fly.
 *
 * @param {Request} _request - The incoming HTTP request.
 * @param {{ params: Promise<{ id: string }> }} context - The route context containing the key ID.
 * @returns {Promise<NextResponse>} JSON response containing the plaintext key value.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const key = await prisma.apiKey.findFirst({ where: { id, userId: user.userId } });
  if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const plaintext = decrypt(key.encryptedValue, key.iv, key.tag);
  return NextResponse.json({ value: plaintext });
}
