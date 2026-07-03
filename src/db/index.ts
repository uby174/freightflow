import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "node:path";
import * as schema from "./schema";

const DDL = `
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'booked',
  mode TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'fr',
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  sender_email TEXT,
  sender_whatsapp INTEGER NOT NULL DEFAULT 1,
  receiver_name TEXT NOT NULL,
  receiver_phone TEXT NOT NULL,
  receiver_city TEXT NOT NULL,
  receiver_neighborhood TEXT,
  receiver_landmark TEXT,
  contents TEXT NOT NULL,
  departure_id INTEGER,
  packaging_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  pickup_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS parcels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  est_weight_kg REAL NOT NULL,
  est_l INTEGER NOT NULL,
  est_w INTEGER NOT NULL,
  est_h INTEGER NOT NULL,
  packaging_type TEXT NOT NULL,
  fragile INTEGER NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0.5,
  estimated_by TEXT NOT NULL DEFAULT 'heuristic',
  actual_weight_kg REAL,
  weighed_at INTEGER,
  price_delta_cents INTEGER
);
CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  packaging_cents INTEGER NOT NULL,
  shipping_cents INTEGER NOT NULL,
  pickup_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  distance_km REAL,
  distance_source TEXT,
  reason TEXT NOT NULL DEFAULT 'initial',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS pickup_bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  city TEXT NOT NULL,
  distance_km REAL NOT NULL,
  scheduled_date TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);
CREATE TABLE IF NOT EXISTS packaging_chart (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  label_fr TEXT NOT NULL,
  label_en TEXT NOT NULL,
  max_weight_kg REAL NOT NULL,
  dims TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS shipping_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  min_kg REAL NOT NULL,
  max_kg REAL NOT NULL,
  per_kg_cents INTEGER NOT NULL,
  min_price_cents INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS departures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  departs_at INTEGER NOT NULL,
  cutoff_at INTEGER NOT NULL,
  label TEXT NOT NULL,
  port TEXT NOT NULL DEFAULT 'Le Havre',
  eta_douala INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS carrier_shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL UNIQUE,
  carrier_name TEXT NOT NULL,
  carrier_tracking_number TEXT NOT NULL,
  planned_events TEXT NOT NULL,
  next_event_index INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tracking_events_raw (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  carrier_tracking_number TEXT NOT NULL,
  raw_status TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  occurred_at INTEGER NOT NULL,
  dedupe_hash TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS tracking_events_branded (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  raw_id INTEGER,
  status_key TEXT NOT NULL,
  message_fr TEXT NOT NULL,
  message_en TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  branded_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  locale TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at INTEGER
);
CREATE TABLE IF NOT EXISTS forbidden_terms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,
  replacement TEXT NOT NULL
);
`;

function createDb() {
  const file = path.join(process.cwd(), "camfret.db");
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(DDL);
  const db = drizzle(sqlite, { schema });
  seedIfEmpty(sqlite);
  return db;
}

function seedIfEmpty(sqlite: Database.Database) {
  const count = sqlite
    .prepare("SELECT COUNT(*) AS n FROM packaging_chart")
    .get() as { n: number };
  if (count.n > 0) return;

  // ── Packaging chart (INDICATIVE — replace with founder's real charts) ──
  const pkg = sqlite.prepare(
    "INSERT INTO packaging_chart (type,label_fr,label_en,max_weight_kg,dims,price_cents) VALUES (?,?,?,?,?,?)"
  );
  pkg.run("envelope", "Enveloppe documents", "Document envelope", 1, "35×25×3 cm", 250);
  pkg.run("small_box", "Petit carton", "Small box", 10, "40×30×20 cm", 400);
  pkg.run("medium_box", "Carton moyen", "Medium box", 25, "60×40×40 cm", 700);
  pkg.run("large_box", "Grand carton", "Large box", 40, "80×60×40 cm", 1200);
  pkg.run("barrel", "Fût 120 L", "120 L barrel", 80, "Ø50×88 cm", 1800);
  pkg.run("fragile_crate", "Caisse renforcée (fragile)", "Reinforced crate (fragile)", 60, "80×60×60 cm", 2500);

  // ── Sea groupage rates per kg (INDICATIVE) ──
  const rate = sqlite.prepare(
    "INSERT INTO shipping_rates (min_kg,max_kg,per_kg_cents,min_price_cents) VALUES (?,?,?,?)"
  );
  rate.run(0, 20, 350, 2500);
  rate.run(20, 50, 320, 7000);
  rate.run(50, 100, 290, 16000);
  rate.run(100, 10000, 250, 29000);

  // ── Consolidation calendar: biweekly Friday departures from Le Havre ──
  const dep = sqlite.prepare(
    "INSERT INTO departures (departs_at,cutoff_at,label,port,eta_douala) VALUES (?,?,?,?,?)"
  );
  const now = new Date();
  let d = new Date(now);
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7)); // next Friday
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < 6; i++) {
    const departs = new Date(d.getTime() + i * 14 * 24 * 3600_000);
    const cutoff = new Date(departs.getTime() - 2 * 24 * 3600_000);
    const eta = new Date(departs.getTime() + 25 * 24 * 3600_000);
    dep.run(
      departs.getTime(),
      cutoff.getTime(),
      `Conteneur SN-${String(i + 1).padStart(2, "0")}`,
      "Le Havre",
      eta.getTime()
    );
  }

  // ── White-label deny-list: partner/carrier identifiers that must NEVER
  //    reach a customer. Extend whenever a partner is onboarded. ──
  const term = sqlite.prepare(
    "INSERT INTO forbidden_terms (term,replacement) VALUES (?,?)"
  );
  const terms: Array<[string, string]> = [
    ["TransGlobal Express", "SN Groupage Solutions"],
    ["TransGlobal", "SN Groupage Solutions"],
    ["TGE Cameroun SARL", "notre agent local"],
    ["TGE", "SN Groupage Solutions"],
    ["MSC AMANDA", "le navire"],
    ["MSC", "notre transporteur maritime"],
    ["Maersk", "notre transporteur maritime"],
    ["CMA CGM", "notre transporteur maritime"],
    ["DHL", "notre réseau"],
    ["Express Union", "notre livreur local"],
    ["Kehl", "la région de Bischwiller"],
  ];
  for (const [t, r] of terms) term.run(t, r);
}

declare global {
  // eslint-disable-next-line no-var
  var __camfretDb: ReturnType<typeof createDb> | undefined;
}

export const db = globalThis.__camfretDb ?? (globalThis.__camfretDb = createDb());
export * from "./schema";
