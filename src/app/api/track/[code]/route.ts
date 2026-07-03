import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, orders, parcels, trackingEventsBranded, departures } from "@/db";
import { tickMockCarrier } from "@/lib/tracking";
import { MILESTONES } from "@/lib/carrier/types";

// Customer-facing tracking. Reads ONLY branded events + branded order fields —
// carrier tables are never touched here.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  // Demo convenience: advance the mock timeline on each poll as well
  await tickMockCarrier().catch(() => {});

  const order = db
    .select()
    .from(orders)
    .where(eq(orders.code, normalized))
    .get();
  if (!order) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const events = db
    .select({
      statusKey: trackingEventsBranded.statusKey,
      messageFr: trackingEventsBranded.messageFr,
      messageEn: trackingEventsBranded.messageEn,
      occurredAt: trackingEventsBranded.occurredAt,
    })
    .from(trackingEventsBranded)
    .where(eq(trackingEventsBranded.orderId, order.id))
    .orderBy(asc(trackingEventsBranded.occurredAt))
    .all();

  const parcel = db
    .select()
    .from(parcels)
    .where(eq(parcels.orderId, order.id))
    .get();

  const departure = order.departureId
    ? db.select().from(departures).where(eq(departures.id, order.departureId)).get()
    : undefined;

  return NextResponse.json({
    code: order.code,
    status: order.status,
    receiverCity: order.receiverCity,
    receiverName: order.receiverName,
    mode: order.mode,
    totalCents: order.totalCents,
    estWeightKg: parcel?.estWeightKg,
    actualWeightKg: parcel?.actualWeightKg,
    departure: departure
      ? {
          label: departure.label,
          departsAt: departure.departsAt.getTime(),
          etaDouala: departure.etaDouala.getTime(),
        }
      : null,
    milestones: MILESTONES,
    events: events.map((e) => ({
      statusKey: e.statusKey,
      messageFr: e.messageFr,
      messageEn: e.messageEn,
      occurredAt: e.occurredAt.getTime(),
    })),
  });
}
