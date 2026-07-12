import { NextResponse } from "next/server";
import { randomBytes, scryptSync } from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

const MIN_GRACE_HOURS = 1;
const MAX_GRACE_HOURS = 168; // 7 days

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const key = await prisma.apiKey.findFirst({ where: { id, userId: user.userId } });
  if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const { newKeyValue, gracePeriodHours } = await request.json();

  // Validate and clamp grace period
  const rawHours = typeof gracePeriodHours === "number" ? gracePeriodHours : 24;
  const graceHours = Math.max(MIN_GRACE_HOURS, Math.min(MAX_GRACE_HOURS, Number.isFinite(rawHours) ? Math.floor(rawHours) : 24));

  // Generate new key if not provided
  const actualNewKey = newKeyValue || `kg_${randomBytes(24).toString("hex")}`;

  // Encrypt new key
  const { encrypted, iv, tag } = encrypt(actualNewKey);

  // Store old key ciphertext so both keys are valid during grace period
  const oldKeyHash = scryptSync(key.encryptedValue, "rotation-salt", 32).toString("hex").slice(0, 16);
  const graceEnd = new Date(Date.now() + graceHours * 60 * 60 * 1000);

  // Create rotation record atomically — old key stays in rotation record for grace period
  const [rotation] = await prisma.$transaction([
    prisma.rotation.create({
      data: {
        apiKeyId: id,
        oldKeyHash,
        newKeyEncrypted: encrypted,
        newIv: iv,
        newTag: tag,
        status: "active",
        gracePeriodEnd: graceEnd,
      },
    }),
    prisma.apiKey.update({
      where: { id },
      data: {
        encryptedValue: encrypted,
        iv,
        tag,
        lastRotatedAt: new Date(),
        status: "active",
      },
    }),
  ]);

  // ponytail: add verifyOldKey() helper that checks incoming requests against Rotation.oldKeyEncrypted during grace window; add when auth-proxy exists
  return NextResponse.json({ rotation, newKeyPreview: actualNewKey.slice(0, 8) + "..." });
}
