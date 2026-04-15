"use client";

import { useRef, useState, useEffect } from "react";
import type { SessionSummary } from "@/types";

interface Props {
  summary: SessionSummary;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const INTERVENTION_META: Record<string, { icon: string; label: string }> = {
  breathing: { icon: "🌬️", label: "Breathing" },
  posture: { icon: "🪑", label: "Posture" },
  visual: { icon: "👁️", label: "Visual" },
};

export default function SessionShareCard({ summary }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [quote, setQuote] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Generate a short session quote
    fetch("/api/session-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driftCount: summary.drift_count,
        durationSeconds: summary.duration_seconds,
        triggerBreakdown: {},
        interventionPerformance: {},
        focusScore: summary.focus_score,
        effectiveRecoveries: summary.effective_recoveries,
        quote: true,
      }),
    })
      .then((r) => r.json())
      .then(({ summary: s }) => {
        // Use first sentence only as the quote
        const firstSentence = (s ?? "").split(".")[0];
        setQuote(firstSentence ? firstSentence + "." : "");
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreColor =
    summary.focus_score >= 70 ? "#34d399" : summary.focus_score >= 40 ? "#fbbf24" : "#f87171";

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#080806",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `synapt-session-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Share card error:", err);
    }

    setDownloading(false);
  }

  const best = summary.best_intervention_type
    ? INTERVENTION_META[summary.best_intervention_type]
    : null;

  return (
    <div className="space-y-3">
      {/* Card preview */}
      <div
        ref={cardRef}
        style={{
          background: "#080806",
          border: "0.5px solid rgba(239,159,39,0.3)",
          borderRadius: 20,
          padding: "28px 32px",
          width: "100%",
          maxWidth: 400,
          margin: "0 auto",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <svg width="18" height="18" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="3.5" fill="#EF9F27" />
            <circle cx="13" cy="13" r="7.5" stroke="#EF9F27" strokeWidth="0.75" strokeDasharray="2.5 2" fill="none" opacity="0.45" />
            <circle cx="13" cy="4.5" r="1.5" fill="#FAC775" />
            <circle cx="21.5" cy="18" r="1.5" fill="#FAC775" />
            <circle cx="4.5" cy="18" r="1.5" fill="#FAC775" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e8" }}>Synapt</span>
        </div>

        {/* Score */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            Focus Score
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, color: scoreColor, lineHeight: 1, letterSpacing: "-0.04em" }}>
            {summary.focus_score}
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginTop: 10 }}>
            <div style={{ height: "100%", width: `${summary.focus_score}%`, background: scoreColor, borderRadius: 2 }} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Duration", value: formatTime(summary.duration_seconds) },
            { label: "Drifts", value: summary.drift_count.toString() },
            { label: "Best reset", value: best ? `${best.icon} ${best.label}` : "—" },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f5f0e8" }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI quote */}
        {quote && (
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, fontStyle: "italic", borderTop: "0.5px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
            &ldquo;{quote}&rdquo;
          </p>
        )}
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        style={{ background: "var(--surface)", border: "0.5px solid var(--border)", color: "var(--foreground)" }}
      >
        {downloading ? "Generating…" : "↓ Download session card"}
      </button>
    </div>
  );
}
