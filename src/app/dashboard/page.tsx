"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, AlertTriangle, Clock, Eye, EyeOff, Trash2, Search } from "lucide-react";
import { getStatusColor, getStatusLabel, daysSince } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  serviceName: string;
  environment: string;
  keyAlias: string | null;
  status: string;
  computedStatus: string;
  lastRotatedAt: string;
  expiryDays: number;
  usageCount: number;
  createdAt: string;
}

interface ScanResult {
  file: string;
  line: number;
  pattern: string;
  match: string;
  severity: "high" | "medium" | "low";
}

interface ScanSummary {
  totalFiles: number;
  totalFindings: number;
  high: number;
  medium: number;
  low: number;
}

export default function DashboardPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [newKey, setNewKey] = useState({ serviceName: "", environment: "production", keyValue: "", keyAlias: "", expiryDays: "90" });
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanSummary, setScanSummary] = useState<ScanSummary | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (e) {
      console.error("Failed to fetch keys:", e);
    } finally {
      setLoading(false);
    }
  }

  async function addKey(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newKey, expiryDays: parseInt(newKey.expiryDays) || 90 }),
      });
      if (res.ok) {
        setShowAdd(false);
        setNewKey({ serviceName: "", environment: "production", keyValue: "", keyAlias: "", expiryDays: "90" });
        fetchKeys();
      }
    } catch (e) {
      console.error("Failed to add key:", e);
    }
  }

  async function deleteKey(id: string) {
    if (!confirm("Delete this key? This cannot be undone.")) return;
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    fetchKeys();
  }

  async function toggleReveal(id: string) {
    if (revealedKeys.has(id)) {
      setRevealedKeys(prev => { const n = new Set(prev); n.delete(id); return n; });
    } else {
      const res = await fetch(`/api/keys/${id}/reveal`);
      const data = await res.json();
      if (data.value) {
        navigator.clipboard.writeText(data.value);
        setRevealedKeys(prev => new Set(prev).add(id));
        setTimeout(() => setRevealedKeys(prev => { const n = new Set(prev); n.delete(id); return n; }), 5000);
      }
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    setScanning(true);
    const form = e.target as HTMLFormElement;
    const textarea = form.querySelector("textarea") as HTMLTextAreaElement;
    const text = textarea.value;
    const files = text.split("---FILE:").filter(Boolean).map(block => {
      const [name, ...rest] = block.split("\n");
      return { name: name.trim(), content: rest.join("\n") };
    });

    if (files.length === 0 || (files.length === 1 && !text.includes("---FILE:"))) {
      // Single file mode — treat entire input as one file
      files.length = 0;
      files.push({ name: "pasted-content", content: text });
    }

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      const data = await res.json();
      setScanResults(data.results || []);
      setScanSummary(data.summary || null);
    } catch (e) {
      console.error("Scan failed:", e);
    } finally {
      setScanning(false);
    }
  }

  const healthy = keys.filter(k => (k.computedStatus || k.status) === "active").length;
  const warn = keys.filter(k => (k.computedStatus || k.status) === "rotate_soon").length;
  const overdue = keys.filter(k => (k.computedStatus || k.status) === "overdue").length;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{keys.length}</p>
                <p className="text-sm text-muted-foreground">Total Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center"><Shield className="h-4 w-4 text-emerald-500" /></div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{healthy}</p>
                <p className="text-sm text-muted-foreground">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center"><Clock className="h-4 w-4 text-amber-500" /></div>
              <div>
                <p className="text-2xl font-bold text-amber-500">{warn}</p>
                <p className="text-sm text-muted-foreground">Rotate Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
              <div>
                <p className="text-2xl font-bold text-red-500">{overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Vault */}
      <div id="keys" className="scroll-mt-20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Key Vault</h2>
          <Button size="sm" className="gap-2" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="h-4 w-4" /> Add Key
          </Button>
        </div>

        {/* Add Key Form */}
        {showAdd && (
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-sm">Add New API Key</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={addKey} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service Name *</Label>
                  <Input placeholder="e.g. OpenAI, Stripe" value={newKey.serviceName} onChange={e => setNewKey(p => ({ ...p, serviceName: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" value={newKey.environment} onChange={e => setNewKey(p => ({ ...p, environment: e.target.value }))}>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>API Key Value *</Label>
                  <Input type="password" placeholder="sk-..." value={newKey.keyValue} onChange={e => setNewKey(p => ({ ...p, keyValue: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <Label>Alias (optional)</Label>
                  <Input placeholder="e.g. prod-openai" value={newKey.keyAlias} onChange={e => setNewKey(p => ({ ...p, keyAlias: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry (days)</Label>
                  <Input type="number" value={newKey.expiryDays} onChange={e => setNewKey(p => ({ ...p, expiryDays: e.target.value }))} />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit">Save Key</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Keys List */}
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : keys.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No API keys yet. Add your first key to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {keys.map(key => {
              const status = key.computedStatus || key.status;
              const days = daysSince(new Date(key.lastRotatedAt));
              return (
                <Card key={key.id} className="hover:border-emerald-500/30 transition-colors">
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className={cn("h-3 w-3 rounded-full shrink-0", 
                      status === "active" ? "bg-emerald-500" : 
                      status === "rotate_soon" ? "bg-amber-500" : 
                      status === "overdue" ? "bg-red-500" : "bg-zinc-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{key.serviceName}</span>
                        <Badge variant="secondary" className="text-xs">{key.environment}</Badge>
                        {key.keyAlias && <span className="text-xs text-muted-foreground">#{key.keyAlias}</span>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>Rotated {days}d ago</span>
                        <span>Expires in {key.expiryDays - days}d</span>
                        <span>{key.usageCount} calls</span>
                      </div>
                    </div>
                    <Badge className={cn("shrink-0", getStatusColor(status))}>{getStatusLabel(status)}</Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => toggleReveal(key.id)} title="Reveal & copy">
                        {revealedKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteKey(key.id)} title="Delete">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Git Scanner */}
      <div id="scanner" className="scroll-mt-20">
        <h2 className="text-xl font-bold mb-4">Git Exposure Scanner</h2>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleScan} className="space-y-4">
              <textarea
                className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                placeholder={"Paste your code here to scan for exposed API keys.\n\nSupports: OpenAI, Stripe, AWS, GitHub, Google, SendGrid, Supabase, and more.\n\nFor multiple files, separate with: ---FILE: filename.ext"}
              />
              <Button type="submit" disabled={scanning} className="gap-2">
                <Search className="h-4 w-4" />
                {scanning ? "Scanning..." : "Scan for Exposures"}
              </Button>
            </form>

            {scanSummary && (
              <div className="mt-6 space-y-4">
                <div className="flex gap-4 text-sm">
                  <span className="font-medium">Found {scanSummary.totalFindings} issue(s)</span>
                  {scanSummary.high > 0 && <span className="text-red-500">{scanSummary.high} high</span>}
                  {scanSummary.medium > 0 && <span className="text-amber-500">{scanSummary.medium} medium</span>}
                  {scanSummary.low > 0 && <span className="text-zinc-400">{scanSummary.low} low</span>}
                </div>
                {scanResults.length > 0 && (
                  <div className="space-y-2">
                    {scanResults.map((r, i) => (
                      <div key={i} className={cn(
                        "flex items-center gap-3 p-3 rounded-lg text-sm border",
                        r.severity === "high" ? "border-red-500/30 bg-red-500/5" :
                        r.severity === "medium" ? "border-amber-500/30 bg-amber-500/5" :
                        "border-zinc-500/30 bg-zinc-500/5"
                      )}>
                        <Badge variant={r.severity === "high" ? "destructive" : "secondary"} className="shrink-0">{r.severity}</Badge>
                        <span className="font-medium shrink-0">{r.pattern}</span>
                        <span className="text-muted-foreground shrink-0">{r.file}:{r.line}</span>
                        <code className="font-mono text-xs truncate">{r.match}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
