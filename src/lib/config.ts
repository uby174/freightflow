export const BRAND = "CamFret";
export const PARCEL_PREFIX = "CF";

export const WAREHOUSE = {
  lat: Number(process.env.CAMFRET_WAREHOUSE_LAT ?? 48.5734),
  lng: Number(process.env.CAMFRET_WAREHOUSE_LNG ?? 7.7521),
  address:
    process.env.CAMFRET_WAREHOUSE_ADDRESS ??
    "Zone Portuaire, 67100 Strasbourg, France",
  city: "Strasbourg",
};

// Pickup pricing: €5.00 base + €0.19 per road-km from the warehouse
export const PICKUP_BASE_CENTS = 500;
export const PICKUP_PER_KM_CENTS = 19;
export const PICKUP_MAX_KM = 150; // beyond this we ask the customer to contact us

// Weigh-in reconciliation: re-quote when actuals differ beyond either threshold
export const RECONCILE_PCT = 0.15;
export const RECONCILE_MIN_CENTS = 300;

// Demo mode compresses the mock carrier timeline from weeks to seconds
export const DEMO_FAST = (process.env.CAMFRET_DEMO_SPEED ?? "fast") === "fast";
export const DEMO_EVENT_GAP_MS = DEMO_FAST ? 40_000 : 2 * 24 * 3600_000;

export const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
export const hasAI = () => Boolean(process.env.ANTHROPIC_API_KEY);
