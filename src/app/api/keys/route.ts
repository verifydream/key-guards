import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { computeStatus } from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.userId },
    include: { _count: { select: { usageLogs: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Compute dynamic status
  const enriched = keys.map(k => ({
    ...k,
    computedStatus: computeStatus(k.lastRotatedAt, k.expiryDays),
    usageCount: k._count.usageLogs,
  }));

  return NextResponse.json({ keys: enriched });
}

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
    });

    return NextResponse.json({ key }, { status: 201 });
  } catch (error) {
    console.error("Create key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
