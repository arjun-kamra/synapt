import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-subtle text-accent mb-4"
            style={{ borderColor: "var(--border)", color: "var(--accent)", background: "var(--accent-glow)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse" style={{ background: "var(--accent)" }} />
            Cognitive Productivity
          </div>
          <h1 className="text-5xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
            Focus<span style={{ color: "var(--accent)" }}>Loop</span>
          </h1>
          <p className="text-lg mt-4" style={{ color: "#8888aa" }}>
            Detects when you drift. Resets you in seconds. Tracks what works.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          {[
            { icon: "⚡", label: "Drift Detection", desc: "Idle, tab switches, typing slowdown" },
            { icon: "🧠", label: "Reset Interventions", desc: "Breathing, posture, visual reset" },
            { icon: "📊", label: "Focus Score", desc: "Tracks recovery after each event" },
          ].map((f) => (
            <div key={f.label} className="p-4 rounded-xl border border-subtle text-left space-y-1"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-xl">{f.icon}</div>
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>{f.label}</div>
              <div style={{ color: "#8888aa" }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/auth/signup"
            className="px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--accent)", color: "#fff" }}>
            Get Started
          </Link>
          <Link href="/auth/login"
            className="px-6 py-3 rounded-xl font-semibold text-sm border border-subtle transition-all hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface)" }}>
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
