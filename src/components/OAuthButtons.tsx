"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function OAuthButtons() {
  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);

  async function signInWith(provider: "google" | "apple") {
    setLoadingProvider(provider);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // Page will redirect — no need to reset state
  }

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-xs" style={{ color: "#8888aa" }}>or continue with</span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      {/* Google */}
      <button
        onClick={() => signInWith("google")}
        disabled={!!loadingProvider}
        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80 disabled:opacity-50"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        {loadingProvider === "google" ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
        )}
        {loadingProvider === "google" ? "Redirecting…" : "Continue with Google"}
      </button>

      {/* Apple */}
      <button
        onClick={() => signInWith("apple")}
        disabled={!!loadingProvider}
        className="w-full flex items-center justify-center gap-3 py-2.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80 disabled:opacity-50"
        style={{ background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--foreground)" }}>
        {loadingProvider === "apple" ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 376.9 0 230.3 0 189.7 0 66.4 64.2 1.1 200.7 1.1c62.9 0 116.6 39.5 156.5 39.5 38.3 0 98.7-41.4 167.6-41.4 45.2 0 161.5 16.4 231.4 125.4zm-178.6-71.1c-28.6-35.5-69.3-61.5-109.2-61.5-4.9 0-9.8.6-14.7 1.7 2.3-20.4 13.4-49.5 33-75.1 23.7-31 65.2-57.2 103.7-57.2 3.2 0 6.4.3 9.6.6-2.6 22.7-12.8 51.4-22.4 72.5z"/>
          </svg>
        )}
        {loadingProvider === "apple" ? "Redirecting…" : "Continue with Apple"}
      </button>
    </div>
  );
}
