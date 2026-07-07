// PURE pricing. No I/O, no Date, no random. Identical input → identical cents.
// This is the guarantee behind "the same item always costs the same".
//
// A quote is a list of items, each either a CATALOG reference (fixed dims) or a
// CUSTOM box (customer-measured dims + weight). Both price by the same rule.

import {
  SEA_RATE_PER_M3_CENTS,
  VOLUMETRIC_KG_PER_M3,
  MIN_FREIGHT_CENTS,
} from "./config";
import { CATALOG_BY_ID, type ItemClass } from "./catalog/catalog";

export interface CatalogRef {
  catalogId: string;
  quantity: number;
}
export interface CustomItem {
  custom: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
    weightKg: number;
    labelFr?: string;
    labelEn?: string;
  };
  quantity: number;
}
export type QuoteItem = CatalogRef | CustomItem;

function isCustom(i: QuoteItem): i is CustomItem {
  return (i as CustomItem).custom !== undefined;
}

export interface PricedLine {
  catalogId: string; // "custom" for measured boxes
  quantity: number;
  labelFr: string;
  labelEn: string;
  itemClass: ItemClass;
  volumeM3: number; // aggregate for the line (0 for vehicles)
  weightKg: number; // aggregate for the line (0 for vehicles)
  vehicleCents: number; // flat total for vehicle lines, else 0
  custom?: boolean;
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
const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Groupage freight = max(Σ volume, Σ weight / 200) × €750/m³, floored at €45.
 * Vehicles are flat-rated. Custom boxes price like any groupage item.
 * Pickup (distance-based) is added verbatim. Money is integer cents; the ONLY
 * rounding is the single freight round.
 */
export function priceQuote(items: QuoteItem[], pickupCents = 0): PriceQuote {
  let sumVolM3 = 0;
  let sumWeightKg = 0;
  let vehicleCents = 0;
  let hasGroupage = false;
  const outLines: PricedLine[] = [];

  for (const item of items) {
    const q = Math.floor(item.quantity);
    if (q <= 0) continue;

    if (isCustom(item)) {
      const c = item.custom;
      hasGroupage = true;
      const unitVol = (c.lengthCm * c.widthCm * c.heightCm) / 1_000_000;
      const lineVol = unitVol * q;
      const lineWeight = c.weightKg * q;
      sumVolM3 += lineVol;
      sumWeightKg += lineWeight;
      outLines.push({
        catalogId: "custom",
        quantity: q,
        labelFr:
          c.labelFr ?? `Caisse sur mesure ${c.lengthCm}×${c.widthCm}×${c.heightCm} cm`,
        labelEn:
          c.labelEn ?? `Custom box ${c.lengthCm}×${c.widthCm}×${c.heightCm} cm`,
        itemClass: "other",
        volumeM3: round2(lineVol),
        weightKg: lineWeight,
        vehicleCents: 0,
        custom: true,
      });
      continue;
    }

    const cat = CATALOG_BY_ID.get(item.catalogId);
    if (!cat) continue;

    if (cat.flatPriceCents != null) {
      const cents = cat.flatPriceCents * q;
      vehicleCents += cents;
      outLines.push({
        catalogId: cat.id, quantity: q, labelFr: cat.labelFr, labelEn: cat.labelEn,
        itemClass: cat.class, volumeM3: 0, weightKg: 0, vehicleCents: cents,
      });
    } else {
      hasGroupage = true;
      const unitVol = (cat.lengthCm * cat.widthCm * cat.heightCm) / 1_000_000;
      const lineVol = unitVol * q;
      const lineWeight = cat.weightKg * q;
      sumVolM3 += lineVol;
      sumWeightKg += lineWeight;
      outLines.push({
        catalogId: cat.id, quantity: q, labelFr: cat.labelFr, labelEn: cat.labelEn,
        itemClass: cat.class, volumeM3: round2(lineVol), weightKg: lineWeight,
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
    chargeableM3: round3(chargeableM3),
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
