// Thin shim over the active tenant. Existing consumers keep importing from here;
// all brand/lane/rate values now come from `@/tenant`.
import { getTenant, bookingLane } from "@/tenant";

const T = getTenant();
const L = bookingLane(T);

export const BRAND = T.name;
export const BRAND_SHORT = T.shortName;
export const PARCEL_PREFIX = T.parcelPrefix;

export const WAREHOUSE = {
  lat: L.terminal.lat,
  lng: L.terminal.lng,
  address: L.terminal.address,
  city: L.terminal.city,
};

export const DESTINATION = { city: L.destCities[0], country: L.destCountry };

export const CONTACT = {
  phoneFr1: T.contact.phones[0] ?? "",
  phoneFr2: T.contact.phones[1] ?? "",
  phoneCm: T.contact.phoneDest ?? "",
  whatsapp: T.contact.whatsapp,
  email: T.contact.email,
};

export const PICKUP_BASE_CENTS = T.pickup.baseCents;
export const PICKUP_PER_KM_CENTS = T.pickup.perKmCents;
export const PICKUP_MAX_KM = T.pickup.maxKm;

// Weigh-in reconciliation: re-quote when actuals differ beyond either threshold
export const RECONCILE_PCT = 0.15;
export const RECONCILE_MIN_CENTS = 300;

// Freight = max(volume, weight/kgPerM3) × rate, floored — "weight or measure".
export const SEA_RATE_PER_M3_CENTS = L.rate.perM3Cents;
export const VOLUMETRIC_KG_PER_M3 = L.rate.kgPerM3;
export const MIN_FREIGHT_CENTS = L.rate.minFreightCents;

// Trust gate: below this confidence, or with unmatched text, defer to a human quote.
export const CLASSIFY_MIN_CONFIDENCE = 0.6;
export const MAX_LINE_QUANTITY = 50;
export const MAX_ORDER_M3 = 40;

export const CUSTOM_MIN_CM = 1;
export const CUSTOM_MAX_CM = 600;
export const CUSTOM_MIN_KG = 0.1;
export const CUSTOM_MAX_KG = 2000;

// Demo mode compresses the mock carrier timeline from weeks to seconds
export const DEMO_FAST =
  (process.env.FREIGHTFLOW_DEMO_SPEED ?? process.env.SN_DEMO_SPEED ?? "fast") === "fast";
export const DEMO_EVENT_GAP_MS = DEMO_FAST ? 40_000 : 2 * 24 * 3600_000;

export const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
// `hasAI` / key access live in the server-only module `@/lib/secrets`.
