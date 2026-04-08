"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useDriftDetector } from "@/lib/useDriftDetector";
import { useScreenCapture } from "@/lib/useScreenCapture";
import type { ScreenAnalysis } from "@/lib/useScreenCapture";
import InterventionModal from "@/components/InterventionModal";
import type { DriftEvent, InterventionType, TaskType, SessionSummary } from "@/types";

const INTERVENTION_TYPES: InterventionType[] = ["breathing", "posture", "visual"];
const TASK_TYPES: TaskType[] = ["Deep Work", "Writing", "Reading", "Learning", "Other"];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function scoreColor(score: number) {
  if (score >= 70) return "var(--success)";
  if (score >= 40) return "var(--warning)";
  return "var(--danger)";
}

// ── Post-session Summary Screen ───────────────────────────
function SummaryScreen({ summary, onContinue }: { summary: SessionSummary; onContinue: () => void }) {
  const sc = scoreColor(summary.focus_score);
  const INTERVENTION_META: Record<string, { icon: string; label: string }> = {
    breathing: { icon: "🌬️", label: "Breathing" },
    posture:   { icon: "🪑", label: "Posture" },
    visual:    { icon: "👁️", label: "Visual" },
  };

  const maxScore = Math.max(...summary.drift_timeline.map((p) => p.score), 1);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--background)" }}>
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-4xl mb-2">🎯</div>
          <h2 className="text-2xl font-bold">Session Complete</h2>
          <p className="text-sm" style={{ color: "#8888aa" }}>Here&apos;s how it went</p>
        </div>

        {/* Score hero */}
        <div className="p-6 rounded-2xl border text-center space-y-3"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#8888aa" }}>Focus Score</p>
          <div className="text-6xl font-bold" style={{ color: sc }}>{summary.focus_score}</div>
          <div className="w-full h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
            <div className="h-2 rounded-full transition-all" style={{ width: `${summary.focus_score}%`, background: sc }} />
          </div>
          <p className="text-xs" style={{ color: "#8888aa" }}>
            100 − {summary.drift_count}×10 + {summary.effective_recoveries}×3
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Duration", value: formatTime(summary.duration_seconds) },
            { label: "Drift Events", value: summary.drift_count.toString() },
            {
              label: "Fastest Recovery",
              value: summary.fastest_recovery_seconds != null
                ? `${summary.fastest_recovery_seconds}s`
                : "—",
            },
            {
              label: "Best Reset",
              value: summary.best_intervention_type
                ? `${INTERVENTION_META[summary.best_intervention_type].icon} ${INTERVENTION_META[summary.best_intervention_type].label}`
                : "—",
            },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-xl border text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="font-semibold text-base">{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: "#8888aa" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Focus timeline */}
        {summary.drift_timeline.length >= 2 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
              Focus over time
            </p>
            <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-end gap-1 h-16">
                {summary.drift_timeline.map((pt, i) => {
                  const height = Math.max(6, (pt.score / maxScore) * 64);
                  return (
                    <div key={i} className="flex-1 rounded-t-sm"
                      style={{ height, background: scoreColor(pt.score), opacity: 0.8 }} />
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
          style={{ background: "var(--accent)", color: "#fff" }}>
          View Dashboard →
        </button>
      </div>
    </div>
  );
}

// ── Main Session Page ─────────────────────────────────────
export default function SessionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "ended">("idle");
  const [taskType, setTaskType] = useState<TaskType>("Other");
  const [elapsed, setElapsed] = useState(0);
  const [focusScore, setFocusScore] = useState(100);
  const [driftCount, setDriftCount] = useState(0);
  const [effectiveRecoveries, setEffectiveRecoveries] = useState(0);
  const [currentIntervention, setCurrentIntervention] = useState<InterventionType | null>(null);
  const [currentDriftEvent, setCurrentDriftEvent] = useState<DriftEvent | null>(null);
  const [interventionId, setInterventionId] = useState<string | null>(null);
  const [interventionTriggeredAt, setInterventionTriggeredAt] = useState<number | null>(null);
  const [driftLog, setDriftLog] = useState<{ type: string; time: number; confidence: number }[]>([]);
  const [ending, setEnding] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [screenEnabled, setScreenEnabled] = useState(false);
  const [, setLastVisionResult] = useState<ScreenAnalysis | null>(null);

  // For summary timeline
  const scoreTimelineRef = useRef<{ elapsed: number; score: number }[]>([]);
  const firstDriftElapsedRef = useRef<number | null>(null);
  const interventionIndexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recoveryDataRef = useRef<{ type: InterventionType; seconds: number }[]>([]);
  const sessionIdRef = useRef<string | null>(null);

  // Keep sessionIdRef in sync
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // ── Vision drift handler ──────────────────────────────────
  const handleScreenAnalysis = useCallback((result: ScreenAnalysis) => {
    setLastVisionResult(result);
    if (!result.focused && result.confidence >= 0.7 && status === "running" && !currentIntervention) {
      // Fire a synthetic drift event via the same path as keyboard/idle drift
      handleDrift({
        type: "idle",
        timestamp: Date.now(),
        confidence: result.confidence,
        signals: { idle: result.confidence, tabSwitch: 0, typingSlowdown: 0 },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentIntervention]);

  const { status: screenStatus, lastAnalysis, startCapture, stopCapture } = useScreenCapture({
    active: status === "running" && screenEnabled,
    onAnalysis: handleScreenAnalysis,
  });

  // Timer
  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => {
        setElapsed((e) => {
          const next = e + 1;
          // Snapshot score every 30s for timeline
          if (next % 30 === 0) {
            setFocusScore((score) => {
              scoreTimelineRef.current.push({ elapsed: next, score });
              return score;
            });
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // ── Adaptive intervention picker ─────────────────────────
  const pickInterventionType = useCallback(async (): Promise<InterventionType> => {
    const idx = interventionIndexRef.current;
    interventionIndexRef.current += 1;

    // Round-robin for first 6
    if (idx < 6) return INTERVENTION_TYPES[idx % INTERVENTION_TYPES.length];

    // After 6: pick best by avg recovery time from DB
    const sid = sessionIdRef.current;
    if (!sid) return INTERVENTION_TYPES[idx % INTERVENTION_TYPES.length];

    const { data } = await supabase
      .from("interventions")
      .select("type, recovery_seconds")
      .eq("session_id", sid)
      .eq("recovered", true)
      .eq("false_positive_flag", false)
      .not("recovery_seconds", "is", null);

    if (!data || data.length < 3) return INTERVENTION_TYPES[idx % INTERVENTION_TYPES.length];

    const avgs: Record<string, { sum: number; count: number }> = {};
    for (const iv of data) {
      if (!avgs[iv.type]) avgs[iv.type] = { sum: 0, count: 0 };
      avgs[iv.type].sum += iv.recovery_seconds;
      avgs[iv.type].count += 1;
    }

    let best: InterventionType = INTERVENTION_TYPES[idx % INTERVENTION_TYPES.length];
    let bestAvg = Infinity;
    for (const [type, { sum, count }] of Object.entries(avgs)) {
      const avg = sum / count;
      if (avg < bestAvg) { bestAvg = avg; best = type as InterventionType; }
    }
    return best;
  }, [supabase]);

  // ── Drift handler ─────────────────────────────────────────
  const handleDrift = useCallback(async (event: DriftEvent) => {
    const sid = sessionIdRef.current;
    if (!sid || currentIntervention) return;

    const newDriftCount = driftCount + 1;
    const newScore = Math.max(0, focusScore - 10);
    setFocusScore(newScore);
    setDriftCount(newDriftCount);
    setDriftLog((prev) => [...prev, { type: event.type, time: event.timestamp, confidence: event.confidence }]);

    // Record time to first drift
    if (firstDriftElapsedRef.current === null) {
      firstDriftElapsedRef.current = elapsed;
    }

    // Update session score in DB
    await supabase
      .from("sessions")
      .update({ focus_score: newScore, drift_count: newDriftCount })
      .eq("id", sid);

    // Pick intervention type
    const iType = await pickInterventionType();

    // Insert intervention row
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("interventions")
      .insert({
        session_id: sid,
        type: iType,
        triggered_at: now,
        drift_confidence: event.confidence,
        drift_trigger: event.type,
        detection_version: "v2",
        false_positive_flag: false,
      })
      .select("id")
      .single();

    if (data) {
      setInterventionId(data.id);
      setInterventionTriggeredAt(Date.now());
    }
    setCurrentDriftEvent(event);
    setCurrentIntervention(iType);
  }, [sessionId, currentIntervention, focusScore, driftCount, elapsed, supabase, pickInterventionType]); // eslint-disable-line react-hooks/exhaustive-deps

  useDriftDetector({
    active: status === "running" && !currentIntervention,
    onDrift: handleDrift,
  });

  // ── Start session ─────────────────────────────────────────
  async function startSession() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    scoreTimelineRef.current = [{ elapsed: 0, score: 100 }];
    firstDriftElapsedRef.current = null;
    interventionIndexRef.current = 0;
    recoveryDataRef.current = [];

    const { data } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        started_at: new Date().toISOString(),
        focus_score: 100,
        drift_count: 0,
        status: "active",
        task_type: taskType,
        detection_version: "v2",
      })
      .select("id")
      .single();

    if (data) {
      setSessionId(data.id);
      sessionIdRef.current = data.id;
      setStatus("running");
      setElapsed(0);
      setFocusScore(100);
      setDriftCount(0);
      setEffectiveRecoveries(0);
      setDriftLog([]);
      setLastVisionResult(null);
      if (screenEnabled) startCapture();
    }
  }

  // ── False positive handler ────────────────────────────────
  async function handleFalsePositive() {
    if (!interventionId) return;

    await supabase
      .from("interventions")
      .update({ false_positive_flag: true, response_choice: "false_positive" })
      .eq("id", interventionId);

    // Undo the score/drift hit
    setFocusScore((prev) => Math.min(100, prev + 10));
    setDriftCount((prev) => Math.max(0, prev - 1));
    setDriftLog((prev) => prev.slice(0, -1));
    setCurrentIntervention(null);
    setInterventionId(null);
    setInterventionTriggeredAt(null);
    setCurrentDriftEvent(null);
  }

  // ── Intervention complete ─────────────────────────────────
  async function handleInterventionComplete(recovered: boolean) {
    if (!interventionId) { setCurrentIntervention(null); return; }

    const recoverySeconds = interventionTriggeredAt
      ? Math.round((Date.now() - interventionTriggeredAt) / 1000)
      : null;

    const responseChoice = recovered ? "ready" : "still_drifting";

    await supabase
      .from("interventions")
      .update({
        recovered,
        recovered_at: new Date().toISOString(),
        recovery_seconds: recoverySeconds,
        response_choice: responseChoice,
      })
      .eq("id", interventionId);

    if (recovered && recoverySeconds !== null) {
      const bonus = recoverySeconds <= 60 ? 3 : 0;
      if (bonus > 0) {
        const newScore = Math.min(100, focusScore + bonus);
        setFocusScore(newScore);
        setEffectiveRecoveries((prev) => prev + 1);
        await supabase.from("sessions").update({ focus_score: newScore }).eq("id", sessionId);
      }
      if (currentIntervention) {
        recoveryDataRef.current.push({ type: currentIntervention, seconds: recoverySeconds });
      }
    }

    setCurrentIntervention(null);
    setInterventionId(null);
    setInterventionTriggeredAt(null);
    setCurrentDriftEvent(null);
  }

  // ── End session ───────────────────────────────────────────
  async function endSession() {
    if (!sessionId) return;
    setEnding(true);
    setStatus("ended");
    stopCapture();

    const finalScore = Math.min(100, Math.max(0, 100 - driftCount * 10 + effectiveRecoveries * 3));
    const avgRecovery = recoveryDataRef.current.length > 0
      ? recoveryDataRef.current.reduce((s, r) => s + r.seconds, 0) / recoveryDataRef.current.length
      : null;

    await supabase
      .from("sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: elapsed,
        focus_score: finalScore,
        drift_count: driftCount,
        status: "completed",
        time_to_first_drift_seconds: firstDriftElapsedRef.current,
        avg_recovery_seconds: avgRecovery,
      })
      .eq("id", sessionId);

    // Build summary
    const recoveries = recoveryDataRef.current;
    const fastest = recoveries.length > 0 ? Math.min(...recoveries.map((r) => r.seconds)) : null;

    // Best intervention this session
    const typeAvgs: Record<string, { sum: number; count: number }> = {};
    for (const r of recoveries) {
      if (!typeAvgs[r.type]) typeAvgs[r.type] = { sum: 0, count: 0 };
      typeAvgs[r.type].sum += r.seconds;
      typeAvgs[r.type].count += 1;
    }
    let bestType: InterventionType | null = null;
    let bestAvg = Infinity;
    for (const [type, { sum, count }] of Object.entries(typeAvgs)) {
      const avg = sum / count;
      if (avg < bestAvg) { bestAvg = avg; bestType = type as InterventionType; }
    }

    // Final timeline snapshot
    const timeline = [...scoreTimelineRef.current, { elapsed, score: finalScore }];

    setSummary({
      duration_seconds: elapsed,
      focus_score: finalScore,
      drift_count: driftCount,
      effective_recoveries: effectiveRecoveries,
      fastest_recovery_seconds: fastest,
      best_intervention_type: bestType,
      drift_timeline: timeline,
    });
    setEnding(false);
  }

  const sc = scoreColor(focusScore);

  // ── Summary screen ────────────────────────────────────────
  if (summary) {
    return <SummaryScreen summary={summary} onContinue={() => router.push("/dashboard")} />;
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/dashboard" className="text-lg font-bold">
          Focus<span style={{ color: "var(--accent)" }}>Loop</span>
        </Link>
        {status === "running" && (
          <button
            onClick={endSession}
            disabled={ending}
            className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80"
            style={{ borderColor: "var(--border)", color: "#8888aa" }}>
            {ending ? "Saving…" : "End Session"}
          </button>
        )}
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 space-y-10">

        {/* ── IDLE STATE ── */}
        {status === "idle" && (
          <div className="text-center space-y-7 max-w-sm w-full">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Start a Focus Session</h2>
              <p className="text-sm" style={{ color: "#8888aa" }}>
                FocusLoop detects drift and resets you — silently, in the background.
              </p>
            </div>

            {/* Task type selector */}
            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
                What are you working on? <span style={{ color: "#55556a" }}>(optional)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TASK_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTaskType(t)}
                    className="py-2 px-2 rounded-lg text-xs font-medium border transition-all"
                    style={{
                      background: taskType === t ? "var(--accent-glow)" : "var(--surface)",
                      borderColor: taskType === t ? "var(--accent)" : "var(--border)",
                      color: taskType === t ? "var(--accent)" : "#8888aa",
                    }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen capture toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="text-left">
                <div className="text-sm font-medium">AI Screen Analysis</div>
                <div className="text-xs mt-0.5" style={{ color: "#8888aa" }}>
                  Claude analyzes your screen every 45s
                </div>
              </div>
              <button
                onClick={() => setScreenEnabled((v) => !v)}
                className="relative w-11 h-6 rounded-full transition-all"
                style={{ background: screenEnabled ? "var(--accent)" : "var(--surface-2)", border: "1px solid var(--border)" }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                  style={{
                    background: "#fff",
                    left: screenEnabled ? "calc(100% - 1.375rem)" : "0.125rem",
                  }} />
              </button>
            </div>

            {/* Detection signals */}
            <div className="grid grid-cols-3 gap-3 text-xs text-center">
              {[
                { icon: "💤", label: "Idle", sub: "30s no activity" },
                { icon: "🔁", label: "Tab switch", sub: "Leaves focus" },
                { icon: "⌨️", label: "Typing", sub: ">40% slowdown" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div className="font-medium" style={{ color: "var(--foreground)" }}>{item.label}</div>
                  <div style={{ color: "#8888aa" }}>{item.sub}</div>
                </div>
              ))}
            </div>

            <button
              onClick={startSession}
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 active:scale-95"
              style={{ background: "var(--accent)", color: "#fff" }}>
              Begin Session
            </button>
          </div>
        )}

        {/* ── RUNNING STATE ── */}
        {status === "running" && (
          <div className="w-full max-w-md space-y-8">
            {/* Timer */}
            <div className="text-center">
              <div className="text-7xl font-bold tabular-nums tracking-tight" style={{ color: "var(--foreground)" }}>
                {formatTime(elapsed)}
              </div>
              <p className="text-sm mt-2" style={{ color: "#8888aa" }}>
                {taskType !== "Other" ? taskType : "Focus session"} · stay in the zone
              </p>
            </div>

            {/* Focus score */}
            <div className="p-6 rounded-2xl border space-y-4"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: "#8888aa" }}>Focus Score</span>
                <span className="text-2xl font-bold" style={{ color: sc }}>{focusScore}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${focusScore}%`, background: sc }} />
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: "#8888aa" }}>
                <span>{driftCount} drift{driftCount !== 1 ? "s" : ""} · {effectiveRecoveries} fast recover{effectiveRecoveries !== 1 ? "ies" : "y"}</span>
                <span>−10 drift · +3 fast recovery</span>
              </div>
            </div>

            {/* Screen capture status */}
            {screenEnabled && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border text-xs"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: screenStatus === "active" ? "var(--success)"
                        : screenStatus === "denied" ? "var(--danger)"
                        : "var(--warning)",
                      boxShadow: screenStatus === "active" ? "0 0 6px var(--success)" : "none",
                    }} />
                  <span style={{ color: "#8888aa" }}>
                    {screenStatus === "active" ? "AI screen analysis active"
                      : screenStatus === "denied" ? "Screen access denied"
                      : "Starting screen analysis…"}
                  </span>
                </div>
                {lastAnalysis && (
                  <span style={{ color: lastAnalysis.focused ? "var(--success)" : "var(--warning)" }}>
                    {lastAnalysis.focused ? "✓ Focused" : `⚠ ${lastAnalysis.reason}`}
                  </span>
                )}
                {screenStatus === "idle" && (
                  <button onClick={startCapture} className="underline" style={{ color: "var(--accent)" }}>
                    Enable
                  </button>
                )}
              </div>
            )}

            {/* Drift log */}
            {driftLog.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "#8888aa" }}>Drift log</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {[...driftLog].reverse().map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                      style={{ background: "var(--surface)", color: "#8888aa" }}>
                      <span className="capitalize">{d.type.replace(/_/g, " ")}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "#55556a" }}>
                          {Math.round(d.confidence * 100)}% conf
                        </span>
                        <span>{new Date(d.time).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── INTERVENTION OVERLAY ── */}
      {currentIntervention && (
        <InterventionModal
          type={currentIntervention}
          driftEvent={currentDriftEvent}
          onComplete={handleInterventionComplete}
          onFalsePositive={handleFalsePositive}
        />
      )}
    </main>
  );
}
