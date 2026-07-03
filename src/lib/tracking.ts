import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  db,
  carrierShipments,
  notifications,
  orders,
  trackingEventsBranded,
  trackingEventsRaw,
} from "@/db";
import { FAKE_STATUS_MAP, type MilestoneKey, type RawCarrierEvent } from "./carrier/types";
import { brandEvent } from "./sanitize";

/** Ingest one raw partner event → sanitize → branded event → notification fan-out. */
export async function ingestRawEvent(
  orderId: number,
  carrierTrackingNumber: string,
  ev: { status: string; text: string; occurredAt: number }
): Promise<boolean> {
  const dedupeHash = createHash("sha256")
    .update(`${carrierTrackingNumber}|${ev.status}|${ev.occurredAt}`)
    .digest("hex");

  const existing = db
    .select({ id: trackingEventsRaw.id })
    .from(trackingEventsRaw)
    .where(eq(trackingEventsRaw.dedupeHash, dedupeHash))
    .get();
  if (existing) return false; // idempotent

  const raw = db
    .insert(trackingEventsRaw)
    .values({
      orderId,
      carrierTrackingNumber,
      rawStatus: ev.status,
      rawText: ev.text,
      occurredAt: new Date(ev.occurredAt),
      dedupeHash,
    })
    .returning({ id: trackingEventsRaw.id })
    .get();

  const milestone: MilestoneKey = FAKE_STATUS_MAP[ev.status] ?? "at_sea";
  const branded = await brandEvent(ev.text, milestone);

  const brandedRow = db
    .insert(trackingEventsBranded)
    .values({
      orderId,
      rawId: raw.id,
      statusKey: milestone,
      messageFr: branded.fr,
      messageEn: branded.en,
      generatedBy: branded.generatedBy,
      occurredAt: new Date(ev.occurredAt),
    })
    .returning({ id: trackingEventsBranded.id })
    .get();

  db.update(orders)
    .set({ status: milestone })
    .where(eq(orders.id, orderId))
    .run();

  // Notification fan-out — v1 transport is the in-app timeline + console log;
  // Twilio/Resend slot into this exact point later.
  const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
  if (order) {
    const channels = order.senderWhatsapp ? ["whatsapp", "web"] : ["email", "web"];
    for (const channel of channels) {
      db.insert(notifications)
        .values({
          orderId,
          brandedId: brandedRow.id,
          channel,
          locale: order.locale,
          status: "sent",
          sentAt: new Date(),
        })
        .run();
    }
    console.log(
      `[camfret notify] ${order.code} → ${channels.join("+")} (${order.locale}): ${
        order.locale === "fr" ? branded.fr : branded.en
      }`
    );
  }
  return true;
}

/** Advance every mock shipment whose next planned event is due. */
export async function tickMockCarrier(): Promise<number> {
  const shipments = db.select().from(carrierShipments).all();
  let emitted = 0;
  for (const s of shipments) {
    const planned = JSON.parse(s.plannedEvents) as RawCarrierEvent[];
    let idx = s.nextEventIndex;
    while (idx < planned.length) {
      const due = s.startedAt.getTime() + planned[idx].offsetMs;
      if (due > Date.now()) break;
      await ingestRawEvent(s.orderId, s.carrierTrackingNumber, {
        status: planned[idx].status,
        text: planned[idx].text,
        occurredAt: due,
      });
      idx++;
      emitted++;
    }
    if (idx !== s.nextEventIndex) {
      db.update(carrierShipments)
        .set({ nextEventIndex: idx })
        .where(eq(carrierShipments.id, s.id))
        .run();
    }
  }
  return emitted;
}
