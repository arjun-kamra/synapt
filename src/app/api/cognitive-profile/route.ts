import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROFILE_TYPES = {
  tab_switch: {
    name: "Reactive Focus Type",
    icon: "🔁",
  },
  idle: {
    name: "Slow Drift Type",
    icon: "💤",
  },
  typing_slowdown: {
    name: "Task-Switch Driven Type",
    icon: "⌨️",
  },
};

export async function POST(request: Request) {
  try {
    const { triggerCounts, totalSessions, avgScore } = await request.json();

    if (!triggerCounts || Object.keys(triggerCounts).length === 0) {
      return NextResponse.json({ profile: null });
    }

    // Determine dominant trigger
    const dominant = Object.entries(triggerCounts as Record<string, number>)
      .sort((a, b) => b[1] - a[1])[0][0] as keyof typeof PROFILE_TYPES;

    const profileType = PROFILE_TYPES[dominant] ?? PROFILE_TYPES["idle"];

    const prompt = `You are a cognitive performance coach. Write exactly 2 sentences describing this user's focus profile type. Be specific, useful, and second-person. Then write one short personalized tip (1 sentence).

Profile type: ${profileType.name}
Dominant drift trigger: ${dominant.replace("_", " ")}
Trigger breakdown: ${JSON.stringify(triggerCounts)}
Total sessions: ${totalSessions}
Avg focus score: ${avgScore}/100

Format your response as JSON:
{"description": "2 sentence description", "tip": "1 sentence actionable tip"}`;

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "{}";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ profile: null });

    const { description, tip } = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      profile: {
        type: profileType.name,
        icon: profileType.icon,
        dominantTrigger: dominant,
        description,
        tip,
      },
    });
  } catch (err) {
    console.error("cognitive-profile error:", err);
    return NextResponse.json({ profile: null });
  }
}
