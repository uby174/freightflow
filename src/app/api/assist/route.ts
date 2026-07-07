import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assist } from "@/lib/assist";

const bodySchema = z.object({
  message: z.string().min(1).max(1000),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { message, locale } = parsed.data;
  const result = await assist(message, locale);
  return NextResponse.json(result);
}
