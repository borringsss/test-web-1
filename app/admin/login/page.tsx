"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LUnionStore } from "@/lib/store";
import { authClient } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  const { data: session } = authClient.useSession();

  React.useEffect(() => {
    if (session?.user) {
      router.replace("/admin");
    }
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await authClient.signIn.email({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (res.error) {
        console.error("Login error from Better Auth:", res.error);

        // Auto-sync fallback for default demo admin
        if (cleanEmail === "admin@lunionpizza.com") {
          try {
            const syncRes = await fetch("/api/admin/setup");
            const syncData = await syncRes.json();
            if (syncData.success) {
              const retryRes = await authClient.signIn.email({
                email: cleanEmail,
                password: cleanPassword,
              });
              if (!retryRes.error) {
                LUnionStore.setAdminLoggedIn(true);
                router.push("/admin");
                return;
              }
            }
          } catch (syncErr) {
            console.error("Auto-sync failed:", syncErr);
          }
        }

        setError(res.error.message || "Email atau password salah.");
        setLoading(false);
        return;
      }

      LUnionStore.setAdminLoggedIn(true);
      router.push("/admin");
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat masuk.");
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@lunionpizza.com");
    setPassword("admin123");
    setError("");
  };

  const handleSyncAdmin = async () => {
    setSyncing(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/setup");
      const data = await res.json();
      if (data.success) {
        setEmail("admin@lunionpizza.com");
        setPassword("admin123");
        setSuccessMsg("Akun admin berhasil disinkronkan! Silakan klik 'Masuk ke Back Office'.");
      } else {
        setError(data.error || data.details || "Gagal menyinkronkan akun admin.");
      }
    } catch (err: any) {
      setError(err?.message || "Gagal menghubungi server.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-tomato-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-olive-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block">
            <span className="font-serif text-3xl font-bold tracking-wider text-cream-50">
              L'UNION PIZZA
            </span>
          </Link>
          <div className="flex items-center justify-center space-x-1.5 text-xs text-tomato-400 font-semibold uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>Back Office Portal</span>
          </div>
        </div>

        <Card className="bg-charcoal-900 border-charcoal-800 text-cream-50 shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-cream-50">Admin Sign In</CardTitle>
            <CardDescription className="text-xs text-cream-400">
              Masuk untuk mengelola reservasi, menu, meja, dan jadwal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-cream-300 font-medium">Email / Username</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
                  <Input
                    type="email"
                    placeholder="admin@lunionpizza.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-charcoal-950 border-charcoal-700 text-cream-50 placeholder:text-charcoal-500 focus-visible:ring-tomato-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-cream-300 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-charcoal-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-charcoal-950 border-charcoal-700 text-cream-50 placeholder:text-charcoal-500 focus-visible:ring-tomato-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-tomato-600 hover:bg-tomato-700 text-white font-semibold py-3 shadow-md disabled:opacity-70"
              >
                <span>{loading ? "Memproses Masuk..." : "Masuk ke Back Office"}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Quick Demo Credentials Helper & Reset */}
            <div className="pt-2 border-t border-charcoal-800 space-y-2">
              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full py-2.5 px-3 rounded-lg bg-charcoal-950/80 hover:bg-charcoal-800 border border-charcoal-700/60 text-xs text-cream-300 flex items-center justify-center space-x-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Isi Kredensial Demo (admin@lunionpizza.com)</span>
              </button>

              <button
                type="button"
                onClick={handleSyncAdmin}
                disabled={syncing}
                className="w-full py-2 px-3 rounded-lg hover:bg-charcoal-800/50 text-[11px] text-cream-400 hover:text-cream-200 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin text-tomato-400" : "text-charcoal-400"}`} />
                <span>{syncing ? "Menyinkronkan Akun Admin..." : "Sinkronisasi / Reset Akun Admin"}</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-xs text-cream-400 hover:text-cream-100 transition-colors">
            ← Kembali ke Website Customer
          </Link>
        </div>
      </div>
    </div>
  );
}
