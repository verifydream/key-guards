"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, Check, RotateCcw, Trash2, Activity } from "lucide-react";
import { getStatusColor, getStatusLabel, daysSince, maskKey } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface KeyDetail {
  id: string;
  serviceName: string;
  environment: string;
  keyAlias: string | null;
  status: string;
  lastRotatedAt: string;
  expiryDays: number;
  createdAt: string;
  usageLogs: UsageLog[];
  rotations: Rotation[];
}

interface UsageLog {
  id: string;
  timestamp: string;
  endpoint: string | null;
  method: string | null;
  statusCode: number | null;
  responseTime: number | null;
  ip: string | null;
}

interface Rotation {
  id: string;
  status: string;
  createdAt: string;
  gracePeriodEnd: string | null;
}

export default function KeyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [key, setKey] = useState<KeyDetail | null>(null);
  const [maskedValue, setMaskedValue] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/keys/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setKey(data.key);
        // Fetch masked preview from reveal endpoint, then immediately mask it
        const revRes = await fetch(`/api/keys/${params.id}/reveal`);
        const revData = await revRes.json();
        if (revData.value) {
          setMaskedValue(maskKey(revData.value));
        }
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  async function copyKey() {
    try {
      const res = await fetch(`/api/keys/${params.id}/reveal`);
      const data = await res.json();
      if (data.value) {
        await navigator.clipboard.writeText(data.value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // clipboard may fail in non-secure contexts
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this key permanently?")) return;
    await fetch(`/api/keys/${params.id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!key) return <p className="text-red-500">Key not found</p>;

  const status = key.status;
  const days = daysSince(new Date(key.lastRotatedAt));

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{key.serviceName}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="secondary">{key.environment}</Badge>
            <Badge className={cn(getStatusColor(status))}>{getStatusLabel(status)}</Badge>
            {key.keyAlias && <span className="text-sm text-muted-foreground">#{key.keyAlias}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/rotate?keyId=${key.id}`}>
            <Button variant="outline" size="sm" className="gap-2"><RotateCcw className="h-4 w-4" /> <span className="hidden sm:inline">Rotate</span></Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2"><Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Delete</span></Button>
        </div>
      </div>

      {/* Key Value — always redacted, copy-only */}
      <Card>
        <CardHeader><CardTitle className="text-sm">API Key</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <code className="flex-1 p-3 bg-muted rounded-lg text-sm font-mono overflow-x-auto break-all text-muted-foreground select-all">
              {maskedValue || "••••••••••••••••••••••••••••••••"}
            </code>
            <Button variant={copied ? "default" : "outline"} size="sm" onClick={copyKey} className="gap-2 shrink-0 self-start sm:self-auto">
              {copied ? <><Check className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Key value is always redacted in the UI. Click Copy to copy the full key to your clipboard.
          </p>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{days}</p>
            <p className="text-xs text-muted-foreground">Days Since Rotation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{key.expiryDays - days}</p>
            <p className="text-xs text-muted-foreground">Days Until Expiry</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{key.usageLogs.length}</p>
            <p className="text-xs text-muted-foreground">Total API Calls</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{key.rotations.length}</p>
            <p className="text-xs text-muted-foreground">Rotations</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Recent Usage</CardTitle>
        </CardHeader>
        <CardContent>
          {key.usageLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No usage logs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Method</th>
                    <th className="pb-2 font-medium">Endpoint</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {key.usageLogs.map(log => (
                    <tr key={log.id} className="border-b border-border/50">
                      <td className="py-2">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs">{log.method || "-"}</Badge></td>
                      <td className="py-2 font-mono text-xs">{log.endpoint || "-"}</td>
                      <td className="py-2">
                        {log.statusCode && (
                          <span className={cn("font-mono text-xs", log.statusCode >= 400 ? "text-red-500" : "text-emerald-500")}>
                            {log.statusCode}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-muted-foreground">{log.responseTime ? `${log.responseTime}ms` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rotation History */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Rotation History</CardTitle></CardHeader>
        <CardContent>
          {key.rotations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No rotations yet</p>
          ) : (
            <div className="space-y-3">
              {key.rotations.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Badge variant={r.status === "active" ? "default" : "secondary"}>{r.status}</Badge>
                    <span className="text-sm text-muted-foreground ml-3">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  {r.gracePeriodEnd && (
                    <span className="text-xs text-muted-foreground">
                      Grace period ends: {new Date(r.gracePeriodEnd).toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
