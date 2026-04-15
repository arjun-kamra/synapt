"use client";

import { useEffect, useState } from "react";
import type { SessionSummary } from "@/types";

interface Props {
  summary: SessionSummary;
}

export default function SessionAISummary({ summary }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Build trigger breakdown from drift events
    const triggerBreakdown: Record<string, number> = {};
    for (const ev of summary.drift_events) {
      triggerBreakdown[ev.type] = (triggerBreakdown[ev.type] ?? 0) + 1;
    }

    // Build intervention performance
    const interventionPerf: Record<string, { count: number; avgRecovery: number }> = {};
    for (const ev of summary.drift_events) {
      if (ev.intervention_type && ev.recovery_seconds != null) {
        if (!interventionPerf[ev.intervention_type]) {
          interventionPerf[ev.intervention_type] = { count: 0, avgRecovery: 0 };
        }
        interventionPerf[ev.intervention_type].count += 1;
        interventionPerf[ev.intervention_type].avgRecovery += ev.recovery_seconds;
      }
    }
    for (const k in interventionPerf) {
      interventionPerf[k].avgRecovery = Math.round(
        interventionPerf[k].avgRecovery / interventionPerf[k].count
      );
    }

    fetch("/api/session-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driftCount: summary.drift_count,
        durationSeconds: summary.duration_seconds,
        triggerBreakdown,
        interventionPerformance: interventionPerf,
        focusScore: summary.focus_score,
        effectiveRecoveries: summary.effective_recoveries,
      }),
    })
      .then((r) => r.json())
      .then(({ summary: s }) => {
        setText(s ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="space-y-2">
        {[90, 75].map((w, i) => (
          <div
            key={i}
            className="h-3 rounded-full animate-pulse"
            style={{ width: `${w}%`, background: "var(--surface-2)" }}
          />
        ))}
      </div>
    );
  }

  if (!text) return null;

  return (
    <p className="text-sm leading-relaxed" style={{ color: "#8888aa" }}>
      {text}
    </p>
  );
}
