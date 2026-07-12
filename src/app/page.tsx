"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Eye, RotateCcw, Search, Lock, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-emerald-500" />
            <span className="text-xl font-bold">KeyGuard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-medium mb-6">
          <Lock className="h-3.5 w-3.5" />
          Developer-first API key security
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
          Your API keys,<br />
          <span className="text-emerald-500">secured & monitored</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
          Stop losing sleep over exposed keys. KeyGuard gives you a visual dashboard to manage, rotate, 
          and monitor every API key — with encryption, anomaly alerts, and one-click rotation.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              <Zap className="h-4 w-4" />
              Start Free
            </Button>
          </Link>
          <a href="https://github.com/verifydream/key-guards" target="_blank" rel="noopener">
            <Button size="lg" variant="outline">View on GitHub</Button>
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Encrypted Vault", desc: "AES-256-GCM encryption. Your keys are encrypted before touching the database." },
            { icon: Eye, title: "Health Monitor", desc: "Visual timeline with color-coded status. Know instantly which keys need rotation." },
            { icon: RotateCcw, title: "One-Click Rotation", desc: "Generate new keys with grace periods. Zero-downtime rotation workflow." },
            { icon: Search, title: "Git Scanner", desc: "Catch accidentally hardcoded keys before they hit your repository." },
            { icon: Zap, title: "Usage Analytics", desc: "Track every API call. Get anomaly alerts on unusual spikes or locations." },
            { icon: Lock, title: "Solo Dev Friendly", desc: "Setup in under 5 minutes. No enterprise complexity. Just security that works." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 rounded-xl border border-border/50 bg-card/50 hover:border-emerald-500/30 transition-colors">
              <Icon className="h-8 w-8 text-emerald-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>KeyGuard © 2026</span>
          <span>Built for developers who care about security</span>
        </div>
      </footer>
    </div>
  );
}
