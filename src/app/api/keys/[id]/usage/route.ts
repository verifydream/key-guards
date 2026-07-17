import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET handler to fetch usage logs and compute basic analytics (total calls, errors, average response time) for a specific API key.
 *
 * @param {Request} _request - The incoming HTTP request.
 * @param {{ params: Promise<{ id: string }> }} context - The route context containing the key ID.
 * @returns {Promise<NextResponse>} JSON response containing the usage logs and computed analytics.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const key = await prisma.apiKey.findFirst({ where: { id, userId: user.userId } });
  if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const logs = await prisma.usageLog.findMany({
    where: { apiKeyId: id },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  // Compute basic analytics
  const totalCalls = logs.length;
  const errorCalls = logs.filter(l => l.statusCode && l.statusCode >= 400).length;
  const avgResponseTime = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + (l.responseTime || 0), 0) / logs.length)
    : 0;

  return NextResponse.json({ logs, analytics: { totalCalls, errorCalls, avgResponseTime } });
}

/**
 * POST handler to record a new usage log entry for a specific API key.
 * Used internally by the analytics engine or proxies.
 *
 * @param {Request} request - The incoming HTTP request containing the log details (endpoint, method, statusCode, ip, userAgent, responseTime).
 * @param {{ params: Promise<{ id: string }> }} context - The route context containing the key ID.
 * @returns {Promise<NextResponse>} JSON response containing the newly created usage log.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const key = await prisma.apiKey.findFirst({ where: { id, userId: user.userId } });
  if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 });

  const { endpoint, method, statusCode, ip, userAgent, responseTime } = await request.json();

  const log = await prisma.usageLog.create({
    data: {
      apiKeyId: id,
      endpoint,
      method,
      statusCode,
      ip,
      userAgent,
      responseTime,
    },
  });

  return NextResponse.json({ log }, { status: 201 });
}
