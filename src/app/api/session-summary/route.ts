import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { driftCount, durationSeconds, triggerBreakdown, interventionPerformance, focusScore, effectiveRecoveries } =
      await request.json();

    const minutes = Math.round(durationSeconds / 60);
    const prompt = `You are a focus coach. Write a 2–3 sentence second-person summary of this focus session. Be direct and specific. Reference the actual data. End with one concrete suggestion for next session.

Session data:
- Duration: ${minutes} minutes
- Final focus score: ${focusScore}/100
- Drift events: ${driftCount}
- Fast recoveries (under 60s): ${effectiveRecoveries}
- Drift triggers: ${JSON.stringify(triggerBreakdown)}
- Intervention performance: ${JSON.stringify(interventionPerformance)}

Return plain text only, no JSON, no bullet points. Max 3 sentences.`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const summary = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("session-summary error:", err);
    return NextResponse.json({ summary: "" });
  }
}
