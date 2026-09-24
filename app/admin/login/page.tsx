"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowRight, Sparkles, AlertCircle } from "lucide-react";
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
  const [loading, setLoading] = React.useState(false);

  const { data: session } = authClient.useSession();

  React.useEffect(() => {
    if (session?.user) {
      router.replace("/admin");
    }
  }, [session, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
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
                className="w-full bg-tomato-600 hover:bg-tomato-700 text-white font-semibold py-3 shadow-md"
              >
                <span>Masuk ke Back Office</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            {/* Quick Demo Credentials Helper */}
            <div className="pt-2 border-t border-charcoal-800">
              <button
                type="button"
                onClick={handleFillDemo}
                className="w-full py-2.5 px-3 rounded-lg bg-charcoal-950/80 hover:bg-charcoal-800 border border-charcoal-700/60 text-xs text-cream-300 flex items-center justify-center space-x-2 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Isi Kredensial Demo (admin@lunionpizza.com)</span>
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
