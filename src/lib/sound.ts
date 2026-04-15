/**
 * Minimal Web Audio API sound cues for intervention events.
 * All sounds are synthesized — no external files needed.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(frequency: number, duration: number, gain: number, type: OscillatorType = "sine") {
  const c = getCtx();
  if (!c) return;

  const osc = c.createOscillator();
  const gainNode = c.createGain();

  osc.connect(gainNode);
  gainNode.connect(c.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, c.currentTime);

  gainNode.gain.setValueAtTime(0, c.currentTime);
  gainNode.gain.linearRampToValueAtTime(gain, c.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

/** Soft chime played when a drift intervention is triggered */
export function playDriftAlert() {
  tone(440, 0.4, 0.12);
  setTimeout(() => tone(330, 0.35, 0.08), 120);
}

/** Two-note resolution played when intervention completes */
export function playInterventionComplete() {
  tone(523, 0.3, 0.1);
  setTimeout(() => tone(659, 0.4, 0.1), 180);
}
