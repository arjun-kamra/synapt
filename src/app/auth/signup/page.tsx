"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import OAuthButtons from "@/components/OAuthButtons";

const SynaptLogo = () => (
  <svg width="22" height="22" viewBox="0 0 26 26" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <circle cx="13" cy="13" r="3.5" fill="#EF9F27" />
    <circle cx="13" cy="13" r="7.5" stroke="#EF9F27" strokeWidth="0.75" strokeDasharray="2.5 2" fill="none" opacity="0.45" />
    <circle cx="13" cy="13" r="11.5" stroke="#EF9F27" strokeWidth="0.5" strokeDasharray="1.5 3" fill="none" opacity="0.2" />
    <circle cx="13" cy="4.5" r="1.5" fill="#FAC775" />
    <circle cx="21.5" cy="18" r="1.5" fill="#FAC775" />
    <circle cx="4.5" cy="18" r="1.5" fill="#FAC775" />
  </svg>
);

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

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
          <h1 className="text-2xl font-bold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <SynaptLogo />
            <span style={{ color: "var(--foreground)" }}>Synapt</span>
          </h1>
          <p className="text-sm" style={{ color: "#8888aa" }}>Create your account</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 p-6 rounded-2xl border border-subtle"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border transition-colors"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

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
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border transition-colors"
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
              placeholder="Min 6 characters"
              minLength={6}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none border transition-colors"
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
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <OAuthButtons />

        <p className="text-center text-sm" style={{ color: "#8888aa" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="font-medium" style={{ color: "var(--accent)" }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
