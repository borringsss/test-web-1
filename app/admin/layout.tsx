"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  Layers,
  Clock,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Bell,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LUnionStore } from "@/lib/store";
import { useSession, signOut } from "@/lib/auth-client";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Reservations", href: "/admin/reservations", icon: CalendarDays },
  { label: "Menu Management", href: "/admin/menu", icon: UtensilsCrossed },
  { label: "Table Management", href: "/admin/tables", icon: Layers },
  { label: "Schedule & Overrides", href: "/admin/schedule", icon: Clock },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [pendingCount, setPendingCount] = React.useState(0);

  // Better Auth Session Hook
  const { data: session, isPending } = useSession();

  // Route protection
  React.useEffect(() => {
    if (pathname === "/admin/login") return;

    if (!isPending) {
      if (!session || !session.user) {
        if (!LUnionStore.isAdminLoggedIn()) {
          router.replace("/admin/login");
        }
      }
    }
  }, [session, isPending, pathname, router]);

  // Sync pending reservations count from API
  const syncPendingCount = React.useCallback(async () => {
    try {
      const data = await apiClient.admin.getDashboard();
      if (data && data.metrics) {
        setPendingCount(data.metrics.pending || 0);
        return;
      }
    } catch {
      // fallback
    }
    const pending = LUnionStore.getReservations().filter(
      (r) => r.status === "PENDING"
    ).length;
    setPendingCount(pending);
  }, []);

  React.useEffect(() => {
    if (pathname === "/admin/login") return;
    syncPendingCount();
    window.addEventListener("lunion_store_updated", syncPendingCount);
    return () => window.removeEventListener("lunion_store_updated", syncPendingCount);
  }, [syncPendingCount, pathname]);

  // If on login page, render without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    try {
      await signOut();
    } catch {}
    LUnionStore.setAdminLoggedIn(false);
    router.push("/admin/login");
  };

  const handleResetData = () => {
    if (confirm("Reset semua data (reservasi, menu, meja, jadwal) ke nilai awal prototype?")) {
      LUnionStore.resetAllData();
      alert("Data berhasil direset ke nilai awal prototype.");
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col md:flex-row">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col bg-charcoal-950 text-cream-100 border-r border-charcoal-800 shrink-0 min-h-screen">
        {/* Brand */}
        <div className="p-6 border-b border-charcoal-800/80">
          <Link href="/admin" className="block">
            <span className="font-serif text-xl font-bold tracking-wider text-cream-50">
              L'UNION PIZZA
            </span>
            <div className="flex items-center space-x-1.5 mt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-tomato-500" />
              <span className="text-[10px] tracking-widest text-cream-400 uppercase font-sans font-semibold">
                Back Office System
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5">
          {ADMIN_NAV.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-tomato-600 text-white font-semibold shadow-sm"
                    : "text-cream-300 hover:bg-charcoal-900 hover:text-white"
                )}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.label === "Reservations" && pendingCount > 0 && (
                  <Badge className="bg-amber-500 text-charcoal-950 text-[10px] font-bold px-1.5 py-0.5">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-charcoal-800/80 space-y-2">
          {session?.user && (
            <div className="px-3 py-2 bg-charcoal-900 rounded-lg text-xs space-y-0.5 border border-charcoal-800/80">
              <p className="font-semibold text-cream-100 truncate">{session.user.name}</p>
              <p className="text-[10px] text-cream-400 truncate">{session.user.email}</p>
            </div>
          )}

          <button
            onClick={handleResetData}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-cream-400 hover:text-cream-100 hover:bg-charcoal-900 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-cream-300 hover:text-white hover:bg-charcoal-900 transition-colors"
          >
            <span className="flex items-center space-x-2">
              <ExternalLink className="w-3.5 h-3.5 text-tomato-400" />
              <span>Customer Website</span>
            </span>
            <span className="text-[10px] bg-charcoal-800 text-cream-400 px-1.5 py-0.5 rounded">Live</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MOBILE TOPBAR */}
      <header className="md:hidden bg-charcoal-950 text-cream-50 p-4 border-b border-charcoal-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-cream-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-serif font-bold text-lg">L'Union Back Office</span>
        </div>

        <div className="flex items-center space-x-2">
          {pendingCount > 0 && (
            <Badge className="bg-amber-500 text-charcoal-950 text-xs font-bold">
              {pendingCount} Pending
            </Badge>
          )}
          <Link href="/">
            <Button size="sm" variant="ghost" className="text-xs text-cream-300 p-1.5 h-8">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-charcoal-900 text-cream-100 p-4 border-b border-charcoal-800 space-y-2">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-lg text-sm text-cream-200 hover:bg-charcoal-800"
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.label === "Reservations" && pendingCount > 0 && (
                <Badge className="bg-amber-500 text-charcoal-950 text-[10px] font-bold">
                  {pendingCount}
                </Badge>
              )}
            </Link>
          ))}
          <div className="pt-2 border-t border-charcoal-800 flex justify-between text-xs">
            <button onClick={handleResetData} className="text-cream-400 p-1">
              Reset Data
            </button>
            <button onClick={handleLogout} className="text-red-400 p-1">
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
