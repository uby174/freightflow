import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createOrder } from "@/lib/orders";
import { classifyDescription } from "@/lib/classify";
import { priceQuote, type QuoteItem } from "@/lib/pricing";
import { quoteItemSchema, coerceQuoteItems } from "@/lib/catalog/items";
import { distanceFromWarehouse } from "@/lib/distance";
import {
  PICKUP_MAX_KM,
  PICKUP_BASE_CENTS,
  PICKUP_PER_KM_CENTS,
} from "@/lib/config";

const bodySchema = z.object({
  locale: z.enum(["fr", "en"]).default("fr"),
  mode: z.enum(["dropoff", "pickup"]),
  contents: z.string().min(1).max(2000),
  lines: z.array(quoteItemSchema).optional(), // pinned from the quote step (catalog + custom)
  departureId: z.number().int().positive(),
  sender: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(6).max(30),
    email: z.string().email().optional().or(z.literal("")),
    whatsapp: z.boolean().default(true),
    address: z.string().max(300).optional(),
    postcode: z.string().max(12).optional(),
    city: z.string().max(80).optional(),
  }),
  receiver: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(6).max(30),
    city: z.string().min(2).max(80),
    neighborhood: z.string().max(120).optional(),
    landmark: z.string().max(300).optional(),
  }),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  // Resolve the pinned lines. Catalog refs are validated against the catalog
  // (price is fixed there); custom boxes are bounds-checked. If the client sent
  // no lines, re-classify server-side from the description.
  let lines: QuoteItem[] = [];
  let source = "pinned";
  let confidence = 0.9;
  if (input.lines?.length) {
    lines = coerceQuoteItems(input.lines);
  }
  if (lines.length === 0) {
    const cls = await classifyDescription(input.contents);
    if (cls.needsReview) {
      return NextResponse.json(
        { error: "needs_review", reviewReason: cls.reviewReason },
        { status: 400 }
      );
    }
    lines = cls.lines;
    source = cls.source;
    confidence = cls.confidence;
  }
  if (lines.length === 0) {
    return NextResponse.json({ error: "needs_review" }, { status: 400 });
  }

  // Pickup distance
  let pickupKm: number | undefined;
  if (input.mode === "pickup") {
    const addr = [input.sender.address, input.sender.postcode, input.sender.city]
      .filter(Boolean)
      .join(", ");
    const dist = await distanceFromWarehouse(addr);
    if (!dist || dist.km > PICKUP_MAX_KM) {
      return NextResponse.json({ error: "pickup_unavailable" }, { status: 400 });
    }
    pickupKm = dist.km;
  }
  const pickupCents =
    pickupKm !== undefined
      ? PICKUP_BASE_CENTS + Math.round(pickupKm * PICKUP_PER_KM_CENTS)
      : 0;

  // Re-price server-side from the catalog — the number is never trusted from
  // the client, and is identical to what the quote step showed for these lines.
  const quote = priceQuote(lines, pickupCents);

  const order = await createOrder({
    locale: input.locale,
    mode: input.mode,
    contents: input.contents,
    lines,
    quote,
    classifySource: source,
    confidence,
    departureId: input.departureId,
    sender: { ...input.sender, email: input.sender.email || undefined },
    receiver: input.receiver,
    pickupKm,
  });

  return NextResponse.json({ code: order.code, totalCents: order.totalCents });
}
