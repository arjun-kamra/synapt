"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceDot,
} from "recharts";
import InterventionModal from "@/components/InterventionModal";
import type { DriftEvent, InterventionType } from "@/types";

// ── Types ────────────────────────────────────────────────────
type DemoPhase = "session" | "intervention" | "summary";
type SignalKey = "idle" | "tabSwitch" | "typingSlowdown";

interface ChartPoint { time: number; score: number }
interface DriftMarker {
  time: number;
  score: number;
  signal: SignalKey;
  intervention: InterventionType;
}
interface SummaryData {
  focusScore: number;
  durationSeconds: number;
  fastestRecovery: number | null;
  chartData: ChartPoint[];
  markers: DriftMarker[];
}

// ── Constants ────────────────────────────────────────────────
const DRIFT_SEQUENCE: Array<{ signal: SignalKey; intervention: InterventionType }> = [
  { signal: "idle",            intervention: "breathing" },
  { signal: "tabSwitch",       intervention: "posture"   },
  { signal: "typingSlowdown",  intervention: "visual"    },
];

const SIGNAL_COLORS: Record<SignalKey, string> = {
  idle:           "#EF9F27",
  tabSwitch:      "#f87171",
  typingSlowdown: "#60a5fa",
};

const SIGNAL_LABELS: Record<SignalKey, string> = {
  idle:           "Idle",
  tabSwitch:      "Tab Switch",
  typingSlowdown: "Typing",
};

const SIGNAL_DISPLAY: Record<SignalKey, string> = {
  idle:           "Idle detection",
  tabSwitch:      "Tab switch",
  typingSlowdown: "Typing slowdown",
};

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const SynaptLogo = () => (
  <svg width="20" height="20" viewBox="0 0 26 26" fill="none">
    <circle cx="13" cy="13" r="3.5" fill="#EF9F27" />
    <circle cx="13" cy="13" r="7.5" stroke="#EF9F27" strokeWidth="0.75" strokeDasharray="2.5 2" fill="none" opacity="0.45" />
    <circle cx="13" cy="4.5" r="1.5" fill="#FAC775" />
    <circle cx="21.5" cy="18" r="1.5" fill="#FAC775" />
    <circle cx="4.5" cy="18" r="1.5" fill="#FAC775" />
  </svg>
);

// ── Props ────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// ── Component ────────────────────────────────────────────────
export default function DemoOverlay({ isOpen, onClose }: Props) {
  const [phase, setPhase] = useState<DemoPhase>("session");
  const [timerDisplay, setTimerDisplay] = useState(0);
  const [focusScoreDisplay, setFocusScoreDisplay] = useState(100);
  const [activeSignal, setActiveSignal] = useState<SignalKey | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<InterventionType>("breathing");
  const [modalDriftEvent, setModalDriftEvent] = useState<DriftEvent | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([{ time: 0, score: 100 }]);
  const [driftMarkers, setDriftMarkers] = useState<DriftMarker[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<number | null>(null);

  // Stable refs for modal callbacks — updated each render cycle
  const onInterventionCompleteRef = useRef<(recovered: boolean) => void>(() => {});
  const onFalsePositiveRef = useRef<() => void>(() => {});

  // Stable callbacks handed to <InterventionModal>
  const handleInterventionComplete = useCallback(
    (recovered: boolean) => onInterventionCompleteRef.current(recovered),
    []
  );
  const handleFalsePositive = useCallback(
    () => onFalsePositiveRef.current(),
    []
  );

  // ── Main demo orchestration ──────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      // Hard reset all display state when closed
      setPhase("session");
      setTimerDisplay(0);
      setFocusScoreDisplay(100);
      setActiveSignal(null);
      setModalOpen(false);
      setChartData([{ time: 0, score: 100 }]);
      setDriftMarkers([]);
      setSummaryData(null);
      setShowComplete(false);
      setHoveredMarker(null);
      return;
    }

    // ── Local mutable session state (avoids stale-closure issues) ──
    let score = 100;
    let clock = 0;
    let driftIdx = 0;
    let interventionStart = 0;
    let fastestRecovery: number | null = null;
    let localChart: ChartPoint[] = [{ time: 0, score: 100 }];
    let localMarkers: DriftMarker[] = [];
    const pending: ReturnType<typeof setTimeout>[] = [];

    function after(fn: () => void, ms: number) {
      const id = setTimeout(fn, ms);
      pending.push(id);
    }

    function pushChartPoint(time: number, s: number) {
      localChart = [...localChart, { time, score: s }];
      setChartData([...localChart]);
    }

    function finishSession() {
      clearInterval(timerInterval);
      after(() => {
        setShowComplete(true);
        after(() => {
          setShowComplete(false);
          // add final chart point
          pushChartPoint(clock, score);
          setSummaryData({
            focusScore: score,
            durationSeconds: clock,
            fastestRecovery,
            chartData: [...localChart],
            markers: [...localMarkers],
          });
          setPhase("summary");
        }, 2000);
      }, 3000);
    }

    function scheduleNextOrEnd() {
      if (driftIdx < DRIFT_SEQUENCE.length) {
        const delay = driftIdx === 1 ? 25_000 : 20_000;
        after(() => triggerDrift(driftIdx), delay);
      } else {
        finishSession();
      }
    }

    // Wire modal callbacks to local-closure functions
    onInterventionCompleteRef.current = (recovered: boolean) => {
      setModalOpen(false);
      setActiveSignal(null);
      setPhase("session");

      const recoveryTime = clock - interventionStart;
      if (fastestRecovery === null || recoveryTime < fastestRecovery) {
        fastestRecovery = recoveryTime;
      }

      if (recovered) {
        score = Math.min(100, score + 3);
        setFocusScoreDisplay(score);
        pushChartPoint(clock, score);
      }

      scheduleNextOrEnd();
    };

    onFalsePositiveRef.current = () => {
      setModalOpen(false);
      setActiveSignal(null);
      setPhase("session");
      scheduleNextOrEnd();
    };

    function triggerDrift(idx: number) {
      const { signal, intervention } = DRIFT_SEQUENCE[idx];
      driftIdx = idx + 1; // advance before any async
      setActiveSignal(signal);

      after(() => {
        score = Math.max(50, score - 10);
        setFocusScoreDisplay(score);
        pushChartPoint(clock, score);

        const marker: DriftMarker = { time: clock, score, signal, intervention };
        localMarkers = [...localMarkers, marker];
        setDriftMarkers([...localMarkers]);

        after(() => {
          const fakeDrift: DriftEvent = {
            type: signal === "idle" ? "idle"
                : signal === "tabSwitch" ? "tab_switch"
                : "typing_slowdown",
            timestamp: Date.now(),
            confidence: 0.85,
            signals: {
              idle:            signal === "idle"           ? 0.6 : 0,
              tabSwitch:       signal === "tabSwitch"      ? 0.5 : 0,
              typingSlowdown:  signal === "typingSlowdown" ? 0.4 : 0,
            },
          };
          setModalType(intervention);
          setModalDriftEvent(fakeDrift);
          setModalOpen(true);
          interventionStart = clock;
          setPhase("intervention");
        }, 500);
      }, 1500);
    }

    // Start clock
    const timerInterval = setInterval(() => {
      clock++;
      setTimerDisplay(clock);
    }, 1000);

    // Kick off first drift at 12s
    after(() => triggerDrift(0), 12_000);

    return () => {
      clearInterval(timerInterval);
      pending.forEach(clearTimeout);
    };
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  const scoreColor =
    focusScoreDisplay >= 70 ? "#34d399"
    : focusScoreDisplay >= 40 ? "#fbbf24"
    : "#f87171";

  return (
    <AnimatePresence>
      <motion.div
        key="demo-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "#080806", overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderBottom: "0.5px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <SynaptLogo />
            <span style={{ fontSize: 15, fontWeight: 500, color: "#f5f0e8", letterSpacing: "-0.01em" }}>
              Synapt
            </span>
          </div>
          <span style={{
            fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.01em",
            display: "none",
            // shown via media query equivalent below — handled with a wrapper
          }}
            className="demo-hint"
          >
            Interactive demo — no account needed
          </span>
          <button
            onClick={onClose}
            style={{
              fontSize: 12, color: "rgba(255,255,255,0.4)",
              background: "rgba(255,255,255,0.05)",
              border: "0.5px solid rgba(255,255,255,0.1)",
              padding: "6px 14px", borderRadius: 8, cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            Exit Demo
          </button>
        </div>

        {/* ── Demo hint (below header on mobile) ─────────── */}
        <div style={{
          textAlign: "center", padding: "10px 24px 0",
          fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.01em",
        }}>
          Interactive demo — no account needed
        </div>

        {/* ── Main content ────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
          <AnimatePresence mode="wait">
            {phase !== "summary" ? (
              <SessionScreen
                key="session"
                timer={timerDisplay}
                focusScore={focusScoreDisplay}
                scoreColor={scoreColor}
                activeSignal={activeSignal}
              />
            ) : (
              summaryData && (
                <SummaryScreen
                  key="summary"
                  data={summaryData}
                  hoveredMarker={hoveredMarker}
                  setHoveredMarker={setHoveredMarker}
                  onCTA={() => { onClose(); window.location.href = "/auth/signup"; }}
                  onClose={onClose}
                />
              )
            )}
          </AnimatePresence>
        </div>

        {/* ── Session complete flash ───────────────────────── */}
        <AnimatePresence>
          {showComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "fixed", inset: 0, zIndex: 60,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(8,8,6,0.85)", backdropFilter: "blur(12px)",
                pointerEvents: "none",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 14 }}>✓</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#f5f0e8", letterSpacing: "-0.03em" }}>
                  Session Complete
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Intervention modal ───────────────────────────── */}
        {modalOpen && modalDriftEvent && (
          <InterventionModal
            type={modalType}
            driftEvent={modalDriftEvent}
            onComplete={handleInterventionComplete}
            onFalsePositive={handleFalsePositive}
            soundEnabled={true}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ── Session screen ────────────────────────────────────────────
function SessionScreen({
  timer, focusScore, scoreColor, activeSignal,
}: {
  timer: number;
  focusScore: number;
  scoreColor: string;
  activeSignal: SignalKey | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4 }}
      style={{
        width: "100%", maxWidth: 440, padding: "52px 24px 40px",
        textAlign: "center",
      }}
    >
      {/* Task label */}
      <div style={{
        fontSize: 11, fontWeight: 500, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: 6,
      }}>
        Deep Work
      </div>

      {/* Timer */}
      <div style={{
        fontSize: 17, fontWeight: 500, color: "rgba(255,255,255,0.5)",
        fontVariantNumeric: "tabular-nums", marginBottom: 44,
        letterSpacing: "0.04em",
      }}>
        {formatTime(timer)}
      </div>

      {/* Focus score */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.08em",
          textTransform: "uppercase", marginBottom: 10,
        }}>
          Focus Score
        </div>
        <motion.div
          key={focusScore}
          initial={{ scale: 1.1, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            fontSize: 88, fontWeight: 700, letterSpacing: "-0.05em",
            color: scoreColor, lineHeight: 1,
          }}
        >
          {focusScore}
        </motion.div>
      </div>

      {/* Pulsing session active indicator */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, marginBottom: 52,
      }}>
        <motion.div
          animate={{ opacity: [1, 0.25, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF9F27" }}
        />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
          Session Active
        </span>
      </div>

      {/* Signal indicators */}
      <div style={{
        display: "flex", justifyContent: "center", gap: 10,
        flexWrap: "wrap",
      }}>
        {(Object.keys(SIGNAL_LABELS) as SignalKey[]).map((key) => {
          const isActive = activeSignal === key;
          return (
            <motion.div
              key={key}
              animate={isActive
                ? { scale: [1, 1.06, 1], boxShadow: [`0 0 0px ${SIGNAL_COLORS[key]}00`, `0 0 12px ${SIGNAL_COLORS[key]}50`, `0 0 0px ${SIGNAL_COLORS[key]}00`] }
                : { scale: 1 }
              }
              transition={isActive ? { duration: 0.9, repeat: Infinity } : {}}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 7,
                padding: "14px 18px", borderRadius: 14,
                background: isActive ? `${SIGNAL_COLORS[key]}12` : "rgba(255,255,255,0.03)",
                border: `0.5px solid ${isActive ? SIGNAL_COLORS[key] : "rgba(255,255,255,0.07)"}`,
                transition: "background 0.3s, border-color 0.3s",
                minWidth: 90,
              }}
            >
              <motion.div
                animate={isActive
                  ? { opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }
                  : { opacity: 1, scale: 1 }
                }
                transition={isActive ? { duration: 0.9, repeat: Infinity } : {}}
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: isActive ? SIGNAL_COLORS[key] : "rgba(255,255,255,0.1)",
                  transition: "background 0.3s",
                }}
              />
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: isActive ? SIGNAL_COLORS[key] : "rgba(255,255,255,0.22)",
                transition: "color 0.3s",
              }}>
                {SIGNAL_LABELS[key]}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Custom tooltip for the replay chart ──────────────────────
function CustomChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#0e0e0c", border: "0.5px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: "8px 12px",
    }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>
        {formatTime(label ?? 0)}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#f5f0e8" }}>
        {payload[0].value} score
      </div>
    </div>
  );
}

// ── Custom drift marker dot ───────────────────────────────────
function DriftDot({
  cx, cy, marker, idx, hovered, onHover, onLeave,
}: {
  cx?: number; cy?: number;
  marker: DriftMarker;
  idx: number;
  hovered: boolean;
  onHover: (idx: number) => void;
  onLeave: () => void;
}) {
  const color = SIGNAL_COLORS[marker.signal];
  const r = hovered ? 9 : 7;
  return (
    <g>
      <circle
        cx={cx} cy={cy} r={r + 4}
        fill="transparent"
        style={{ cursor: "pointer" }}
        onMouseEnter={() => onHover(idx)}
        onMouseLeave={onLeave}
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill={color}
        fillOpacity={hovered ? 1 : 0.85}
        stroke="#080806"
        strokeWidth={2}
        style={{ cursor: "pointer", transition: "r 0.15s" }}
        onMouseEnter={() => onHover(idx)}
        onMouseLeave={onLeave}
      />
      {hovered && cx != null && cy != null && (
        <foreignObject
          x={cx - 80} y={(cy ?? 0) - 80}
          width={160} height={72}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <div
            style={{
              background: "#0e0e0c",
              border: `0.5px solid ${color}`,
              borderRadius: 8, padding: "7px 10px",
              fontSize: 11, lineHeight: 1.5,
              boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ color, fontWeight: 600, marginBottom: 2 }}>
              {SIGNAL_DISPLAY[marker.signal]}
            </div>
            <div style={{ color: "rgba(255,255,255,0.5)" }}>
              Reset: {marker.intervention}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
}

// ── Summary screen ────────────────────────────────────────────
function SummaryScreen({
  data, hoveredMarker, setHoveredMarker, onCTA, onClose,
}: {
  data: SummaryData;
  hoveredMarker: number | null;
  setHoveredMarker: (idx: number | null) => void;
  onCTA: () => void;
  onClose: () => void;
}) {
  const scoreColor =
    data.focusScore >= 70 ? "#34d399"
    : data.focusScore >= 40 ? "#fbbf24"
    : "#f87171";

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        width: "100%", maxWidth: 560, padding: "36px 24px 48px",
      }}
    >
      {/* Score */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em",
          textTransform: "uppercase", marginBottom: 8,
        }}>
          Final Focus Score
        </div>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 280 }}
          style={{
            fontSize: 72, fontWeight: 700, letterSpacing: "-0.05em",
            color: scoreColor, lineHeight: 1,
          }}
        >
          {data.focusScore}
        </motion.div>
        <div style={{
          height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2,
          marginTop: 10, maxWidth: 180, margin: "10px auto 0",
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.focusScore}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            style={{ height: "100%", background: scoreColor, borderRadius: 2 }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8,
        marginBottom: 28,
      }}>
        {[
          { label: "Duration",          value: formatTime(data.durationSeconds) },
          { label: "Drift Events",      value: "3" },
          { label: "Fastest Recovery",  value: data.fastestRecovery != null ? `${data.fastestRecovery}s` : "—" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "0.5px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: "12px 8px", textAlign: "center",
          }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#f5f0e8", marginBottom: 3 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Focus Replay chart */}
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "0.5px solid rgba(255,255,255,0.06)",
        borderRadius: 14, padding: "16px 16px 8px",
        marginBottom: 20,
      }}>
        <div style={{
          fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em",
          textTransform: "uppercase", marginBottom: 14,
        }}>
          Focus Replay
        </div>
        {mounted && (
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={data.chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="time"
                tickFormatter={(v) => formatTime(v)}
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[50, 105]}
                tick={{ fontSize: 9, fill: "rgba(255,255,255,0.25)" }}
                tickLine={false}
                axisLine={false}
              />
              <RechartsTooltip content={<CustomChartTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#EF9F27"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#EF9F27" }}
              />
              {data.markers.map((m, i) => (
                <ReferenceDot
                  key={i}
                  x={m.time}
                  y={m.score}
                  r={0}
                  shape={(props: { cx?: number; cy?: number }) => (
                    <DriftDot
                      cx={props.cx}
                      cy={props.cy}
                      marker={m}
                      idx={i}
                      hovered={hoveredMarker === i}
                      onHover={setHoveredMarker}
                      onLeave={() => setHoveredMarker(null)}
                    />
                  )}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
          {(Object.keys(SIGNAL_COLORS) as SignalKey[]).map((key) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: SIGNAL_COLORS[key] }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{SIGNAL_LABELS[key]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI insight summary */}
      <div style={{
        padding: "14px 16px",
        background: "rgba(239,159,39,0.05)",
        border: "0.5px solid rgba(239,159,39,0.15)",
        borderRadius: 12, marginBottom: 24,
      }}>
        <p style={{
          fontSize: 13, color: "rgba(255,255,255,0.5)",
          lineHeight: 1.65, margin: 0, fontStyle: "italic",
        }}>
          You experienced 3 drift events across this session. Idle detection was your first trigger.
          Completing your interventions helped you maintain a strong recovery rate — each reset brought
          your score back toward baseline.
        </p>
      </div>

      {/* CTA */}
      <motion.a
        href="/auth/signup"
        whileHover={{ scale: 1.02, opacity: 0.95 }}
        whileTap={{ scale: 0.97 }}
        style={{
          display: "block", width: "100%", textAlign: "center",
          padding: "14px", borderRadius: 12,
          background: "#EF9F27", color: "#1a0e00",
          fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
          textDecoration: "none", marginBottom: 12,
          cursor: "pointer",
        }}
        onClick={(e) => { e.preventDefault(); onCTA(); }}
      >
        Start Tracking Your Focus →
      </motion.a>

      <div style={{ textAlign: "center" }}>
        <button
          onClick={onClose}
          style={{
            fontSize: 12, color: "rgba(255,255,255,0.28)",
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 8px",
          }}
        >
          Exit Demo
        </button>
      </div>
    </motion.div>
  );
}
