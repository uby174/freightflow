import { eq } from "drizzle-orm";
import { db, shippingRates } from "@/db";
import {
  PICKUP_BASE_CENTS,
  PICKUP_PER_KM_CENTS,
  SEA_RATE_PER_M3_CENTS,
  HANDLING,
} from "./config";
import type { Estimate, ItemClass } from "./estimator";

export interface PriceBreakdown {
  packagingCents: number; // handling / conditioning fee
  shippingCents: number; // chargeable freight
  pickupCents: number;
  totalCents: number;
  packagingType: string; // itemClass
  packagingLabelFr: string;
  packagingLabelEn: string;
  weightKg: number;
  volumeM3: number;
}

function volumeFromDims(dims: { l: number; w: number; h: number }) {
  return (dims.l * dims.w * dims.h) / 1e6;
}

/**
 * Groupage pricing: handling fee by cargo class + volumetric freight.
 * Freight is the greater of weight-based and volume-based (chargeable) — the
 * standard "weight or measure" rule, so a light-but-bulky sofa prices fairly.
 */
export function priceForEstimate(
  estimate: Estimate,
  pickupKm?: number
): PriceBreakdown {
  const cls: ItemClass = (estimate.itemClass ?? "parcel") as ItemClass;
  const handling = HANDLING[cls] ?? HANDLING.other;

  const rates = db
    .select()
    .from(shippingRates)
    .where(eq(shippingRates.active, true))
    .all();
  const band =
    rates.find((r) => estimate.weightKg > r.minKg && estimate.weightKg <= r.maxKg) ??
    rates[rates.length - 1];

  const volumeM3 =
    estimate.volumeM3 && estimate.volumeM3 > 0
      ? estimate.volumeM3
      : volumeFromDims(estimate.dims);

  const byWeight = Math.round(estimate.weightKg * band.perKgCents);
  const byVolume = Math.round(volumeM3 * SEA_RATE_PER_M3_CENTS);
  const shippingCents = Math.max(byWeight, byVolume, band.minPriceCents);

  const pickupCents =
    pickupKm !== undefined && pickupKm >= 0
      ? PICKUP_BASE_CENTS + Math.round(pickupKm * PICKUP_PER_KM_CENTS)
      : 0;

  return {
    packagingCents: handling.cents,
    shippingCents,
    pickupCents,
    totalCents: handling.cents + shippingCents + pickupCents,
    packagingType: cls,
    packagingLabelFr: handling.fr,
    packagingLabelEn: handling.en,
    weightKg: estimate.weightKg,
    volumeM3: Math.round(volumeM3 * 100) / 100,
  };
}

export function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}
