"use client";

import { useState, useEffect, useCallback } from "react";
import type { InterventionType, DriftEvent } from "@/types";

interface Props {
  type: InterventionType;
  driftEvent: DriftEvent | null;
  onComplete: (recovered: boolean) => void;
  onFalsePositive: () => void;
}

const INTERVENTIONS = {
  breathing: {
    icon: "🌬️",
    title: "Breathing Reset",
    subtitle: "4-7-8 breathing technique",
    color: "#7c6af7",
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

export default function InterventionModal({ type, driftEvent, onComplete, onFalsePositive }: Props) {
  const intervention = INTERVENTIONS[type];
  const [stepIndex, setStepIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(intervention.steps[0].duration);
  const [done, setDone] = useState(false);

  const step = intervention.steps[stepIndex];

  const advance = useCallback(() => {
    const next = stepIndex + 1;
    if (next >= intervention.steps.length) {
      setDone(true);
    } else {
      setStepIndex(next);
      setTimeLeft(intervention.steps[next].duration);
    }
  }, [stepIndex, intervention.steps]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(12px)" }}>
      <div className="w-full max-w-md rounded-2xl p-8 border space-y-5"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>

        {/* Drift reason */}
        {driftEvent && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
            style={{ background: "var(--surface-2)" }}>
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
          <div className="text-4xl mb-2">{intervention.icon}</div>
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            {intervention.title}
          </h2>
          <p className="text-sm" style={{ color: "#8888aa" }}>{intervention.subtitle}</p>
        </div>

        {/* Overall progress */}
        <div className="w-full h-1 rounded-full" style={{ background: "var(--surface-2)" }}>
          <div className="h-1 rounded-full transition-all duration-500"
            style={{ width: `${totalProgress}%`, background: intervention.color }} />
        </div>

        {done ? (
          <div className="text-center space-y-5">
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
                style={{ borderColor: "var(--border)", color: "var(--foreground)", background: "var(--surface-2)" }}>
                Still drifting
              </button>
            </div>
            {/* False positive — shown after intervention completes too */}
            <button
              onClick={onFalsePositive}
              className="text-xs transition-all hover:opacity-80"
              style={{ color: "#55556a" }}>
              This was a false alarm
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="text-center space-y-2">
              <div className="text-xs font-medium uppercase tracking-widest" style={{ color: "#8888aa" }}>
                Step {stepIndex + 1} of {intervention.steps.length}
              </div>
              <div className="text-3xl font-bold tabular-nums" style={{ color: intervention.color }}>
                {timeLeft}s
              </div>
              <div className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
                {step.label}
              </div>
              <p className="text-sm" style={{ color: "#8888aa" }}>{step.instruction}</p>
            </div>

            <div className="w-full h-2 rounded-full" style={{ background: "var(--surface-2)" }}>
              <div className="h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, background: intervention.color }} />
            </div>

            <button
              onClick={advance}
              className="w-full py-2.5 rounded-xl text-sm font-medium border transition-all hover:opacity-80"
              style={{ borderColor: "var(--border)", color: "#8888aa", background: "transparent" }}>
              Skip step →
            </button>

            {/* False positive dismiss */}
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
      </div>
    </div>
  );
}
