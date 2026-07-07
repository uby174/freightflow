import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { classifyDescription } from "@/lib/classify";
import { priceQuote } from "@/lib/pricing";
import { distanceFromWarehouse } from "@/lib/distance";
import { nextDepartures } from "@/lib/shipdate";
import {
  PICKUP_MAX_KM,
  PICKUP_BASE_CENTS,
  PICKUP_PER_KM_CENTS,
} from "@/lib/config";

const bodySchema = z.object({
  description: z.string().min(1).max(2000),
  pickupAddress: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { description, pickupAddress } = parsed.data;

  const departures = nextDepartures(3).map((d) => ({
    id: d.id,
    departsAt: d.departsAt.getTime(),
    cutoffAt: d.cutoffAt.getTime(),
    label: d.label,
    port: d.port,
    etaDouala: d.etaDouala.getTime(),
  }));

  // Classify first — same text always resolves to the same catalog lines.
  const cls = await classifyDescription(description);

  // Coverage / confidence gate: never invent a price for what we can't map.
  if (cls.needsReview) {
    return NextResponse.json({
      needsReview: true,
      reviewReason: cls.reviewReason,
      unmatched: cls.unmatched,
      matched: cls.lines,
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

  const quote = priceQuote(cls.lines, pickupCents);

  return NextResponse.json({
    needsReview: false,
    source: cls.source,
    lines: cls.lines, // pinned selection — client returns these at booking
    quote, // full itemized breakdown (labels, volumes, cents)
    pickupKm,
    pickupResolved,
    pickupError,
    departures,
  });
}
