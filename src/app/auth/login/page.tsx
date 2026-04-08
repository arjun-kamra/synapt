"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import OAuthButtons from "@/components/OAuthButtons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">
            Focus<span style={{ color: "var(--accent)" }}>Loop</span>
          </h1>
          <p className="text-sm" style={{ color: "#8888aa" }}>Welcome back</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 p-6 rounded-2xl border border-subtle"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border border-subtle focus:border-accent transition-colors"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border border-subtle focus:border-accent transition-colors"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#fff" }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <OAuthButtons />

        <p className="text-center text-sm" style={{ color: "#8888aa" }}>
          No account?{" "}
          <Link href="/auth/signup" className="font-medium" style={{ color: "var(--accent)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
