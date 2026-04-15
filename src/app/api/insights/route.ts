import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { sessions, interventions } = await request.json();

    if (!sessions || sessions.length < 3) {
      return NextResponse.json({ insights: [] });
    }

    // Build context from session + intervention data
    const completed = sessions.filter((s: { status: string }) => s.status === "completed");
    const totalSessions = completed.length;
    const avgScore = Math.round(
      completed.reduce((sum: number, s: { focus_score: number }) => sum + s.focus_score, 0) / totalSessions
    );

    // Trigger breakdown
    const triggerCounts: Record<string, number> = {};
    for (const iv of interventions) {
      if (iv.drift_trigger) {
        triggerCounts[iv.drift_trigger] = (triggerCounts[iv.drift_trigger] ?? 0) + 1;
      }
    }

    // Recovery by intervention type
    const recoveryByType: Record<string, { sum: number; count: number }> = {};
    for (const iv of interventions) {
      if (iv.recovered && iv.recovery_seconds != null && !iv.false_positive_flag) {
        if (!recoveryByType[iv.type]) recoveryByType[iv.type] = { sum: 0, count: 0 };
        recoveryByType[iv.type].sum += iv.recovery_seconds;
        recoveryByType[iv.type].count += 1;
      }
    }
    const recoveryAvgs = Object.entries(recoveryByType).map(([type, { sum, count }]) => ({
      type,
      avg: Math.round(sum / count),
    }));

    // Task type breakdown
    const taskScores: Record<string, { sum: number; count: number }> = {};
    for (const s of completed) {
      if (s.task_type) {
        if (!taskScores[s.task_type]) taskScores[s.task_type] = { sum: 0, count: 0 };
        taskScores[s.task_type].sum += s.focus_score;
        taskScores[s.task_type].count += 1;
      }
    }

    // Time to first drift
    const driftTimes = completed
      .filter((s: { time_to_first_drift_seconds: number | null }) => s.time_to_first_drift_seconds != null)
      .map((s: { time_to_first_drift_seconds: number; task_type: string | null }) => ({
        seconds: s.time_to_first_drift_seconds,
        task: s.task_type,
      }));

    const prompt = `You are a cognitive performance analyst. Based on this user's focus session data, generate exactly 3–5 short, sharp, second-person insight sentences. Be specific and data-driven. No fluff.

Data:
- Total sessions: ${totalSessions}
- Average focus score: ${avgScore}/100
- Drift triggers: ${JSON.stringify(triggerCounts)}
- Recovery times by intervention type: ${JSON.stringify(recoveryAvgs)}
- Focus scores by task type: ${JSON.stringify(Object.entries(taskScores).map(([t, { sum, count }]) => ({ task: t, avg: Math.round(sum / count) })))}
- Time to first drift samples: ${JSON.stringify(driftTimes.slice(0, 10))}

Rules:
- Each insight must be a single sentence, max 12 words
- Use specific numbers where available
- Second person ("You", "Your")
- No generic advice — only what the data shows
- If recovery time for one intervention type is notably lower, say which one and by how much
- Return as a JSON array of strings: ["insight1", "insight2", ...]`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ insights: [] });

    const insights: string[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ insights: insights.slice(0, 5) });
  } catch (err) {
    console.error("insights error:", err);
    return NextResponse.json({ insights: [] });
  }
}
