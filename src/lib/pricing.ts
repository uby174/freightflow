import { eq } from "drizzle-orm";
import { db, packagingChart, shippingRates } from "@/db";
import {
  PICKUP_BASE_CENTS,
  PICKUP_PER_KM_CENTS,
} from "./config";
import type { Estimate } from "./estimator";

export interface PriceBreakdown {
  packagingCents: number;
  shippingCents: number;
  pickupCents: number;
  totalCents: number;
  packagingType: string;
  packagingLabelFr: string;
  packagingLabelEn: string;
}

/** Prices always come from the charts — the AI only classifies. */
export function priceForEstimate(
  estimate: Estimate,
  pickupKm?: number
): PriceBreakdown {
  const charts = db
    .select()
    .from(packagingChart)
    .where(eq(packagingChart.active, true))
    .all();

  let pkg =
    charts.find((c) => c.type === estimate.packagingType) ??
    charts.find((c) => c.maxWeightKg >= estimate.weightKg);
  if (!pkg) pkg = charts[charts.length - 1];
  if (estimate.fragile && pkg.type !== "fragile_crate") {
    const crate = charts.find((c) => c.type === "fragile_crate");
    if (crate && estimate.weightKg <= crate.maxWeightKg) pkg = crate;
  }

  const rates = db
    .select()
    .from(shippingRates)
    .where(eq(shippingRates.active, true))
    .all();
  const band =
    rates.find(
      (r) => estimate.weightKg > r.minKg && estimate.weightKg <= r.maxKg
    ) ?? rates[rates.length - 1];
  const shippingCents = Math.max(
    Math.round(estimate.weightKg * band.perKgCents),
    band.minPriceCents
  );

  const pickupCents =
    pickupKm !== undefined && pickupKm >= 0
      ? PICKUP_BASE_CENTS + Math.round(pickupKm * PICKUP_PER_KM_CENTS)
      : 0;

  return {
    packagingCents: pkg.priceCents,
    shippingCents,
    pickupCents,
    totalCents: pkg.priceCents + shippingCents + pickupCents,
    packagingType: pkg.type,
    packagingLabelFr: pkg.labelFr,
    packagingLabelEn: pkg.labelEn,
  };
}

export function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}
