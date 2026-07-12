"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Shield } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.user) setUser(d.user);
      setLoading(false);
    });
  }, []);

  async function exportKeys() {
    const res = await fetch("/api/keys");
    const data = await res.json();
    const exportData = (data.keys || []).map((k: Record<string, unknown>) => ({
      serviceName: k.serviceName,
      environment: k.environment,
      keyAlias: k.keyAlias,
      status: k.status,
      lastRotatedAt: k.lastRotatedAt,
      expiryDays: k.expiryDays,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keyguard-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Profile</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={user?.name || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
          </p>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Data Management</CardTitle>
          <CardDescription>Export or manage your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={exportKeys} className="gap-2">
            <Download className="h-4 w-4" /> Export Keys (metadata only)
          </Button>
          <p className="text-xs text-muted-foreground">
            Exports key metadata (names, environments, status). Actual key values are never exported for security.
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Security</CardTitle>
          <CardDescription>Manage your session</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleLogout} className="gap-2">
            <Shield className="h-4 w-4" /> Log out
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Ends your current session. Other sessions on different devices remain active.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
