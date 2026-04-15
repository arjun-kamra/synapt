export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  best_intervention: string | null;
  total_sessions: number;
  total_focus_minutes: number;
};

export type TaskType = "Deep Work" | "Writing" | "Reading" | "Learning" | "Other";

export type Session = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  focus_score: number;
  drift_count: number;
  status: "active" | "completed";
  task_type: TaskType | null;
  time_to_first_drift_seconds: number | null;
  avg_recovery_seconds: number | null;
  detection_version: string | null;
};

export type Intervention = {
  id: string;
  session_id: string;
  user_id: string;
  type: "breathing" | "posture" | "visual";
  triggered_at: string;
  recovered_at: string | null;
  recovery_seconds: number | null;
  recovered: boolean;
  drift_confidence: number | null;
  drift_trigger: string | null;
  response_choice: string | null;
  false_positive_flag: boolean;
  detection_version: string | null;
};

export type DriftSignal = {
  idle: number;       // 0–1 confidence contribution
  tabSwitch: number;
  typingSlowdown: number;
};

export type DriftEvent = {
  type: "idle" | "tab_switch" | "typing_slowdown";
  timestamp: number;
  confidence: number;
  signals: DriftSignal;
};

export type InterventionType = "breathing" | "posture" | "visual";

export type DriftEventRecord = {
  type: string;
  elapsed: number;       // seconds since session start
  confidence: number;
  intervention_type: InterventionType | null;
  recovery_seconds: number | null;
};

export type SessionSummary = {
  duration_seconds: number;
  focus_score: number;
  drift_count: number;
  effective_recoveries: number;
  fastest_recovery_seconds: number | null;
  best_intervention_type: InterventionType | null;
  drift_timeline: { elapsed: number; score: number }[];
  drift_events: DriftEventRecord[];
};
