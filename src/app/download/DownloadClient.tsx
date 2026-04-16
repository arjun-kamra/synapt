"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
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

const features = [
  {
    title: "Always Running",
    desc: "Works silently in the background across every tab. No need to switch to a separate app.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7.5" stroke="#EF9F27" strokeWidth="1.5" opacity="0.5" />
        <circle cx="10" cy="10" r="2.5" fill="#EF9F27" />
        <circle cx="10" cy="3.5" r="1" fill="#FAC775" opacity="0.7" />
        <circle cx="16.5" cy="13.5" r="1" fill="#FAC775" opacity="0.7" />
        <circle cx="3.5" cy="13.5" r="1" fill="#FAC775" opacity="0.7" />
      </svg>
    ),
  },
  {
    title: "Instant Interventions",
    desc: "Drift detected? A reset appears right where you are, on whatever page you're working on.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v5l3 3" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="10" cy="10" r="7.5" stroke="#EF9F27" strokeWidth="1.5" opacity="0.5" />
        <circle cx="10" cy="10" r="1.5" fill="#EF9F27" />
      </svg>
    ),
  },
  {
    title: "Syncs Automatically",
    desc: "Every session writes directly to your Synapt dashboard. Your data is always up to date.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M4 10a6 6 0 0 1 6-6" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16 10a6 6 0 0 1-6 6" stroke="#EF9F27" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 7l1 3 3-1" stroke="#EF9F27" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 13l-1-3-3 1" stroke="#EF9F27" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const installSteps = [
  'Click "Add to Chrome" above',
  'Click "Add Extension" in the Chrome prompt',
  "Sign in with your Synapt account",
  "Pin the extension to your toolbar and start a session",
];

export default function DownloadClient() {
  return (
    <div style={{ background: "#080806", minHeight: "100vh", fontFamily: "inherit", color: "#f5f0e8" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 40px", borderBottom: "0.5px solid rgba(255,255,255,0.06)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <SynaptLogo />
          <span style={{ fontSize: 16, fontWeight: 500, color: "#f5f0e8", letterSpacing: "-0.02em" }}>Synapt</span>
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          {[
            { label: "Home", href: "/" },
            { label: "Dashboard", href: "/dashboard" },
            { label: "Research", href: "/research" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} style={{
              fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none",
            }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 24px 100px" }}>

        {/* ── Hero ────────────────────────────────────── */}
        <motion.div
          {...fadeUp}
          style={{ textAlign: "center", padding: "88px 0 72px" }}
        >
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
            color: "#EF9F27", textTransform: "uppercase", marginBottom: 20,
          }}>
            Chrome Extension
          </div>
          <h1 style={{
            fontSize: 44, fontWeight: 500, letterSpacing: "-0.04em",
            lineHeight: 1.1, color: "#f5f0e8", marginBottom: 18,
          }}>
            Synapt for Chrome
          </h1>
          <p style={{
            fontSize: 16, color: "rgba(255,255,255,0.38)", lineHeight: 1.7,
            maxWidth: 460, margin: "0 auto 36px",
          }}>
            Real-time focus tracking that runs while you work. Detects drift, triggers resets, and
            syncs everything to your dashboard automatically.
          </p>

          {/* CTA */}
          <motion.a
            href="#"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: "inline-block",
              background: "#EF9F27", color: "#1a0e00",
              fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em",
              padding: "14px 32px", borderRadius: 12, textDecoration: "none",
              marginBottom: 14,
            }}
          >
            Add to Chrome — It&apos;s Free
          </motion.a>
          <div style={{
            fontSize: 11, color: "rgba(255,255,255,0.22)",
            marginTop: 12,
          }}>
            Supports Chrome and Chromium-based browsers (Edge, Brave, Arc)
          </div>
        </motion.div>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "rgba(255,255,255,0.06)", marginBottom: 64 }} />

        {/* ── Feature cards ───────────────────────────── */}
        <motion.div {...fadeUp} style={{ marginBottom: 72 }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
          }}>
            {features.map(({ title, desc, icon }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  borderRadius: 14, padding: "22px 20px",
                }}
              >
                <div style={{
                  width: 38, height: 38, borderRadius: 10,
                  background: "rgba(239,159,39,0.08)",
                  border: "0.5px solid rgba(239,159,39,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 14,
                }}>
                  {icon}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f5f0e8", marginBottom: 8 }}>
                  {title}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, margin: 0 }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "rgba(255,255,255,0.06)", marginBottom: 64 }} />

        {/* ── Install steps ────────────────────────────── */}
        <motion.div {...fadeUp}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.14em",
            color: "#EF9F27", textTransform: "uppercase", marginBottom: 14,
          }}>
            Installation
          </div>
          <h2 style={{
            fontSize: 26, fontWeight: 500, letterSpacing: "-0.03em",
            color: "#f5f0e8", marginBottom: 32,
          }}>
            How to install
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {installSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 16,
                  padding: "18px 0",
                  borderBottom: i < installSteps.length - 1
                    ? "0.5px solid rgba(255,255,255,0.05)" : undefined,
                }}
              >
                <div style={{
                  minWidth: 28, height: 28, borderRadius: "50%",
                  background: "rgba(239,159,39,0.1)",
                  border: "0.5px solid rgba(239,159,39,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: "#EF9F27",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{
                  fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6,
                  paddingTop: 4,
                }}>
                  {step}
                </div>
              </motion.div>
            ))}
          </div>

          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.25)",
            marginTop: 28, lineHeight: 1.65,
            borderLeft: "2px solid rgba(239,159,39,0.25)",
            paddingLeft: 14,
          }}>
            Already have an account? Your data will sync immediately after your first session.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
