"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import type { DriftEventRecord } from "@/types";

interface Props {
  timeline: { elapsed: number; score: number }[];
  driftEvents: DriftEventRecord[];
  durationSeconds: number;
}

const TRIGGER_COLORS: Record<string, string> = {
  idle: "#f87171",
  tab_switch: "#fb923c",
  typing_slowdown: "#facc15",
  default: "#f87171",
};

const TRIGGER_LABELS: Record<string, string> = {
  idle: "Idle",
  tab_switch: "Tab switch",
  typing_slowdown: "Typing slowdown",
};

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { elapsed, score } = payload[0].payload;
  return (
    <div
      style={{
        background: "#111110",
        border: "0.5px solid rgba(255,255,255,0.1)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        color: "#f5f0e8",
      }}
    >
      <div style={{ color: "#8888aa", marginBottom: 2 }}>{fmt(elapsed)}</div>
      <div style={{ color: "#EF9F27", fontWeight: 600 }}>Score: {score}</div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DriftDot({ cx, cy, payload, driftEvents }: any) {
  const event = driftEvents.find(
    (e: DriftEventRecord) => Math.abs(e.elapsed - payload.elapsed) < 20
  );
  if (!event) return null;

  const color = TRIGGER_COLORS[event.type] ?? TRIGGER_COLORS.default;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="#080806"
      strokeWidth={1.5}
      style={{ cursor: "pointer" }}
    />
  );
}

export default function FocusReplayChart({ timeline, driftEvents }: Props) {
  const [activeEvent, setActiveEvent] = useState<DriftEventRecord | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || timeline.length < 2) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
        Focus Replay
      </p>

      <div
        className="p-4 rounded-2xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={timeline} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="elapsed"
              tickFormatter={(v) => fmt(v)}
              tick={{ fill: "#55556a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "#55556a", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#EF9F27"
              strokeWidth={2}
              dot={(props) => (
                <DriftDot
                  key={`dot-${props.payload.elapsed}`}
                  {...props}
                  driftEvents={driftEvents}
                />
              )}
              activeDot={{ r: 4, fill: "#EF9F27" }}
            />
            {driftEvents.map((ev, i) => {
              const color = TRIGGER_COLORS[ev.type] ?? TRIGGER_COLORS.default;
              const point = timeline.find((t) => Math.abs(t.elapsed - ev.elapsed) < 20);
              if (!point) return null;
              return (
                <ReferenceDot
                  key={i}
                  x={point.elapsed}
                  y={point.score}
                  r={5}
                  fill={color}
                  stroke="#080806"
                  strokeWidth={1.5}
                  onClick={() => setActiveEvent(activeEvent?.elapsed === ev.elapsed ? null : ev)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Drift event detail panel */}
        {activeEvent && (
          <div
            className="mt-3 p-3 rounded-xl text-xs space-y-1"
            style={{ background: "var(--surface-2)", borderLeft: `2px solid ${TRIGGER_COLORS[activeEvent.type] ?? "#f87171"}` }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium" style={{ color: "var(--foreground)" }}>
                {TRIGGER_LABELS[activeEvent.type] ?? activeEvent.type} at {fmt(activeEvent.elapsed)}
              </span>
              <button onClick={() => setActiveEvent(null)} style={{ color: "#55556a" }}>✕</button>
            </div>
            <div style={{ color: "#8888aa" }}>
              Confidence: {Math.round(activeEvent.confidence * 100)}%
              {activeEvent.intervention_type && ` · Reset: ${activeEvent.intervention_type}`}
              {activeEvent.recovery_seconds != null && ` · Recovered in ${activeEvent.recovery_seconds}s`}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "#8888aa" }}>
            <div style={{ width: 16, height: 2, background: "#EF9F27", borderRadius: 1 }} />
            Focus score
          </div>
          {Object.entries(TRIGGER_COLORS)
            .filter(([k]) => k !== "default")
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5 text-xs" style={{ color: "#8888aa" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                {TRIGGER_LABELS[type]}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
