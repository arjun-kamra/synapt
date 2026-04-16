export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Session, Intervention } from "@/types";
import SignOutButton from "@/components/SignOutButton";
import InsightsCard from "@/components/InsightsCard";

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

function weeklyGrade(sessions: Session[]): { grade: string; color: string } | null {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = sessions.filter((s) => new Date(s.started_at).getTime() > cutoff);
  if (week.length === 0) return null;
  const avg = week.reduce((sum, s) => sum + s.focus_score, 0) / week.length;
  if (avg >= 85) return { grade: "A", color: "var(--success)" };
  if (avg >= 70) return { grade: "B", color: "var(--success)" };
  if (avg >= 55) return { grade: "C", color: "var(--warning)" };
  if (avg >= 40) return { grade: "D", color: "var(--warning)" };
  return { grade: "F", color: "var(--danger)" };
}

function recoveryStreak(sessions: Session[]): number {
  // Consecutive sessions (most recent first) where avg_recovery improved or was ≤45s
  let streak = 0;
  let prevRecovery: number | null = null;
  for (const s of sessions) {
    if (s.avg_recovery_seconds == null) break;
    if (prevRecovery === null || s.avg_recovery_seconds <= 45 || s.avg_recovery_seconds < prevRecovery) {
      streak += 1;
      prevRecovery = s.avg_recovery_seconds;
    } else {
      break;
    }
  }
  return streak;
}

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
      .limit(30),
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

  // ── Behavior change loop calculations ────────────────────

  // Before vs After: first 10 vs last 10
  const chronological = [...completed].reverse();
  const first10 = chronological.slice(0, 10);
  const last10 = chronological.slice(-10);
  const beforeAvgScore = first10.length >= 3
    ? Math.round(first10.reduce((s, x) => s + x.focus_score, 0) / first10.length)
    : null;
  const afterAvgScore = last10.length >= 3 && last10 !== first10
    ? Math.round(last10.reduce((s, x) => s + x.focus_score, 0) / last10.length)
    : null;
  const beforeAvgRecovery = first10.filter((s: Session) => s.avg_recovery_seconds != null).length >= 2
    ? Math.round(first10.filter((s: Session) => s.avg_recovery_seconds != null)
        .reduce((sum: number, s: Session) => sum + (s.avg_recovery_seconds ?? 0), 0) /
        first10.filter((s: Session) => s.avg_recovery_seconds != null).length)
    : null;
  const afterAvgRecovery = last10.filter((s: Session) => s.avg_recovery_seconds != null).length >= 2
    ? Math.round(last10.filter((s: Session) => s.avg_recovery_seconds != null)
        .reduce((sum: number, s: Session) => sum + (s.avg_recovery_seconds ?? 0), 0) /
        last10.filter((s: Session) => s.avg_recovery_seconds != null).length)
    : null;

  const showBeforeAfter = beforeAvgScore !== null && afterAvgScore !== null && completed.length >= 6;
  const scoreDelta = showBeforeAfter ? afterAvgScore! - beforeAvgScore! : 0;
  const recoveryDelta = beforeAvgRecovery != null && afterAvgRecovery != null
    ? afterAvgRecovery - beforeAvgRecovery
    : null;

  // Recovery streak
  const streak = recoveryStreak(completed);

  // Weekly grade
  const grade = weeklyGrade(completed);

  // Weekly trend sparkline (last 7 sessions)
  const weekSessions = completed.slice(0, 7).reverse();

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/" className="text-lg font-bold" style={{ textDecoration: "none", color: "var(--foreground)" }}>Synapt</Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm" style={{ color: "#8888aa" }}>Home</Link>
          <Link href="/research" className="text-sm" style={{ color: "#8888aa" }}>Research</Link>
          <Link href="/profile" className="text-sm" style={{ color: "#8888aa" }}>Profile</Link>
          <Link href="/download" className="text-sm font-semibold px-4 py-1.5 rounded-lg"
            style={{ background: "var(--accent)", color: "#1a0e00", textDecoration: "none" }}>
            Download Extension
          </Link>
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

        {/* Extension banner */}
        <div className="flex items-center justify-between px-6 py-5 rounded-2xl border"
          style={{ background: "var(--accent-glow)", borderColor: "var(--accent)" }}>
          <div>
            <div className="font-semibold">Start focusing with the Synapt extension</div>
            <div className="text-sm mt-0.5" style={{ color: "#8888aa" }}>
              Your session data will appear here automatically after each session.
            </div>
          </div>
          <Link href="/download"
            className="text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
            style={{ background: "var(--accent)", color: "#1a0e00", textDecoration: "none" }}>
            Download Extension
          </Link>
        </div>

        {/* ── Behavior Change Loop ── */}
        {completed.length >= 3 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Progress
            </h2>
            <div className="grid grid-cols-3 gap-3">

              {/* Weekly grade */}
              {grade && (
                <div className="p-4 rounded-2xl border text-center space-y-1"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "#8888aa" }}>This week</p>
                  <div className="text-3xl font-bold" style={{ color: grade.color }}>{grade.grade}</div>
                  <div className="flex items-end justify-center gap-0.5 h-6 mt-1">
                    {weekSessions.map((s, i) => {
                      const h = Math.max(3, (s.focus_score / 100) * 24);
                      return (
                        <div key={i} className="flex-1 rounded-t-sm"
                          style={{ height: h, background: scoreColor(s.focus_score), opacity: 0.8 }} />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recovery streak */}
              {streak >= 2 && (
                <div className="p-4 rounded-2xl border text-center space-y-1"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "#8888aa" }}>Recovery streak</p>
                  <div className="text-3xl font-bold" style={{ color: "var(--accent)" }}>{streak}</div>
                  <p className="text-xs" style={{ color: "#55556a" }}>sessions improving</p>
                </div>
              )}

              {/* Before vs After score delta */}
              {showBeforeAfter && (
                <div className="p-4 rounded-2xl border text-center space-y-1"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <p className="text-xs" style={{ color: "#8888aa" }}>Score trend</p>
                  <div className="text-3xl font-bold"
                    style={{ color: scoreDelta >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {scoreDelta >= 0 ? "+" : ""}{scoreDelta}
                  </div>
                  <p className="text-xs" style={{ color: "#55556a" }}>first vs recent</p>
                </div>
              )}
            </div>

            {/* Before vs After detail panel */}
            {showBeforeAfter && (
              <div className="p-5 rounded-2xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#8888aa" }}>
                  Before vs After
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs" style={{ color: "#55556a" }}>First {first10.length} sessions</p>
                    <div className="text-xl font-bold"
                      style={{ color: scoreColor(beforeAvgScore!) }}>{beforeAvgScore}</div>
                    <p className="text-xs" style={{ color: "#55556a" }}>avg focus score</p>
                    {beforeAvgRecovery && (
                      <p className="text-xs" style={{ color: "#55556a" }}>{beforeAvgRecovery}s avg recovery</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs" style={{ color: "#55556a" }}>Last {last10.length} sessions</p>
                    <div className="text-xl font-bold"
                      style={{ color: scoreColor(afterAvgScore!) }}>{afterAvgScore}</div>
                    <p className="text-xs" style={{ color: "#55556a" }}>avg focus score</p>
                    {afterAvgRecovery && (
                      <p className="text-xs"
                        style={{ color: recoveryDelta !== null && recoveryDelta < 0 ? "var(--success)" : "#55556a" }}>
                        {afterAvgRecovery}s avg recovery
                        {recoveryDelta !== null && recoveryDelta < 0 && ` (${Math.abs(recoveryDelta)}s faster)`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── AI Pattern Detection (client component) ── */}
        <InsightsCard
          sessions={completed}
          interventions={(interventions ?? []) as Intervention[]}
        />

        {/* Session history */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
            Session History
          </h2>

          {completed.length === 0 ? (
            <div className="py-12 text-center rounded-2xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <p className="text-sm" style={{ color: "#8888aa" }}>No sessions yet. Install the extension to get started.</p>
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
