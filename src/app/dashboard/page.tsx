import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Session, Intervention } from "@/types";
import SignOutButton from "@/components/SignOutButton";

function formatDuration(seconds: number | null) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m${s > 0 ? ` ${s}s` : ""}`;
}

function scoreColor(score: number) {
  if (score >= 70) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--danger)";
}

const INTERVENTION_META: Record<string, { icon: string; label: string }> = {
  breathing: { icon: "🌬️", label: "Breathing" },
  posture:   { icon: "🪑", label: "Posture" },
  visual:    { icon: "👁️", label: "Visual" },
};

const TRIGGER_META: Record<string, { icon: string; label: string }> = {
  idle:             { icon: "💤", label: "Idle" },
  tab_switch:       { icon: "🔁", label: "Tab switch" },
  typing_slowdown:  { icon: "⌨️", label: "Typing slowdown" },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: sessions }, { data: profile }, { data: interventions }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(20),
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("interventions")
      .select("*")
      .eq("user_id", user.id)
      .eq("false_positive_flag", false)
      .not("recovery_seconds", "is", null),
  ]);

  const completed = (sessions ?? []).filter((s: Session) => s.status === "completed");
  const avgScore = completed.length
    ? Math.round(completed.reduce((sum: number, s: Session) => sum + s.focus_score, 0) / completed.length)
    : null;
  const totalSecs = completed.reduce((sum: number, s: Session) => sum + (s.duration_seconds ?? 0), 0);
  const totalMinsLabel = totalSecs >= 3600
    ? `${Math.floor(totalSecs / 3600)}h ${Math.floor((totalSecs % 3600) / 60)}m`
    : `${Math.floor(totalSecs / 60)}m`;

  // ── Insights calculations ────────────────────────────────

  // Most common drift trigger
  const triggerCounts: Record<string, number> = {};
  for (const iv of (interventions ?? []) as Intervention[]) {
    if (iv.drift_trigger) {
      triggerCounts[iv.drift_trigger] = (triggerCounts[iv.drift_trigger] ?? 0) + 1;
    }
  }
  const topTrigger = Object.entries(triggerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Most effective reset type (lowest avg recovery_seconds)
  const recoveryByType: Record<string, { sum: number; count: number }> = {};
  for (const iv of (interventions ?? []) as Intervention[]) {
    if (iv.recovered && iv.recovery_seconds != null) {
      if (!recoveryByType[iv.type]) recoveryByType[iv.type] = { sum: 0, count: 0 };
      recoveryByType[iv.type].sum += iv.recovery_seconds;
      recoveryByType[iv.type].count += 1;
    }
  }
  let bestResetType: string | null = null;
  let bestResetAvg: number | null = null;
  for (const [type, { sum, count }] of Object.entries(recoveryByType)) {
    const avg = sum / count;
    if (bestResetAvg === null || avg < bestResetAvg) {
      bestResetAvg = avg;
      bestResetType = type;
    }
  }

  // Average time to first drift
  const firstDriftSessions = completed.filter((s: Session) => s.time_to_first_drift_seconds != null);
  const avgTimeToFirstDrift = firstDriftSessions.length
    ? Math.round(
        firstDriftSessions.reduce((sum: number, s: Session) => sum + (s.time_to_first_drift_seconds ?? 0), 0) /
        firstDriftSessions.length
      )
    : null;

  // Recovery latency trend — last 7 sessions with avg_recovery_seconds
  const last7 = completed
    .filter((s: Session) => s.avg_recovery_seconds != null)
    .slice(0, 7)
    .reverse();

  const showInsights = topTrigger || bestResetType || avgTimeToFirstDrift !== null || last7.length >= 2;

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-lg font-bold">
          Focus<span style={{ color: "var(--accent)" }}>Loop</span>
        </span>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm" style={{ color: "#8888aa" }}>Profile</Link>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Greeting */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {profile?.full_name ? `Hey, ${profile.full_name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-sm" style={{ color: "#8888aa" }}>Here&apos;s how your focus has been going.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Sessions", value: completed.length.toString() },
            { label: "Avg Score", value: avgScore !== null ? `${avgScore}` : "—" },
            { label: "Total Focus", value: totalSecs > 0 ? totalMinsLabel : "—" },
          ].map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl border text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs mt-1" style={{ color: "#8888aa" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Start session CTA */}
        <Link
          href="/session"
          className="flex items-center justify-between px-6 py-5 rounded-2xl border transition-all hover:opacity-90"
          style={{ background: "var(--accent-glow)", borderColor: "var(--accent)" }}>
          <div>
            <div className="font-semibold">Start a Focus Session</div>
            <div className="text-sm mt-0.5" style={{ color: "#8888aa" }}>
              Confidence-weighted drift detection · adaptive resets
            </div>
          </div>
          <div className="text-2xl">→</div>
        </Link>

        {/* ── Insights ── */}
        {showInsights && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Insights
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Most common trigger */}
              {topTrigger && TRIGGER_META[topTrigger] && (
                <div className="p-4 rounded-2xl border space-y-1"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "#8888aa" }}>Most common drift</p>
                  <p className="font-semibold text-base">
                    {TRIGGER_META[topTrigger].icon} {TRIGGER_META[topTrigger].label}
                  </p>
                  <p className="text-xs" style={{ color: "#55556a" }}>
                    {triggerCounts[topTrigger]} event{triggerCounts[topTrigger] !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {/* Best reset type */}
              {bestResetType && INTERVENTION_META[bestResetType] && (
                <div className="p-4 rounded-2xl border space-y-1"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "#8888aa" }}>Most effective reset</p>
                  <p className="font-semibold text-base">
                    {INTERVENTION_META[bestResetType].icon} {INTERVENTION_META[bestResetType].label}
                  </p>
                  <p className="text-xs" style={{ color: "#55556a" }}>
                    avg {Math.round(bestResetAvg!)}s recovery
                  </p>
                </div>
              )}

              {/* Avg time to first drift */}
              {avgTimeToFirstDrift !== null && (
                <div className="p-4 rounded-2xl border space-y-1"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "#8888aa" }}>Avg time to first drift</p>
                  <p className="font-semibold text-base">{formatDuration(avgTimeToFirstDrift)}</p>
                  <p className="text-xs" style={{ color: "#55556a" }}>across {firstDriftSessions.length} sessions</p>
                </div>
              )}

              {/* Recovery trend */}
              {last7.length >= 2 && (
                <div className="p-4 rounded-2xl border space-y-2"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "#8888aa" }}>Recovery latency trend</p>
                  <div className="flex items-end gap-1 h-10">
                    {last7.map((s: Session, i: number) => {
                      const val = s.avg_recovery_seconds ?? 0;
                      const max = Math.max(...last7.map((x: Session) => x.avg_recovery_seconds ?? 0), 1);
                      const height = Math.max(4, (val / max) * 40);
                      // Lower is better — color inversely
                      const ratio = val / max;
                      const color = ratio < 0.4 ? "var(--success)" : ratio < 0.7 ? "var(--warning)" : "var(--danger)";
                      return (
                        <div key={i} className="flex-1 rounded-t-sm"
                          style={{ height, background: color, opacity: 0.85 }} />
                      );
                    })}
                  </div>
                  <p className="text-xs" style={{ color: "#55556a" }}>
                    {(() => {
                      const first = last7[0].avg_recovery_seconds ?? 0;
                      const last = last7[last7.length - 1].avg_recovery_seconds ?? 0;
                      if (last < first) return "↓ Getting faster";
                      if (last > first) return "↑ Taking longer";
                      return "→ Stable";
                    })()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Session history */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
            Session History
          </h2>

          {completed.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "#8888aa" }}>No sessions yet. Start one above!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {completed.map((session: Session) => (
                <div key={session.id}
                  className="flex items-center justify-between px-5 py-4 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">
                      {new Date(session.started_at).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric",
                      })}
                      <span className="ml-2 text-xs" style={{ color: "#8888aa" }}>
                        {new Date(session.started_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      {session.task_type && session.task_type !== "Other" && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--surface-2)", color: "#8888aa" }}>
                          {session.task_type}
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: "#8888aa" }}>
                      {formatDuration(session.duration_seconds)} · {session.drift_count} drift{session.drift_count !== 1 ? "s" : ""}
                      {session.avg_recovery_seconds != null && (
                        <> · avg {Math.round(session.avg_recovery_seconds)}s recovery</>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-bold" style={{ color: scoreColor(session.focus_score) }}>
                        {session.focus_score}
                      </div>
                      <div className="text-xs" style={{ color: "#8888aa" }}>score</div>
                    </div>
                    <div className="w-2 h-2 rounded-full" style={{ background: scoreColor(session.focus_score) }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
