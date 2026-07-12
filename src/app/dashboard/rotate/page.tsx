"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Shield } from "lucide-react";
import Link from "next/link";

interface KeyOption {
  id: string;
  serviceName: string;
  environment: string;
  keyAlias: string | null;
}

function RotatePageInner() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("keyId");

  const [step, setStep] = useState(preselectedId ? 2 : 1);
  const [keys, setKeys] = useState<KeyOption[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState(preselectedId || "");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [generateNew, setGenerateNew] = useState(true);
  const [graceHours, setGraceHours] = useState("24");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ rotationId: string; newKeyPreview: string } | null>(null);

  useEffect(() => {
    fetch("/api/keys").then(r => r.json()).then(d => setKeys(d.keys || []));
  }, []);

  const selectedKey = keys.find(k => k.id === selectedKeyId);

  async function handleRotate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/keys/${selectedKeyId}/rotate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newKeyValue: generateNew ? undefined : newKeyValue,
          gracePeriodHours: parseInt(graceHours) || 24,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ rotationId: data.rotation.id, newKeyPreview: data.newKeyPreview });
        setStep(3);
      }
    } catch (e) {
      console.error("Rotation failed:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Key Rotation Wizard</h1>
        <p className="text-muted-foreground mt-1">Rotate your API key with zero downtime</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${
              step >= s ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            }`}>
              {step > s ? <Check className="h-3.5 w-3.5" /> : s}
            </div>
            <span className={step >= s ? "text-foreground" : "text-muted-foreground"}>
              {s === 1 ? "Select Key" : s === 2 ? "Configure" : "Complete"}
            </span>
            {s < 3 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Key to Rotate</CardTitle>
            <CardDescription>Choose the API key you want to rotate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {keys.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No keys available. Add one first.</p>
            ) : (
              keys.map(k => (
                <button
                  key={k.id}
                  onClick={() => { setSelectedKeyId(k.id); setStep(2); }}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedKeyId === k.id
                      ? "border-emerald-500 bg-emerald-500/5"
                      : "border-border hover:border-emerald-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{k.serviceName}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">{k.environment}</Badge>
                      {k.keyAlias && <span className="text-xs text-muted-foreground ml-2">#{k.keyAlias}</span>}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Configure */}
      {step === 2 && selectedKey && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Rotation</CardTitle>
            <CardDescription>Rotating key for {selectedKey.serviceName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="gen-new"
                  checked={generateNew}
                  onChange={() => setGenerateNew(true)}
                  className="accent-emerald-500"
                />
                <label htmlFor="gen-new" className="text-sm font-medium">Auto-generate new key</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="manual"
                  checked={!generateNew}
                  onChange={() => setGenerateNew(false)}
                  className="accent-emerald-500"
                />
                <label htmlFor="manual" className="text-sm font-medium">Provide my own key</label>
              </div>
              {!generateNew && (
                <Input
                  type="password"
                  placeholder="Paste your new API key"
                  value={newKeyValue}
                  onChange={e => setNewKeyValue(e.target.value)}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Grace Period (hours)</Label>
              <Input
                type="number"
                value={graceHours}
                onChange={e => setGraceHours(e.target.value)}
                min="1"
                max="168"
              />
              <p className="text-xs text-muted-foreground">
                Both old and new keys remain valid during this period for zero-downtime rotation.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={handleRotate} disabled={loading} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                {loading ? "Rotating..." : "Rotate Key"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Complete */}
      {step === 3 && result && (
        <Card>
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <CardTitle>Rotation Complete!</CardTitle>
            <CardDescription>Your API key has been successfully rotated</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-1">New key preview</p>
              <code className="text-sm font-mono">{result.newKeyPreview}</code>
            </div>
            <p className="text-sm text-muted-foreground">
              Grace period: <strong>{graceHours} hours</strong>. Both keys are valid during this window.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function RotatePage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
      <RotatePageInner />
    </Suspense>
  );
}
