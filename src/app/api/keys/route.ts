import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { computeStatus } from "@/lib/utils";

// Fields never sent to the client
const KEY_SELECT = {
  id: true,
  serviceName: true,
  environment: true,
  keyAlias: true,
  status: true,
  lastRotatedAt: true,
  expiryDays: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * GET handler to list all API keys belonging to the currently authenticated user.
 * Keys are enriched with computed status and usage counts. Sensitive fields (encrypted value, IV, tag) are stripped.
 *
 * @returns {Promise<NextResponse>} JSON response containing an array of enriched API keys.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.userId },
    select: { ...KEY_SELECT, _count: { select: { usageLogs: true } } },
    orderBy: { createdAt: "desc" },
  });

  const enriched = keys.map(k => ({
    ...k,
    computedStatus: computeStatus(k.lastRotatedAt, k.expiryDays),
    usageCount: k._count.usageLogs,
  }));

  return NextResponse.json({ keys: enriched });
}

/**
 * POST handler to securely store a new API key.
 * Encrypts the provided key value before saving it to the database.
 *
 * @param {Request} request - The incoming HTTP request containing the JSON payload with `serviceName`, `keyValue`, `environment`, `keyAlias`, and `expiryDays`.
 * @returns {Promise<NextResponse>} JSON response containing the created key metadata (excluding the plaintext/encrypted value).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { serviceName, environment, keyValue, keyAlias, expiryDays } = await request.json();
    if (!serviceName || !keyValue) {
      return NextResponse.json({ error: "Service name and key value required" }, { status: 400 });
    }

    const { encrypted, iv, tag } = encrypt(keyValue);

    const key = await prisma.apiKey.create({
      data: {
        userId: user.userId,
        serviceName,
        environment: environment || "production",
        encryptedValue: encrypted,
        iv,
        tag,
        keyAlias: keyAlias || null,
        expiryDays: expiryDays || 90,
      },
      select: KEY_SELECT,
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("Create key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
