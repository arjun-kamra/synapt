"use client";

import { motion } from "framer-motion";
import Link from "next/link";

// ── Shared animation preset ──────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

const SynaptLogo = () => (
  <svg width="22" height="22" viewBox="0 0 26 26" fill="none">
    <circle cx="13" cy="13" r="3.5" fill="#EF9F27" />
    <circle cx="13" cy="13" r="7.5" stroke="#EF9F27" strokeWidth="0.75" strokeDasharray="2.5 2" fill="none" opacity="0.45" />
    <circle cx="13" cy="4.5" r="1.5" fill="#FAC775" />
    <circle cx="21.5" cy="18" r="1.5" fill="#FAC775" />
    <circle cx="4.5" cy="18" r="1.5" fill="#FAC775" />
  </svg>
);

// ── Icon components ──────────────────────────────────────────
const IconIdle = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <circle cx="11" cy="11" r="9" stroke="#EF9F27" strokeWidth="1.5" opacity="0.5" />
    <circle cx="11" cy="11" r="3" fill="#EF9F27" opacity="0.7" />
    <line x1="11" y1="3" x2="11" y2="5" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="11" y1="17" x2="11" y2="19" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="3" y1="11" x2="5" y2="11" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="17" y1="11" x2="19" y2="11" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
);

const IconTab = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="2" y="5" width="8" height="12" rx="2" stroke="#EF9F27" strokeWidth="1.5" opacity="0.5" />
    <rect x="12" y="5" width="8" height="12" rx="2" stroke="#EF9F27" strokeWidth="1.5" opacity="0.9" />
    <path d="M9 11h4M11 9l2 2-2 2" stroke="#EF9F27" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconTyping = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M3 14 Q6 8 11 11 Q16 14 19 8" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.9" />
    <circle cx="11" cy="11" r="1.5" fill="#EF9F27" opacity="0.7" />
  </svg>
);

// ── Signal cards data ────────────────────────────────────────
const signals = [
  {
    Icon: IconIdle,
    title: "Idle Behavior",
    body: "When cognitive engagement drops, motor activity follows. Reduced mouse movement, absence of keystrokes, and lack of scrolling are reliable proxies for disengagement. Research on behavioral indicators of mind-wandering consistently identifies motor stillness as an early drift signal.",
    weight: "0.6",
  },
  {
    Icon: IconTab,
    title: "Tab Switching",
    body: "Voluntary task switching is one of the strongest behavioral indicators of avoidance-based distraction. Each tab switch represents a deliberate decision to leave the current task — a clear break in attentional continuity that correlates with reduced cognitive performance on return.",
    weight: "0.5",
  },
  {
    Icon: IconTyping,
    title: "Typing Slowdown",
    body: "Cognitive load and attentional engagement are directly reflected in writing output rate. A sustained drop in words per minute — measured against your personal session baseline — indicates that executive function is beginning to degrade, typically preceding full drift by 60 to 90 seconds.",
    weight: "0.4",
  },
];

// ── Intervention rows data ───────────────────────────────────
const interventions = [
  {
    title: "4-7-8 Breathing",
    mechanism: "Parasympathetic Nervous System Activation",
    body: "The 4-7-8 breathing pattern — 4 seconds inhale, 7 seconds hold, 8 seconds exhale — activates the parasympathetic nervous system through prolonged exhalation. This reduces cortisol levels, lowers heart rate, and shifts the brain from a stress-reactive state back toward calm executive function. Studies on diaphragmatic breathing consistently show improvements in sustained attention following short breathing interventions.",
  },
  {
    title: "Posture & Movement Reset",
    mechanism: "Proprioceptive Feedback & Embodied Cognition",
    body: "The relationship between physical posture and cognitive state is bidirectional. Research in embodied cognition demonstrates that upright posture increases alertness, self-efficacy, and executive function compared to collapsed or passive positioning. Intentional postural correction combined with brief movement activates proprioceptive feedback loops that signal the brain to shift into an active, engaged state.",
  },
  {
    title: "20-20-20 Visual Break",
    mechanism: "Ciliary Muscle Recovery & Visual Attention Restoration",
    body: "Sustained screen focus causes progressive fatigue in the ciliary muscles responsible for lens accommodation. The 20-20-20 rule — looking at something 20 feet away for 20 seconds — allows these muscles to fully relax, reducing ocular strain that contributes to broader cognitive fatigue. Additionally, shifting visual attention to a distant point activates peripheral visual processing associated with relaxed, open awareness rather than narrow task focus.",
  },
];

// ── References data ──────────────────────────────────────────
const references = [
  {
    authors: "Gloria Mark, Daniela Gudith, Ulrich Klocke",
    title: "The Cost of Interrupted Work: More Speed and Stress",
    source: "CHI 2008",
    org: "University of California Irvine",
  },
  {
    authors: "Matthew A. Killingsworth, Daniel T. Gilbert",
    title: "A Wandering Mind Is an Unhappy Mind",
    source: "Science",
    org: "2010",
  },
  {
    authors: "Marcus E. Raichle et al.",
    title: "A Default Mode of Brain Function",
    source: "PNAS",
    org: "2001",
  },
  {
    authors: "Ma, X. et al.",
    title: "The Effect of Diaphragmatic Breathing on Attention, Negative Affect and Stress in Healthy Adults",
    source: "Frontiers in Psychology",
    org: "2017",
  },
  {
    authors: "Nair, S. et al.",
    title: "Do Slumped and Upright Postures Affect Stress Responses?",
    source: "Health Psychology",
    org: "2015",
  },
  {
    authors: "Anshel, J.",
    title: "Visual Ergonomics in the Workplace",
    source: "AAOHN Journal",
    org: "2007",
  },
  {
    authors: "Smallwood, J., Schooler, J.W.",
    title: "The Restless Mind",
    source: "Psychological Bulletin",
    org: "2006",
  },
  {
    authors: "Ophir, E., Nass, C., Wagner, A.D.",
    title: "Cognitive Control in Media Multitaskers",
    source: "PNAS",
    org: "2009",
  },
];

// ── Section label ────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
      color: "#EF9F27", textTransform: "uppercase", marginBottom: 14,
    }}>
      {text}
    </div>
  );
}

// ── Divider ──────────────────────────────────────────────────
function Divider() {
  return (
    <div style={{
      width: "100%", height: "0.5px",
      background: "rgba(255,255,255,0.06)", margin: "72px 0",
    }} />
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function ResearchClient() {
  return (
    <div style={{ background: "#080806", minHeight: "100vh", fontFamily: "inherit", color: "#f5f0e8" }}>

      {/* ── Nav ──────────────────────────────────────────── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 40px", borderBottom: "0.5px solid rgba(255,255,255,0.06)",
      }}>
        <Link href="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          textDecoration: "none",
        }}>
          <SynaptLogo />
          <span style={{ fontSize: 16, fontWeight: 500, color: "#f5f0e8", letterSpacing: "-0.02em" }}>
            Synapt
          </span>
        </Link>
        <Link href="/auth/signup" style={{
          fontSize: 13, fontWeight: 500, color: "#f5f0e8",
          background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(255,255,255,0.1)",
          padding: "7px 16px", borderRadius: 8, textDecoration: "none",
        }}>
          Get started
        </Link>
      </nav>

      {/* ── Content container ────────────────────────────── */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 24px 100px" }}>

        {/* ── SECTION 1: Hero ──────────────────────────── */}
        <motion.div
          {...fadeUp}
          style={{ textAlign: "center", padding: "96px 0 80px" }}
        >
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
            color: "#EF9F27", textTransform: "uppercase", marginBottom: 22,
          }}>
            Research &amp; Science
          </div>
          <h1 style={{
            fontSize: 46, fontWeight: 500, letterSpacing: "-0.04em",
            lineHeight: 1.1, color: "#f5f0e8", marginBottom: 20,
          }}>
            The Science Behind Synapt
          </h1>
          <p style={{
            fontSize: 17, color: "rgba(255,255,255,0.38)", lineHeight: 1.65,
            maxWidth: 480, margin: "0 auto",
          }}>
            Synapt is built on decades of cognitive neuroscience research. Here is why it works.
          </p>
        </motion.div>

        <Divider />

        {/* ── SECTION 2: Attention Drift ───────────────── */}
        <motion.section {...fadeUp}>
          <SectionLabel text="Attention Drift" />
          <h2 style={{
            fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em",
            color: "#f5f0e8", marginBottom: 28, lineHeight: 1.2,
          }}>
            Why Your Brain Loses Focus
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              `The human brain was not designed for sustained focus on a single task. The Default Mode Network — a set of interconnected brain regions — activates automatically during periods of low external stimulation, pulling attention inward toward mind-wandering, self-referential thought, and distraction. This is not a flaw. It is a built-in cognitive mechanism. But in the context of modern knowledge work, it is the primary source of lost productivity.`,
              `Research from the University of California, Irvine found that it takes an average of 23 minutes to fully regain deep focus after an interruption. The problem is compounded by the fact that most people do not notice when they have drifted — the transition from focused work to distraction is gradual, not sudden. By the time you realize you have lost focus, you have already been gone for minutes.`,
              `Synapt addresses this at the signal level. Rather than waiting for you to notice the drift yourself, it detects the behavioral signatures of attention loss in real time and intervenes before the drift becomes a full disconnection.`,
            ].map((p, i) => (
              <p key={i} style={{
                fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, margin: 0,
              }}>
                {p}
              </p>
            ))}
          </div>
        </motion.section>

        <Divider />

        {/* ── SECTION 3: Signal Detection ──────────────── */}
        <motion.section {...fadeUp}>
          <SectionLabel text="Signal Detection" />
          <h2 style={{
            fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em",
            color: "#f5f0e8", marginBottom: 12, lineHeight: 1.2,
          }}>
            Reading the Patterns of Distraction
          </h2>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.7,
            marginBottom: 36,
          }}>
            Attention drift leaves measurable traces in behavior before it becomes conscious. Synapt tracks three of them.
          </p>

          {/* Signal cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}>
            {signals.map(({ Icon, title, body, weight }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "22px 20px",
                  display: "flex", flexDirection: "column", gap: 14,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(239,159,39,0.08)",
                  border: "0.5px solid rgba(239,159,39,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e8", marginBottom: 8 }}>
                    {title}
                  </div>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.7, margin: 0 }}>
                    {body}
                  </p>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                  color: "#EF9F27", background: "rgba(239,159,39,0.08)",
                  border: "0.5px solid rgba(239,159,39,0.2)",
                  padding: "4px 10px", borderRadius: 99, alignSelf: "flex-start",
                }}>
                  Signal weight: {weight}
                </div>
              </motion.div>
            ))}
          </div>

          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.7,
            borderLeft: "2px solid rgba(239,159,39,0.35)", paddingLeft: 16, margin: 0,
          }}>
            When the combined confidence score of these signals crosses 0.75, Synapt fires a drift event. No single signal alone determines it — the system looks for convergence.
          </p>
        </motion.section>

        <Divider />

        {/* ── SECTION 4: Intervention Science ──────────── */}
        <motion.section {...fadeUp}>
          <SectionLabel text="Interventions" />
          <h2 style={{
            fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em",
            color: "#f5f0e8", marginBottom: 12, lineHeight: 1.2,
          }}>
            Why Each Reset Works
          </h2>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.7,
            marginBottom: 40,
          }}>
            {`Synapt's three intervention types are each grounded in a distinct physiological mechanism for restoring attentional capacity.`}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {interventions.map(({ title, mechanism, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  padding: "28px 0",
                  borderTop: i === 0 ? "0.5px solid rgba(255,255,255,0.07)" : undefined,
                  borderBottom: "0.5px solid rgba(255,255,255,0.07)",
                }}
              >
                <div style={{
                  display: "flex", alignItems: "baseline",
                  justifyContent: "space-between", flexWrap: "wrap",
                  gap: 8, marginBottom: 6,
                }}>
                  <h3 style={{
                    fontSize: 16, fontWeight: 500, color: "#f5f0e8",
                    margin: 0, letterSpacing: "-0.01em",
                  }}>
                    {title}
                  </h3>
                  <span style={{
                    fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.04em",
                  }}>
                    {mechanism}
                  </span>
                </div>
                <p style={{
                  fontSize: 14, color: "rgba(255,255,255,0.42)", lineHeight: 1.75,
                  margin: 0,
                }}>
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Divider />

        {/* ── SECTION 5: Expert Validation ─────────────── */}
        <motion.section {...fadeUp}>
          <SectionLabel text="Validation" />
          <h2 style={{
            fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em",
            color: "#f5f0e8", marginBottom: 32, lineHeight: 1.2,
          }}>
            Reviewed by a Neurologist
          </h2>

          <div style={{
            background: "rgba(239,159,39,0.04)",
            border: "0.5px solid rgba(239,159,39,0.18)",
            borderLeft: "3px solid #EF9F27",
            borderRadius: 14, padding: "32px 32px 28px",
          }}>
            <p style={{
              fontSize: 15, color: "rgba(255,255,255,0.55)", lineHeight: 1.8,
              margin: "0 0 28px",
            }}>
              {`Synapt's detection methodology and intervention design were reviewed by Dr. Venkat K. Rao, a practicing neurologist. The behavioral signal approach and physiological basis for each intervention type were evaluated for scientific accuracy and clinical relevance.`}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(239,159,39,0.12)",
                border: "0.5px solid rgba(239,159,39,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, color: "#EF9F27", fontWeight: 600,
              }}>
                V
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e8" }}>
                  Dr. Venkat K. Rao
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
                  Neurologist
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <Divider />

        {/* ── SECTION 6: References ─────────────────────── */}
        <motion.section {...fadeUp}>
          <SectionLabel text="References" />
          <h2 style={{
            fontSize: 28, fontWeight: 500, letterSpacing: "-0.03em",
            color: "#f5f0e8", marginBottom: 32, lineHeight: 1.2,
          }}>
            Academic Sources
          </h2>

          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {references.map(({ authors, title, source, org }, i) => (
              <li key={i} style={{
                display: "flex", gap: 16, alignItems: "flex-start",
                padding: "16px 0",
                borderBottom: i < references.length - 1
                  ? "0.5px solid rgba(255,255,255,0.05)" : undefined,
              }}>
                <span style={{
                  fontSize: 11, color: "rgba(255,255,255,0.2)",
                  minWidth: 20, paddingTop: 1, textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {i + 1}.
                </span>
                <div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                    {authors} — &ldquo;{title}&rdquo; —{" "}
                  </span>
                  <span style={{ fontSize: 13, color: "#EF9F27" }}>
                    {source}
                  </span>
                  {org && (
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
                      {", "}{org}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </motion.section>

        <Divider />

        {/* ── SECTION 7: Bottom CTA ─────────────────────── */}
        <motion.section
          {...fadeUp}
          style={{ textAlign: "center", padding: "20px 0 20px" }}
        >
          <h2 style={{
            fontSize: 30, fontWeight: 500, letterSpacing: "-0.03em",
            color: "#f5f0e8", marginBottom: 12, lineHeight: 1.2,
          }}>
            Built on science. Validated in practice.
          </h2>
          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.35)", marginBottom: 32,
          }}>
            See how your own attention patterns compare.
          </p>
          <Link
            href="/auth/signup"
            style={{
              display: "inline-block",
              background: "#EF9F27", color: "#1a0e00",
              fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
              padding: "13px 28px", borderRadius: 10,
              textDecoration: "none",
            }}
          >
            Start a Free Session
          </Link>
        </motion.section>

      </div>
    </div>
  );
}
