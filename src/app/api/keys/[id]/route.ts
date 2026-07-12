import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const key = await prisma.apiKey.findFirst({
    where: { id, userId: user.userId },
    select: {
      ...KEY_SELECT,
      usageLogs: { orderBy: { timestamp: "desc" }, take: 50 },
      rotations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });
  return NextResponse.json({ key });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.apiKey.findFirst({ where: { id, userId: user.userId } });
  if (!existing) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {};
  if (body.serviceName) updateData.serviceName = body.serviceName;
  if (body.environment) updateData.environment = body.environment;
  if (body.keyAlias !== undefined) updateData.keyAlias = body.keyAlias;
  if (body.expiryDays) updateData.expiryDays = body.expiryDays;

  if (body.keyValue) {
    const { encrypted, iv, tag } = encrypt(body.keyValue);
    updateData.encryptedValue = encrypted;
    updateData.iv = iv;
    updateData.tag = tag;
    updateData.lastRotatedAt = new Date();
  }

  const key = await prisma.apiKey.update({ where: { id }, data: updateData, select: KEY_SELECT });
  return NextResponse.json({ key });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.apiKey.findFirst({ where: { id, userId: user.userId } });
  if (!existing) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
