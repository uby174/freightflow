import { NextRequest, NextResponse } from "next/server";
import { ANTHROPIC_MODEL } from "@/lib/config";
import { getAnthropicKey, checkAdminToken } from "@/lib/secrets";

// Verifies the stored key actually works, without exposing it. Makes one tiny
// Anthropic call and reports ok / a sanitized error.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!checkAdminToken(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = getAnthropicKey();
  if (!key) return NextResponse.json({ ok: false, error: "no_key" });

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 5,
      messages: [{ role: "user", content: "ping" }],
    });
    return NextResponse.json({ ok: true, model: res.model });
  } catch (e) {
    // Surface a short reason (e.g. authentication) but never the key.
    const status = (e as { status?: number })?.status;
    const reason =
      status === 401 ? "invalid_key" : status === 429 ? "rate_limited" : "call_failed";
    return NextResponse.json({ ok: false, error: reason, status });
  }
}
