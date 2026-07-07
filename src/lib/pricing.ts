// PURE pricing. No I/O, no Date, no random. Identical `lines` → identical cents.
// This is the guarantee behind "the same item always costs the same".

import {
  SEA_RATE_PER_M3_CENTS,
  VOLUMETRIC_KG_PER_M3,
  MIN_FREIGHT_CENTS,
} from "./config";
import { CATALOG_BY_ID, type ItemClass } from "./catalog/catalog";
import type { MatchLine } from "./catalog/match";

export interface PricedLine {
  catalogId: string;
  quantity: number;
  labelFr: string;
  labelEn: string;
  itemClass: ItemClass;
  volumeM3: number; // aggregate for the line (0 for vehicles)
  weightKg: number; // aggregate for the line (0 for vehicles)
  vehicleCents: number; // flat total for vehicle lines, else 0
}

export interface PriceQuote {
  lines: PricedLine[];
  totalVolumeM3: number;
  totalWeightKg: number;
  chargeableM3: number;
  freightCents: number; // volumetric groupage freight (with €45 floor)
  vehicleCents: number; // sum of vehicle flat rates
  pickupCents: number;
  goodsCents: number; // freight + vehicle
  totalCents: number; // goods + pickup
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Groupage freight = max(Σ volume, Σ weight / 200) × €750/m³, floored at €45.
 * Vehicles are flat-rated. Pickup (distance-based) is added verbatim.
 * All money is integer cents; the ONLY rounding is the single freight round.
 */
export function priceQuote(lines: MatchLine[], pickupCents = 0): PriceQuote {
  let sumVolM3 = 0;
  let sumWeightKg = 0;
  let vehicleCents = 0;
  let hasGroupage = false;
  const outLines: PricedLine[] = [];

  for (const { catalogId, quantity } of lines) {
    const item = CATALOG_BY_ID.get(catalogId);
    if (!item || quantity <= 0) continue;
    const q = Math.floor(quantity);

    if (item.flatPriceCents != null) {
      const cents = item.flatPriceCents * q;
      vehicleCents += cents;
      outLines.push({
        catalogId, quantity: q, labelFr: item.labelFr, labelEn: item.labelEn,
        itemClass: item.class, volumeM3: 0, weightKg: 0, vehicleCents: cents,
      });
    } else {
      hasGroupage = true;
      const unitVol = (item.lengthCm * item.widthCm * item.heightCm) / 1_000_000;
      const lineVol = unitVol * q;
      const lineWeight = item.weightKg * q;
      sumVolM3 += lineVol;
      sumWeightKg += lineWeight;
      outLines.push({
        catalogId, quantity: q, labelFr: item.labelFr, labelEn: item.labelEn,
        itemClass: item.class, volumeM3: round2(lineVol), weightKg: lineWeight,
        vehicleCents: 0,
      });
    }
  }

  const chargeableM3 = Math.max(sumVolM3, sumWeightKg / VOLUMETRIC_KG_PER_M3);
  const freightCents = hasGroupage
    ? Math.max(Math.round(chargeableM3 * SEA_RATE_PER_M3_CENTS), MIN_FREIGHT_CENTS)
    : 0;
  const goodsCents = freightCents + vehicleCents;

  return {
    lines: outLines,
    totalVolumeM3: round2(sumVolM3),
    totalWeightKg: Math.round(sumWeightKg * 10) / 10,
    chargeableM3: round2(chargeableM3),
    freightCents,
    vehicleCents,
    pickupCents,
    goodsCents,
    totalCents: goodsCents + pickupCents,
  };
}

export function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}
