import {
  sqliteTable,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(), // CF-2026-XXXXXX — the ONLY tracking id customers ever see
  status: text("status").notNull().default("booked"),
  mode: text("mode").notNull(), // dropoff | pickup
  locale: text("locale").notNull().default("fr"),
  senderName: text("sender_name").notNull(),
  senderPhone: text("sender_phone").notNull(),
  senderEmail: text("sender_email"),
  senderWhatsapp: integer("sender_whatsapp", { mode: "boolean" })
    .notNull()
    .default(true),
  receiverName: text("receiver_name").notNull(),
  receiverPhone: text("receiver_phone").notNull(),
  receiverCity: text("receiver_city").notNull(), // Douala | Yaoundé | ...
  receiverNeighborhood: text("receiver_neighborhood"),
  receiverLandmark: text("receiver_landmark"),
  contents: text("contents").notNull(),
  linesJson: text("lines_json"), // pinned resolved catalog lines [{catalogId,quantity}]
  departureId: integer("departure_id"),
  packagingCents: integer("packaging_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull(),
  pickupCents: integer("pickup_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const parcels = sqliteTable("parcels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  estWeightKg: real("est_weight_kg").notNull(),
  estL: integer("est_l").notNull(),
  estW: integer("est_w").notNull(),
  estH: integer("est_h").notNull(),
  packagingType: text("packaging_type").notNull(),
  fragile: integer("fragile", { mode: "boolean" }).notNull().default(false),
  confidence: real("confidence").notNull().default(0.5),
  estimatedBy: text("estimated_by").notNull().default("heuristic"), // heuristic | ai
  actualWeightKg: real("actual_weight_kg"),
  weighedAt: integer("weighed_at", { mode: "timestamp_ms" }),
  priceDeltaCents: integer("price_delta_cents"),
});

export const quotes = sqliteTable("quotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id"),
  version: integer("version").notNull().default(1),
  packagingCents: integer("packaging_cents").notNull(),
  shippingCents: integer("shipping_cents").notNull(),
  pickupCents: integer("pickup_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  distanceKm: real("distance_km"),
  distanceSource: text("distance_source"),
  reason: text("reason").notNull().default("initial"), // initial | weigh_in_reconciliation
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const pickupBookings = sqliteTable("pickup_bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  address: text("address").notNull(),
  postcode: text("postcode").notNull(),
  city: text("city").notNull(),
  distanceKm: real("distance_km").notNull(),
  scheduledDate: text("scheduled_date"),
  status: text("status").notNull().default("pending"),
});

// Versioned pricing rows — never mutate, insert new rows and flip `active`
export const packagingChart = sqliteTable("packaging_chart", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  labelFr: text("label_fr").notNull(),
  labelEn: text("label_en").notNull(),
  maxWeightKg: real("max_weight_kg").notNull(),
  dims: text("dims").notNull(),
  priceCents: integer("price_cents").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const shippingRates = sqliteTable("shipping_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  minKg: real("min_kg").notNull(),
  maxKg: real("max_kg").notNull(),
  perKgCents: integer("per_kg_cents").notNull(),
  minPriceCents: integer("min_price_cents").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const departures = sqliteTable("departures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  departsAt: integer("departs_at", { mode: "timestamp_ms" }).notNull(),
  cutoffAt: integer("cutoff_at", { mode: "timestamp_ms" }).notNull(),
  label: text("label").notNull(), // e.g. "Conteneur CF-07A"
  port: text("port").notNull().default("Le Havre"),
  etaDouala: integer("eta_douala", { mode: "timestamp_ms" }).notNull(),
});

// ── Internal-only tables. NEVER joined into customer-facing queries. ──

export const carrierShipments = sqliteTable("carrier_shipments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().unique(),
  carrierName: text("carrier_name").notNull(),
  carrierTrackingNumber: text("carrier_tracking_number").notNull(),
  plannedEvents: text("planned_events").notNull(), // JSON timeline the fake carrier plays back
  nextEventIndex: integer("next_event_index").notNull().default(0),
  startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
});

export const trackingEventsRaw = sqliteTable("tracking_events_raw", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  carrierTrackingNumber: text("carrier_tracking_number").notNull(),
  rawStatus: text("raw_status").notNull(),
  rawText: text("raw_text").notNull(),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
  dedupeHash: text("dedupe_hash").notNull().unique(),
});

// ── Customer-facing event stream (the ONLY tracking data the UI reads) ──

export const trackingEventsBranded = sqliteTable("tracking_events_branded", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  rawId: integer("raw_id"),
  statusKey: text("status_key").notNull(),
  messageFr: text("message_fr").notNull(),
  messageEn: text("message_en").notNull(),
  generatedBy: text("generated_by").notNull(), // template | ai | fallback_template
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  brandedId: integer("branded_id").notNull(),
  channel: text("channel").notNull(), // whatsapp | email | web
  locale: text("locale").notNull(),
  status: text("status").notNull().default("sent"), // v1: log transport, always "sent"
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
});

export const forbiddenTerms = sqliteTable("forbidden_terms", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  term: text("term").notNull().unique(),
  replacement: text("replacement").notNull(),
});
