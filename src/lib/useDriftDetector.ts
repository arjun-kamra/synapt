/**
 * useDriftDetector — Real-time behavioral signal fusion
 *
 * Monitors three independent attention signals and fuses their confidence
 * scores into a single drift event when the combined score crosses a threshold.
 *
 * Signal sources:
 *   - Idle detection: polls for inactivity every 5s (mouse, keyboard, scroll, touch)
 *   - Tab visibility: listens to document visibilitychange events
 *   - Typing velocity: tracks keystrokes in a rolling 10s window, compares
 *     current WPM against a personal baseline established in the first 2 minutes
 *
 * Confidence fusion:
 *   Each signal contributes a weighted confidence score (0–1). Signals are
 *   additive — overlapping signals increase certainty. A 2-minute cooldown
 *   prevents alert fatigue after each drift event fires.
 *
 * Detection version: v2
 */
import { useEffect, useRef, useCallback } from "react";
import type { DriftEvent, DriftSignal } from "@/types";

// ── Thresholds ────────────────────────────────────────────
const IDLE_THRESHOLD_MS = 30_000;        // 30s no activity
const TYPING_WINDOW_MS = 10_000;         // rolling 10s window for WPM
const BASELINE_WINDOW_MS = 120_000;      // 2 min to establish baseline
const TYPING_SLOWDOWN_DROP = 0.40;       // must drop >40% below baseline
const CONFIDENCE_TRIGGER = 0.75;         // threshold to fire intervention
const COOLDOWN_MS = 120_000;             // 2 min between drift events
const POLL_INTERVAL_MS = 5_000;          // idle check frequency

// ── Per-signal confidence weights ────────────────────────
const WEIGHT_IDLE = 0.6;
const WEIGHT_TAB = 0.5;
const WEIGHT_TYPING = 0.4;

interface UseDriftDetectorOptions {
  active: boolean;
  onDrift: (event: DriftEvent) => void;
}

export function useDriftDetector({ active, onDrift }: UseDriftDetectorOptions) {
  const lastActivityRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<boolean>(false);

  // Typing baseline tracking
  const keystrokeTimesRef = useRef<number[]>([]);
  const baselineWpmRef = useRef<number | null>(null);
  const baselineEstablishedAtRef = useRef<number | null>(null);

  // Live signal confidence (0–1 each)
  const signalsRef = useRef<DriftSignal>({ idle: 0, tabSwitch: 0, typingSlowdown: 0 });

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    // Activity resets idle signal
    signalsRef.current = { ...signalsRef.current, idle: 0 };
  }, []);

  const tryFire = useCallback((primaryType: DriftEvent["type"]) => {
    if (cooldownRef.current) return;

    const { idle, tabSwitch, typingSlowdown } = signalsRef.current;
    const combined = Math.min(1, idle + tabSwitch + typingSlowdown);

    if (combined < CONFIDENCE_TRIGGER) return;

    cooldownRef.current = true;
    // Reset all signals after firing
    signalsRef.current = { idle: 0, tabSwitch: 0, typingSlowdown: 0 };

    onDrift({
      type: primaryType,
      timestamp: Date.now(),
      confidence: combined,
      signals: { idle, tabSwitch, typingSlowdown },
    });

    setTimeout(() => {
      cooldownRef.current = false;
    }, COOLDOWN_MS);
  }, [onDrift]);

  useEffect(() => {
    if (!active) return;
    sessionStartRef.current = Date.now();
    lastActivityRef.current = Date.now();
    signalsRef.current = { idle: 0, tabSwitch: 0, typingSlowdown: 0 };
    baselineWpmRef.current = null;
    baselineEstablishedAtRef.current = null;
    keystrokeTimesRef.current = [];

    // ── Idle polling ─────────────────────────────────────
    idleTimerRef.current = setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      if (idleMs >= IDLE_THRESHOLD_MS) {
        signalsRef.current = { ...signalsRef.current, idle: WEIGHT_IDLE };
        tryFire("idle");
      }
    }, POLL_INTERVAL_MS);

    // ── Tab visibility ───────────────────────────────────
    const handleVisibility = () => {
      if (document.hidden) {
        signalsRef.current = { ...signalsRef.current, tabSwitch: WEIGHT_TAB };
        tryFire("tab_switch");
      } else {
        resetActivity();
        signalsRef.current = { ...signalsRef.current, tabSwitch: 0 };
      }
    };

    // ── Activity reset ───────────────────────────────────
    const handleActivity = () => resetActivity();

    // ── Typing speed ─────────────────────────────────────
    const handleKeydown = () => {
      resetActivity();
      const now = Date.now();
      keystrokeTimesRef.current.push(now);

      // Keep only the rolling window
      keystrokeTimesRef.current = keystrokeTimesRef.current.filter(
        (t) => now - t <= TYPING_WINDOW_MS
      );

      const count = keystrokeTimesRef.current.length;
      const windowSecs = TYPING_WINDOW_MS / 1000;
      // ~5 chars per word
      const currentWpm = (count / 5) / (windowSecs / 60);

      const sessionAge = now - sessionStartRef.current;

      // Build baseline during first 2 minutes with enough data
      if (
        baselineWpmRef.current === null &&
        sessionAge <= BASELINE_WINDOW_MS &&
        count >= 20
      ) {
        baselineWpmRef.current = currentWpm;
        baselineEstablishedAtRef.current = now;
      }

      // Only fire if baseline is established and we have enough samples
      if (baselineWpmRef.current !== null && count >= 10) {
        const drop = 1 - currentWpm / baselineWpmRef.current;
        if (drop > TYPING_SLOWDOWN_DROP) {
          signalsRef.current = { ...signalsRef.current, typingSlowdown: WEIGHT_TYPING };
          tryFire("typing_slowdown");
        } else {
          // Recovering — reduce signal
          signalsRef.current = { ...signalsRef.current, typingSlowdown: 0 };
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("mousemove", handleActivity);
    document.addEventListener("mousedown", handleActivity);
    document.addEventListener("keydown", handleKeydown);
    document.addEventListener("scroll", handleActivity);
    document.addEventListener("touchstart", handleActivity);

    return () => {
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("mousemove", handleActivity);
      document.removeEventListener("mousedown", handleActivity);
      document.removeEventListener("keydown", handleKeydown);
      document.removeEventListener("scroll", handleActivity);
      document.removeEventListener("touchstart", handleActivity);
    };
  }, [active, tryFire, resetActivity]);
}
