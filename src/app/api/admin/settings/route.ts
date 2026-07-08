import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getKeyStatus,
  setAnthropicKey,
  clearAnthropicKey,
  checkAdminToken,
  adminTokenRequired,
} from "@/lib/secrets";

// Admin-only. Returns/updates the AI key. The key value is NEVER returned to the
// client — only a masked hint. Optional SN_ADMIN_TOKEN gates writes.
export const dynamic = "force-dynamic";

function gate(req: NextRequest): NextResponse | null {
  const token = req.headers.get("x-admin-token");
  if (!checkAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  return NextResponse.json({
    ...getKeyStatus(),
    tokenRequired: adminTokenRequired(),
  });
}

const bodySchema = z.object({
  apiKey: z.string().max(200).optional(),
  clear: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const denied = gate(req);
  if (denied) return denied;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    if (parsed.data.clear) {
      return NextResponse.json(clearAnthropicKey());
    }
    const key = parsed.data.apiKey?.trim();
    if (!key) {
      return NextResponse.json({ error: "missing_key" }, { status: 400 });
    }
    // NOTE: never log the key.
    return NextResponse.json(setAnthropicKey(key));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
