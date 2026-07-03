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

// Sea groupage is volumetric — freight = max(by weight, by volume), min per band.
export const SEA_RATE_PER_M3_CENTS = 32000; // €320 / m³ (INDICATIVE)

// Handling / conditioning fee by cargo class (INDICATIVE — replace with real chart)
export const HANDLING: Record<
  string,
  { cents: number; fr: string; en: string }
> = {
  parcel: { cents: 400, fr: "Carton / colis", en: "Box / parcel" },
  bag: { cents: 500, fr: "Sac / ballot", en: "Bag / bundle" },
  tv: { cents: 1500, fr: "TV / écran (renforcé)", en: "TV / screen (reinforced)" },
  tiles: { cents: 1500, fr: "Carreaux (palettisé)", en: "Tiles (palletised)" },
  appliance_small: {
    cents: 800,
    fr: "Petit électroménager",
    en: "Small appliance",
  },
  appliance_large: {
    cents: 2500,
    fr: "Gros électroménager",
    en: "Large appliance",
  },
  furniture: { cents: 2000, fr: "Meuble", en: "Furniture" },
  pallet: { cents: 3500, fr: "Palette", en: "Pallet" },
  vehicle_moto: { cents: 6000, fr: "Moto / scooter", en: "Motorcycle / scooter" },
  vehicle_car: { cents: 15000, fr: "Véhicule", en: "Vehicle" },
  other: { cents: 1000, fr: "Marchandise diverse", en: "General goods" },
};

// Demo mode compresses the mock carrier timeline from weeks to seconds
export const DEMO_FAST = (process.env.SN_DEMO_SPEED ?? "fast") === "fast";
export const DEMO_EVENT_GAP_MS = DEMO_FAST ? 40_000 : 2 * 24 * 3600_000;

export const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
export const hasAI = () => Boolean(process.env.ANTHROPIC_API_KEY);
