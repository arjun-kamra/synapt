/**
 * InterventionModal — Adaptive intervention optimization UI
 *
 * Renders a full-screen overlay guiding the user through a timed reset
 * exercise chosen to counteract the detected drift pattern. Three intervention
 * types are available, each with multiple sequential steps:
 *
 *   breathing  — 4-7-8 technique (inhale 4s / hold 7s / exhale 8s)
 *   posture    — Physical alignment sequence (sit / neck / hands / intention)
 *   visual     — 20-20-20 rule (look away 20s / blink 10s / close 10s)
 *
 * Step progression:
 *   - Each step has a countdown timer (seconds). When it reaches zero the next
 *     step begins automatically. Users can also skip forward manually.
 *   - An overall progress bar tracks completion across all steps.
 *   - When all steps complete, a "How do you feel?" screen offers:
 *       • "Ready to focus" → onComplete(true)
 *       • "Still drifting" → onComplete(false)
 *       • "False alarm"   → onFalsePositive()
 *
 * Sound cues (optional, default on):
 *   - playDriftAlert()         fires on mount
 *   - playInterventionComplete() fires when final step ends
 *
 * Animation: Framer Motion overlay fade + card spring entrance.
 * Each countdown digit pulses (scale 1.15→1) on every tick.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { InterventionType, DriftEvent } from "@/types";
import { playDriftAlert, playInterventionComplete } from "@/lib/sound";

interface Props {
  type: InterventionType;
  driftEvent: DriftEvent | null;
  onComplete: (recovered: boolean) => void;
  onFalsePositive: () => void;
  soundEnabled?: boolean;
}

const INTERVENTIONS = {
  breathing: {
    icon: "🌬️",
    title: "Breathing Reset",
    subtitle: "4-7-8 breathing technique",
    color: "#EF9F27",
    steps: [
      { label: "Inhale", duration: 4, instruction: "Breathe in slowly through your nose" },
      { label: "Hold", duration: 7, instruction: "Hold your breath gently" },
      { label: "Exhale", duration: 8, instruction: "Breathe out fully through your mouth" },
    ],
  },
  posture: {
    icon: "🪑",
    title: "Posture Reset",
    subtitle: "Physical alignment check",
    color: "#34d399",
    steps: [
      { label: "Sit tall", duration: 5, instruction: "Roll shoulders back and down. Sit up straight." },
      { label: "Neck", duration: 5, instruction: "Gently tilt your head side to side to release tension." },
      { label: "Hands", duration: 5, instruction: "Shake out your hands and wrists. Open and close your fists." },
      { label: "Set intention", duration: 5, instruction: "Take a breath. What's the one thing you'll focus on next?" },
    ],
  },
  visual: {
    icon: "👁️",
    title: "Visual Reset",
    subtitle: "20-20-20 rule",
    color: "#fbbf24",
    steps: [
      { label: "Look away", duration: 20, instruction: "Find something at least 20 feet (6m) away and focus on it." },
      { label: "Blink", duration: 10, instruction: "Blink rapidly 10 times to re-moisturize your eyes." },
      { label: "Close", duration: 10, instruction: "Close your eyes and breathe. Let them fully rest." },
    ],
  },
};

const TRIGGER_LABELS: Record<string, string> = {
  idle: "No activity detected",
  tab_switch: "Tab switch detected",
  typing_slowdown: "Typing speed dropped",
};

export default function InterventionModal({
  type, driftEvent, onComplete, onFalsePositive, soundEnabled = true,
}: Props) {
  const intervention = INTERVENTIONS[type];
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(intervention.steps[0].duration);
  const [done, setDone] = useState(false);

  const step = intervention.steps[stepIndex];

  // Play sound on mount
  useEffect(() => {
    if (soundEnabled) playDriftAlert();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = useCallback(() => {
    const next = stepIndex + 1;
    if (next >= intervention.steps.length) {
      setDone(true);
      if (soundEnabled) playInterventionComplete();
    } else {
      setStepIndex(next);
      setTimeLeft(intervention.steps[next].duration);
    }
  }, [stepIndex, intervention.steps, soundEnabled]);

  useEffect(() => {
    if (done) return;
    if (timeLeft <= 0) { advance(); return; }
    const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, done, advance]);

  const progress = done ? 100 : ((step.duration - timeLeft) / step.duration) * 100;
  const totalProgress = done
    ? 100
    : ((stepIndex + (step.duration - timeLeft) / step.duration) / intervention.steps.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(5,5,4,0.96)", backdropFilter: "blur(20px)" }}
      >
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md rounded-2xl p-8 border space-y-5"
          style={{ background: "#0e0e0c", borderColor: "rgba(255,255,255,0.08)" }}
        >
          {/* Drift reason */}
          {driftEvent && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <span style={{ color: "#8888aa" }}>
                {TRIGGER_LABELS[driftEvent.type] ?? driftEvent.type}
              </span>
              <span style={{ color: "#55556a" }}>
                {Math.round(driftEvent.confidence * 100)}% confidence
              </span>
            </div>
          )}

          {/* Header */}
          <div className="text-center space-y-1">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
              className="text-4xl mb-2"
            >
              {intervention.icon}
            </motion.div>
            <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
              {intervention.title}
            </h2>
            <p className="text-sm" style={{ color: "#8888aa" }}>{intervention.subtitle}</p>
          </div>

          {/* Overall progress */}
          <div className="w-full h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-1 rounded-full"
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 1, ease: "linear" }}
              style={{ background: intervention.color }}
            />
          </div>

          {done ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-5"
            >
              <div className="text-5xl">✓</div>
              <div>
                <p className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Reset complete</p>
                <p className="text-sm mt-1" style={{ color: "#8888aa" }}>How do you feel?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => onComplete(true)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: intervention.color, color: "#000" }}>
                  Ready to focus
                </button>
                <button
                  onClick={() => onComplete(false)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm border transition-all hover:opacity-80"
                  style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--foreground)", background: "rgba(255,255,255,0.04)" }}>
                  Still drifting
                </button>
              </div>
              <button
                onClick={onFalsePositive}
                className="text-xs transition-all hover:opacity-80"
                style={{ color: "#55556a" }}>
                This was a false alarm
              </button>
            </motion.div>
          ) : (
            <div className="space-y-5">
              <div className="text-center space-y-2">
                <div className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888aa" }}>
                  Step {stepIndex + 1} of {intervention.steps.length}
                </div>
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1.15, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: intervention.color }}
                >
                  {timeLeft}s
                </motion.div>
                <div className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                  {step.label}
                </div>
                <p className="text-sm" style={{ color: "#8888aa" }}>{step.instruction}</p>
              </div>

              <div className="w-full h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-2 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "linear" }}
                  style={{ background: intervention.color }}
                />
              </div>

              <button
                onClick={advance}
                className="w-full py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "rgba(255,255,255,0.08)", color: "#8888aa", background: "transparent" }}>
                Skip step →
              </button>

              <div className="text-center">
                <button
                  onClick={onFalsePositive}
                  className="text-xs transition-all hover:opacity-80"
                  style={{ color: "#55556a" }}>
                  This was a false alarm — dismiss
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
