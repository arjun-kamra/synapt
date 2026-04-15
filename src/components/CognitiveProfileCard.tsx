"use client";

import { useEffect, useState } from "react";

interface Props {
  triggerCounts: Record<string, number>;
  totalSessions: number;
  avgScore: number;
}

interface ProfileData {
  type: string;
  icon: string;
  dominantTrigger: string;
  description: string;
  tip: string;
}

export default function CognitiveProfileCard({ triggerCounts, totalSessions, avgScore }: Props) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cognitive-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ triggerCounts, totalSessions, avgScore }),
    })
      .then((r) => r.json())
      .then(({ profile }) => {
        setProfile(profile);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border space-y-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
          Cognitive Profile
        </p>
        <div className="space-y-2.5">
          {[70, 90, 55].map((w, i) => (
            <div key={i} className="h-3 rounded-full animate-pulse"
              style={{ width: `${w}%`, background: "var(--surface-2)" }} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 rounded-2xl border space-y-4"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8888aa" }}>
        Cognitive Profile
      </p>

      <div className="flex items-center gap-3">
        <div className="text-3xl">{profile.icon}</div>
        <div>
          <h3 className="font-semibold text-base" style={{ color: "var(--foreground)" }}>
            {profile.type}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#55556a" }}>
            Based on {totalSessions} sessions
          </p>
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: "#8888aa" }}>
        {profile.description}
      </p>

      <div className="p-3 rounded-xl"
        style={{ background: "rgba(239,159,39,0.08)", border: "0.5px solid rgba(239,159,39,0.2)" }}>
        <p className="text-xs font-medium" style={{ color: "#EF9F27" }}>
          💡 {profile.tip}
        </p>
      </div>
    </div>
  );
}
