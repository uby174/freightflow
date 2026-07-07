import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { classifyDescription } from "@/lib/classify";
import { priceQuote, type QuoteItem } from "@/lib/pricing";
import { quoteItemSchema } from "@/lib/catalog/items";
import { distanceFromWarehouse } from "@/lib/distance";
import { nextDepartures } from "@/lib/shipdate";
import {
  PICKUP_MAX_KM,
  PICKUP_BASE_CENTS,
  PICKUP_PER_KM_CENTS,
} from "@/lib/config";

const bodySchema = z.object({
  description: z.string().max(2000).optional().default(""),
  // explicit user-added items: catalog chips + custom (measured) boxes
  items: z.array(quoteItemSchema).max(30).optional().default([]),
  pickupAddress: z.string().max(300).optional(),
});

// Ambiguous QUANTITIES can't be trusted → defer. Unknown WORDS are "soft":
// we price what we recognise and flag the rest for the assistant.
const HARD_REASONS = new Set([
  "quantity_out_of_range",
  "fractional_quantity",
  "negative_quantity",
  "zero_quantity",
  "oversized",
  "too_many_lines",
]);

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { description, items: explicitItems, pickupAddress } = parsed.data;

  const departures = nextDepartures(3).map((d) => ({
    id: d.id,
    departsAt: d.departsAt.getTime(),
    cutoffAt: d.cutoffAt.getTime(),
    label: d.label,
    port: d.port,
    etaDouala: d.etaDouala.getTime(),
  }));

  let catalogLines: QuoteItem[] = [];
  let unmatched: string[] = [];
  let source = "custom";
  let hardBlock = false;
  let reviewReason: string | undefined;

  if (description.trim().length >= 2) {
    const cls = await classifyDescription(description);
    unmatched = cls.unmatched;
    source = cls.source;
    if (cls.needsReview && cls.reviewReason && HARD_REASONS.has(cls.reviewReason)) {
      hardBlock = true;
      reviewReason = cls.reviewReason;
    } else {
      catalogLines = cls.lines; // matched items (may include partial matches)
    }
  }

  const items: QuoteItem[] = [...catalogLines, ...(explicitItems as QuoteItem[])];

  // Nothing we can price, or an untrustworthy quantity with no explicit fallback
  if (items.length === 0 || (hardBlock && explicitItems.length === 0)) {
    return NextResponse.json({
      needsReview: true,
      reviewReason: reviewReason ?? "no_match",
      unmatched,
      description,
      departures,
    });
  }

  // Pickup distance (legitimately variable — separate from the goods price)
  let pickupKm: number | undefined;
  let pickupResolved: string | undefined;
  let pickupError: string | undefined;
  if (pickupAddress?.trim()) {
    const dist = await distanceFromWarehouse(pickupAddress.trim());
    if (!dist) pickupError = "address_not_found";
    else if (dist.km > PICKUP_MAX_KM) pickupError = "too_far";
    else {
      pickupKm = dist.km;
      pickupResolved = dist.resolvedLabel;
    }
  }
  const pickupCents =
    pickupKm !== undefined
      ? PICKUP_BASE_CENTS + Math.round(pickupKm * PICKUP_PER_KM_CENTS)
      : 0;

  const quote = priceQuote(items, pickupCents);

  return NextResponse.json({
    needsReview: false,
    source,
    lines: items, // pinned selection — client returns these at booking
    quote,
    unmatched, // soft: words we didn't recognise (assistant can help)
    hasUnmatched: unmatched.length > 0,
    pickupKm,
    pickupResolved,
    pickupError,
    departures,
  });
}
