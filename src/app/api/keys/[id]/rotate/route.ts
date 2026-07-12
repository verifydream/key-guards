import { NextResponse } from "next/server";
import { randomBytes, scryptSync, createCipheriv } from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const key = await prisma.apiKey.findFirst({ where: { id, userId: user.userId } });
  if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const { newKeyValue, gracePeriodHours } = await request.json();

  // Generate new key if not provided
  const actualNewKey = newKeyValue || `kg_${randomBytes(24).toString("hex")}`;

  // Encrypt new key
  const { encrypted, iv, tag } = encrypt(actualNewKey);

  // Hash old key for audit
  const keyHash = scryptSync(key.encryptedValue, "rotation-salt", 32).toString("hex").slice(0, 16);

  const graceHours = gracePeriodHours || 24;
  const graceEnd = new Date(Date.now() + graceHours * 60 * 60 * 1000);

  // Create rotation record and update key atomically
  const [rotation] = await prisma.$transaction([
    prisma.rotation.create({
      data: {
        apiKeyId: id,
        oldKeyHash: keyHash,
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

  // ponytail: schedule old key revocation after grace period via cron; add when cron system exists
  return NextResponse.json({ rotation, newKeyPreview: actualNewKey.slice(0, 8) + "..." });
}
