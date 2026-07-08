/**
 * Minimal Claude (Anthropic) Messages API client via fetch — no SDK.
 * Endpoint: POST https://api.anthropic.com/v1/messages
 * Docs model default: claude-opus-4-8 (override with ANTHROPIC_MODEL;
 * set claude-haiku-4-5 for the lowest-latency tutor responses).
 */

const API_URL = "https://api.anthropic.com/v1/messages";
const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export const aiConfigured = () => !!API_KEY;

export type ChatMessage = { role: "user" | "assistant"; content: string };

export async function callClaude({
  system,
  messages,
  maxTokens = 1024,
}: {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}): Promise<{ ok: boolean; text?: string; error?: string }> {
  if (!aiConfigured()) {
    return { ok: false, error: "AI is not configured (missing ANTHROPIC_API_KEY)" };
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        system,
        messages,
      }),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error?.message || `AI error (HTTP ${res.status})`,
      };
    }

    // A refusal returns 200 with stop_reason "refusal" and (often) empty content.
    if (data?.stop_reason === "refusal") {
      return {
        ok: false,
        error: "The AI declined to answer that request.",
      };
    }

    // content is an array of blocks; concatenate the text blocks.
    const text = Array.isArray(data?.content)
      ? data.content
        .filter((b: any) => b.type === "text")
        .map((b: any) => b.text)
        .join("")
        .trim()
      : "";

    return { ok: true, text };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}
