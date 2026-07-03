import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { estimateParcel } from "@/lib/estimator";
import { priceForEstimate } from "@/lib/pricing";
import { distanceFromWarehouse } from "@/lib/distance";
import { nextDepartures } from "@/lib/shipdate";
import { PICKUP_MAX_KM } from "@/lib/config";

const bodySchema = z.object({
  description: z.string().min(3).max(2000),
  pickupAddress: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { description, pickupAddress } = parsed.data;

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

  const estimate = await estimateParcel(description);
  const price = priceForEstimate(estimate, pickupKm);
  const departures = nextDepartures(3);

  return NextResponse.json({
    estimate,
    price,
    pickupKm,
    pickupResolved,
    pickupError,
    departures: departures.map((d) => ({
      id: d.id,
      departsAt: d.departsAt.getTime(),
      cutoffAt: d.cutoffAt.getTime(),
      label: d.label,
      port: d.port,
      etaDouala: d.etaDouala.getTime(),
    })),
  });
}
