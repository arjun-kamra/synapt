import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 128,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `You are a focus detection system. Look at this screenshot and determine if the person is doing productive work.

Productive work includes: code editors, documents, spreadsheets, design tools, terminals, reading articles/PDFs, video calls, note-taking apps, email (composing), learning platforms.

Distracted includes: social media (Twitter/X, Instagram, TikTok, Facebook), YouTube (watching videos), Reddit, news feeds, online shopping, games, idle browser tabs, blank screens.

Respond with JSON only, no explanation:
{"focused": true/false, "confidence": 0.0-1.0, "reason": "one short phrase"}`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ focused: true, confidence: 0.5, reason: "parse error" });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err) {
    console.error("analyze-frame error:", err);
    // Fail open — don't penalize if vision call fails
    return NextResponse.json({ focused: true, confidence: 0.5, reason: "error" });
  }
}
