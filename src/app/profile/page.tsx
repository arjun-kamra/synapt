export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Intervention, Session } from "@/types";
import SignOutButton from "@/components/SignOutButton";

type InterventionStats = {
  type: string;
  total: number;
  recovered: number;
  avgRecoverySeconds: number;
  rate: number;
};

function getInterventionStats(interventions: Intervention[]): InterventionStats[] {
  const map: Record<string, { total: number; recovered: number; totalSecs: number }> = {};

  for (const iv of interventions) {
    if (!map[iv.type]) map[iv.type] = { total: 0, recovered: 0, totalSecs: 0 };
    map[iv.type].total += 1;
    if (iv.recovered) {
      map[iv.type].recovered += 1;
      map[iv.type].totalSecs += iv.recovery_seconds ?? 0;
    }
  }

  return Object.entries(map).map(([type, stats]) => ({
    type,
    total: stats.total,
    recovered: stats.recovered,
    avgRecoverySeconds: stats.recovered > 0 ? Math.round(stats.totalSecs / stats.recovered) : 0,
    rate: stats.total > 0 ? Math.round((stats.recovered / stats.total) * 100) : 0,
  })).sort((a, b) => b.rate - a.rate);
}

const INTERVENTION_META: Record<string, { icon: string; label: string; color: string }> = {
  breathing: { icon: "🌬️", label: "Breathing", color: "#7c6af7" },
  posture:   { icon: "🪑", label: "Posture",   color: "#34d399" },
  visual:    { icon: "👁️", label: "Visual",    color: "#fbbf24" },
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: sessions }, { data: interventions }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("sessions").select("*").eq("user_id", user.id).eq("status", "completed").order("started_at", { ascending: false }),
    supabase.from("interventions").select("*").eq("user_id", user.id),
  ]);

  const ivStats = getInterventionStats(interventions ?? []);
  const bestIntervention = ivStats[0] ?? null;

  const completedSessions: Session[] = sessions ?? [];
  const totalDriftEvents = completedSessions.reduce((s, sess) => s + sess.drift_count, 0);
  const totalRecovered = (interventions ?? []).filter((iv: Intervention) => iv.recovered).length;
  const avgScore = completedSessions.length
    ? Math.round(completedSessions.reduce((s, sess) => s + sess.focus_score, 0) / completedSessions.length)
    : null;

  // Score trend (last 10 sessions)
  const trend = completedSessions.slice(0, 10).reverse();

  return (
    <main className="min-h-screen" style={{ background: "var(--background)" }}>
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="text-lg font-bold">
          Synapt
        </Link>
        <SignOutButton />
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Profile header */}
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: "var(--accent-glow)", border: "1px solid var(--accent)", color: "var(--accent)" }}>
            {(profile?.full_name ?? user.email ?? "?")[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile?.full_name ?? "Anonymous"}</h1>
            <p className="text-sm" style={{ color: "#8888aa" }}>{user.email}</p>
            <p className="text-xs mt-0.5" style={{ color: "#8888aa" }}>
              Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Sessions", value: completedSessions.length },
            { label: "Avg Score", value: avgScore ?? "—" },
            { label: "Drift Events", value: totalDriftEvents },
            { label: "Recoveries", value: totalRecovered },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl border text-center" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#8888aa" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Best intervention */}
        {bestIntervention && (
          <div className="p-6 rounded-2xl border space-y-3" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Best Reset Intervention
            </p>
            <div className="flex items-center gap-4">
              <div className="text-3xl">{INTERVENTION_META[bestIntervention.type]?.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{INTERVENTION_META[bestIntervention.type]?.label}</div>
                <div className="text-sm" style={{ color: "#8888aa" }}>
                  {bestIntervention.rate}% recovery rate · avg {bestIntervention.avgRecoverySeconds}s to recover
                </div>
              </div>
              <div className="text-2xl font-bold" style={{ color: INTERVENTION_META[bestIntervention.type]?.color }}>
                {bestIntervention.rate}%
              </div>
            </div>
          </div>
        )}

        {/* Intervention breakdown */}
        {ivStats.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Intervention Breakdown
            </h2>
            <div className="space-y-2">
              {ivStats.map((iv) => {
                const meta = INTERVENTION_META[iv.type];
                return (
                  <div key={iv.type} className="p-4 rounded-xl border flex items-center gap-4"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="text-2xl">{meta?.icon}</div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{meta?.label}</span>
                        <span style={{ color: "#8888aa" }}>{iv.recovered}/{iv.total} recovered</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full" style={{ background: "var(--surface-2)" }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{ width: `${iv.rate}%`, background: meta?.color }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-bold w-12 text-right" style={{ color: meta?.color }}>
                      {iv.rate}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Score trend */}
        {trend.length >= 2 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Focus Score Trend (last {trend.length} sessions)
            </h2>
            <div className="p-5 rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-end gap-2 h-20">
                {trend.map((sess, i) => {
                  const height = Math.max(8, (sess.focus_score / 100) * 80);
                  const color =
                    sess.focus_score >= 70 ? "var(--success)" :
                    sess.focus_score >= 40 ? "var(--warning)" : "var(--danger)";
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-sm transition-all" style={{ height, background: color, opacity: 0.85 }} />
                      <span className="text-xs" style={{ color: "#8888aa" }}>{sess.focus_score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* No data state */}
        {completedSessions.length === 0 && (
          <div className="py-16 text-center rounded-2xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-sm" style={{ color: "#8888aa" }}>Complete a few sessions to see your focus profile.</p>
            <Link href="/session" className="inline-block mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Start Session
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
