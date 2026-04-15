# Synapt

> Real-time behavioral signal fusion for deep work.

Synapt monitors attention during work sessions and intervenes the moment focus drifts — before you lose 20 minutes to distraction. It fuses three independent behavioral signals into a confidence score, fires a targeted reset exercise, and tracks your recovery patterns over time to build a longitudinal cognitive performance profile.

---

## Core systems

### Real-time behavioral signal fusion

`src/lib/useDriftDetector.ts`

Three independent attention signals run simultaneously and combine additively:

| Signal | Weight | Trigger condition |
|---|---|---|
| Idle detection | 0.6 | No mouse, keyboard, scroll, or touch for 30s |
| Tab visibility | 0.5 | `visibilitychange` fires with `document.hidden` |
| Typing velocity | 0.4 | WPM drops >40% below personal 2-minute baseline |

When the combined score exceeds **0.75**, a drift event fires. A 2-minute cooldown prevents alert fatigue. Signals are weighted so a single strong signal (idle alone: 0.6) won't trigger on its own — intentional pauses don't count as drift.

### Adaptive intervention optimization

`src/components/InterventionModal.tsx` · `src/lib/useScreenCapture.ts`

Three timed reset exercises counteract different drift modes:

- **Breathing reset** — 4-7-8 technique (19s total). Best for tab-switch / context scatter.
- **Posture reset** — Physical alignment sequence (20s total). Best for long idle periods.
- **Visual reset** — 20-20-20 eye strain relief (40s total). Best for typing slowdown.

After each intervention, the user reports whether they recovered. The `best_intervention_type` field tracks which reset has the highest recovery rate per user.

The optional screen capture pipeline (`useScreenCapture`) sends low-frequency frames (1fps, 640×400 JPEG) to Claude vision via `/api/analyze-frame` for ambient focus-state scoring — no data is stored.

### Longitudinal cognitive performance tracking

`src/app/dashboard/page.tsx` · `src/app/profile/page.tsx`

Every completed session writes a row to Supabase:

```
sessions: id, user_id, duration_seconds, focus_score, drift_count,
          effective_recoveries, fastest_recovery_seconds,
          best_intervention_type, drift_events (JSONB)
```

The dashboard surfaces:

- **Weekly grade** (A–F) — weighted average of last 7 days' focus scores
- **Recovery streak** — consecutive sessions with ≥70 focus score or improving delta
- **Before/After panel** — first 10 vs last 10 sessions, score delta and recovery delta
- **AI Insights** (3+ sessions) — Claude Haiku analyzes session + intervention history and returns 3–5 pattern observations

The profile page adds a **Cognitive Profile** (5+ sessions) — Claude classifies the user's dominant drift trigger into one of three archetypes: Reactive Focus Type, Slow Drift Type, or Task-Switch Driven Type, with a personalized recovery tip.

---

## AI endpoints

| Route | Model | Input | Output |
|---|---|---|---|
| `POST /api/insights` | claude-haiku-4-5 | sessions[], interventions[] | string[] (3–5 insights) |
| `POST /api/session-summary` | claude-haiku-4-5 | session metrics | 2–3 sentence summary |
| `POST /api/cognitive-profile` | claude-haiku-4-5 | trigger counts, avg score | profile object |
| `POST /api/analyze-frame` | claude-haiku-4-5 | base64 JPEG | { focused, confidence, reason } |

All AI routes require `ANTHROPIC_API_KEY` in environment.

---

## Stack

- **Next.js 15** (App Router, Turbopack)
- **React 19** with `useRef`-heavy behavioral tracking
- **Supabase** (auth + postgres via `@supabase/ssr`)
- **Framer Motion** — session state transitions, intervention animations
- **Recharts** — Focus Replay timeline chart with drift event markers
- **Web Audio API** — synthesized sound cues, no external files
- **html2canvas** — client-side session share card PNG export
- **Anthropic SDK** — Claude Haiku for all inference

---

## Local development

```bash
npm install
# Add to .env.local:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
# ANTHROPIC_API_KEY=...
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Deployed on Vercel. Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY
```
