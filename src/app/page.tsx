'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import DemoOverlay from '@/components/DemoOverlay';

const SynaptLogo = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <circle cx="13" cy="13" r="3.5" fill="#EF9F27" />
    <circle cx="13" cy="13" r="7.5" stroke="#EF9F27" strokeWidth="0.75" strokeDasharray="2.5 2" fill="none" opacity="0.45" />
    <circle cx="13" cy="13" r="11.5" stroke="#EF9F27" strokeWidth="0.5" strokeDasharray="1.5 3" fill="none" opacity="0.2" />
    <circle cx="13" cy="4.5" r="1.5" fill="#FAC775" />
    <circle cx="21.5" cy="18" r="1.5" fill="#FAC775" />
    <circle cx="4.5" cy="18" r="1.5" fill="#FAC775" />
  </svg>
);

const segments = [
  { type: 'flow', flex: 3 },
  { type: 'active', flex: 2 },
  { type: 'idle', flex: 1 },
  { type: 'drift', flex: 1 },
  { type: 'reset', flex: 1 },
  { type: 'flow', flex: 4 },
  { type: 'active', flex: 2 },
  { type: 'idle', flex: 1 },
  { type: 'drift', flex: 2 },
  { type: 'reset', flex: 1 },
  { type: 'flow', flex: 5 },
];

const segColors: Record<string, string> = {
  flow: 'rgba(239,159,39,0.75)',
  active: 'rgba(186,117,23,0.35)',
  idle: 'rgba(255,255,255,0.04)',
  drift: 'rgba(224,74,74,0.35)',
  reset: 'rgba(239,159,39,0.55)',
};

const legend = [
  { label: 'Flow', color: 'rgba(239,159,39,0.85)' },
  { label: 'Active', color: 'rgba(186,117,23,0.5)' },
  { label: 'Idle', color: 'rgba(255,255,255,0.07)' },
  { label: 'Drift', color: 'rgba(224,74,74,0.45)' },
  { label: 'Reset', color: 'rgba(239,159,39,0.55)' },
];

const features = [
  {
    title: 'Drift detection',
    desc: 'Tracks idle time, tab switching, and typing slowdown to catch the moment your focus fades.',
    accent: '#EF9F27',
  },
  {
    title: 'Smart resets',
    desc: "Breathing, posture, and visual breaks — personalized to what actually works for you.",
    accent: '#FAC775',
  },
  {
    title: 'Focus score',
    desc: "Tracks your attention patterns over time so you can see what's working and what isn't.",
    accent: '#BA7517',
  },
];

const stats = [
  { value: '2.4s', label: 'Avg drift detection time' },
  { value: '87%', label: 'Reset acceptance rate' },
  { value: '3.1×', label: 'Longer focus sessions' },
];

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      style={{ textAlign: 'center' }}
    >
      <div style={{ fontSize: 30, fontWeight: 500, color: '#EF9F27', letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 4 }}>{label}</div>
    </motion.div>
  );
}

function FeatureCard({ title, desc, accent, index }: { title: string; desc: string; accent: string; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ borderColor: 'rgba(239,159,39,0.25)', background: 'rgba(239,159,39,0.03)' }}
      style={{
        background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: 22, textAlign: 'left',
        transition: 'border-color 0.2s, background 0.2s', cursor: 'default',
      }}
    >
      <div style={{ width: '100%', height: 1.5, borderRadius: 1, background: accent, opacity: 0.7, marginBottom: 18 }} />
      <h3 style={{ fontSize: 14, fontWeight: 500, color: '#f5f0e8', marginBottom: 6, letterSpacing: '-0.01em' }}>{title}</h3>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>{desc}</p>
    </motion.div>
  );
}

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
    <div style={{ background: '#080806', minHeight: '100vh', fontFamily: 'inherit' }}>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 40px', borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <SynaptLogo />
          </motion.div>
          <span style={{ fontSize: 17, fontWeight: 500, color: '#f5f0e8', letterSpacing: '-0.02em' }}>Synapt</span>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { label: 'Home', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Research', href: '/research' },
            { label: 'Profile', href: '/profile' },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', textDecoration: 'none',
              transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >{label}</a>
          ))}
        </div>
        <a href="/download" style={{
          fontSize: 13, fontWeight: 600, color: '#1a0e00',
          background: '#EF9F27',
          padding: '7px 16px', borderRadius: 8, textDecoration: 'none',
        }}>Download Extension</a>
      </motion.nav>

      {/* Hero */}
      <div style={{ padding: '88px 40px 72px', textAlign: 'center' }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(186,117,23,0.12)', border: '0.5px solid rgba(186,117,23,0.3)',
            borderRadius: 99, padding: '5px 14px', marginBottom: 32,
          }}
        >
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF9F27' }} />
          <span style={{ fontSize: 12, color: '#EF9F27', fontWeight: 500, letterSpacing: '0.04em' }}>
            Cognitive performance platform
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            fontSize: 54, fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.04em',
            color: '#f5f0e8', marginBottom: 20, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto',
          }}
        >
          Synapt tells you exactly when<br />
          you lose focus — and trains you<br />
          to <span style={{ color: '#EF9F27' }}>recover faster.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            fontSize: 16, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65,
            maxWidth: 460, margin: '0 auto 40px',
          }}
        >
          Real-time drift detection. Personalized resets. Your focus score improves every session.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
        >
          <motion.a
            href="/download"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: '#EF9F27', color: '#1a0e00', fontSize: 14, fontWeight: 600,
              padding: '11px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
              letterSpacing: '-0.01em', textDecoration: 'none', display: 'inline-block',
            }}
          >
            Download Extension
          </motion.a>
          <motion.a
            href="/dashboard"
            whileHover={{ background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)',
              fontSize: 14, padding: '11px 24px', borderRadius: 10,
              border: '0.5px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              textDecoration: 'none', display: 'inline-block',
            }}
          >
            View Dashboard
          </motion.a>
          <motion.button
            onClick={() => setIsDemoOpen(true)}
            whileHover={{ background: 'rgba(255,255,255,0.08)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'transparent', color: 'rgba(255,255,255,0.35)',
              fontSize: 13, padding: '11px 20px', borderRadius: 10,
              border: '0.5px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            }}
          >
            See how it works
          </motion.button>
        </motion.div>

        {/* Signal bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          style={{
            width: '100%', maxWidth: 700, margin: '60px auto 0',
            background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '24px 28px',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginBottom: 16 }}>
            Attention signal — live session
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 28 }}>
            {segments.map((seg, i) => (
              <motion.div
                key={i}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.05 }}
                style={{
                  flex: seg.flex, height: '100%', borderRadius: 3,
                  background: segColors[seg.type], transformOrigin: 'left',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 14 }}>
            {legend.map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 700, margin: '44px auto 0' }}>
          {features.map((f, i) => (
            <FeatureCard key={f.title} title={f.title} desc={f.desc} accent={f.accent} index={i} />
          ))}
        </div>

        {/* How it works — 3 steps */}
        <div style={{ maxWidth: 700, margin: '56px auto 0' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: 28,
          }}>
            How it works
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
          }}>
            {[
              { n: '01', title: 'Install the Extension', desc: 'Add Synapt to Chrome in one click. No setup required.' },
              { n: '02', title: 'Work Normally', desc: 'Synapt runs in the background, detecting drift signals as you work.' },
              { n: '03', title: 'Review Your Data', desc: 'Open the dashboard anytime to see your focus patterns, session history, and cognitive profile.' },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '0.5px solid rgba(255,255,255,0.06)',
                borderRadius: 14, padding: '22px 20px',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: '#EF9F27',
                  letterSpacing: '-0.01em', marginBottom: 10,
                }}>{n}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#f5f0e8', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 56,
          padding: '52px 40px', borderTop: '0.5px solid rgba(255,255,255,0.04)', marginTop: 44,
        }}>
          {stats.map((s) => <AnimatedStat key={s.label} value={s.value} label={s.label} />)}
        </div>

        {/* Bottom CTA */}
        <div style={{
          textAlign: 'center', padding: '48px 24px 56px',
          borderTop: '0.5px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ fontSize: 28, fontWeight: 500, color: '#f5f0e8', letterSpacing: '-0.03em', marginBottom: 10 }}>
            Ready to focus better?
          </div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>
            Install the Synapt extension and start your first session in under a minute.
          </p>
          <motion.a
            href="/download"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              display: 'inline-block',
              background: '#EF9F27', color: '#1a0e00',
              fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
              padding: '12px 28px', borderRadius: 10, textDecoration: 'none',
            }}
          >
            Download Extension
          </motion.a>
        </div>
      </div>
    </div>

    <DemoOverlay isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}
