"use client";

import { useEffect, useState } from "react";
import type { Session, Intervention } from "@/types";

interface Props {
  sessions: Session[];
  interventions: Intervention[];
}

export default function InsightsCard({ sessions, interventions }: Props) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessions.length < 3) {
      setLoading(false);
      return;
    }

    fetch("/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessions, interventions }),
    })
      .then((r) => r.json())
      .then(({ insights }) => {
        setInsights(insights ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (sessions.length < 3) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
        Pattern Detection
      </h2>
      <div
        className="p-5 rounded-2xl border space-y-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {loading ? (
          <div className="space-y-2.5">
            {[80, 65, 90].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded-full animate-pulse"
                style={{ width: `${w}%`, background: "var(--surface-2)" }}
              />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-sm" style={{ color: "#8888aa" }}>
            Not enough data yet to detect patterns.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-3">
                <div
                  className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "var(--accent)" }}
                />
                <span className="text-sm" style={{ color: "var(--foreground)", lineHeight: 1.6 }}>
                  {insight}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
