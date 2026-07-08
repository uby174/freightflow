export const BRAND = "SN Groupage Solutions";
export const BRAND_SHORT = "SN";
export const PARCEL_PREFIX = "SN";

// Terminal / warehouse — Bischwiller, Alsace (per official brand flyers)
export const WAREHOUSE = {
  lat: Number(process.env.SN_WAREHOUSE_LAT ?? 48.7667),
  lng: Number(process.env.SN_WAREHOUSE_LNG ?? 7.8583),
  address:
    process.env.SN_WAREHOUSE_ADDRESS ??
    "Terminal SN Groupage, 67240 Bischwiller, France",
  city: "Bischwiller",
};

// Destination terminal in Cameroon
export const DESTINATION = { city: "Douala", terminal: "Akwa" };

// Customer contacts (from flyers — CONFIRM before go-live)
export const CONTACT = {
  phoneFr1: "07 53 13 25 03",
  phoneFr2: "06 05 77 51 01",
  phoneCm: "+237 657 748 808",
  whatsapp: "33605775101", // wa.me link target (French mobile)
  email: "nsgroupages@gmail.com",
};

// Pickup pricing: €5.00 base + €0.19 per road-km from the terminal
export const PICKUP_BASE_CENTS = 500;
export const PICKUP_PER_KM_CENTS = 19;
export const PICKUP_MAX_KM = 200;

// Weigh-in reconciliation: re-quote when actuals differ beyond either threshold
export const RECONCILE_PCT = 0.15;
export const RECONCILE_MIN_CENTS = 300;

// ── Freight rate card (anchored on published market rates, France Fret Express) ──
// Sea groupage to Cameroon: €750 / m³, volumetric rule 200 kg = 1 m³.
// Freight is the greater of real volume and weight/200 — the "weight or measure"
// rule — so a dense pallet of tiles and a light-but-bulky sofa both price fairly.
export const SEA_RATE_PER_M3_CENTS = 75000; // €750 / m³
export const VOLUMETRIC_KG_PER_M3 = 200; // 200 kg counts as 1 m³
export const MIN_FREIGHT_CENTS = 4500; // €45 floor on the groupage portion of an order

// Coverage / trust gate: below this classifier confidence, or when any part of the
// description can't be matched to the catalog, we do NOT invent a price — we defer
// to a human quote ("we'll confirm on WhatsApp") rather than risk an inconsistent one.
export const CLASSIFY_MIN_CONFIDENCE = 0.6;
export const MAX_LINE_QUANTITY = 50; // per catalog line
export const MAX_ORDER_M3 = 40; // beyond this → human quote (part-load / FCL territory)

// Custom (customer-measured) box bounds — sanity limits for the dimensions field
export const CUSTOM_MIN_CM = 1;
export const CUSTOM_MAX_CM = 600;
export const CUSTOM_MIN_KG = 0.1;
export const CUSTOM_MAX_KG = 2000;

// Demo mode compresses the mock carrier timeline from weeks to seconds
export const DEMO_FAST = (process.env.SN_DEMO_SPEED ?? "fast") === "fast";
export const DEMO_EVENT_GAP_MS = DEMO_FAST ? 40_000 : 2 * 24 * 3600_000;

export const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
// NOTE: `hasAI` / key access live in the server-only module `@/lib/secrets`
// (config.ts is imported by client components and must stay free of `fs`).
