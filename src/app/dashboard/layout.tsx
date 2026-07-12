"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Key, RotateCcw, Search, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard#keys", label: "Key Vault", icon: Key },
  { href: "/dashboard/rotate", label: "Rotation", icon: RotateCcw },
  { href: "/dashboard#scanner", label: "Git Scanner", icon: Search },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "w-64 border-r border-border/50 flex flex-col transition-all duration-200",
        !sidebarOpen && "w-16"
      )}>
        <div className="h-16 flex items-center gap-2 px-4 border-b border-border/50">
          <Shield className="h-5 w-5 text-emerald-500 shrink-0" />
          {sidebarOpen && <span className="font-bold">KeyGuard</span>}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && "Log out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <header className="h-16 border-b border-border/50 flex items-center px-6 justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
