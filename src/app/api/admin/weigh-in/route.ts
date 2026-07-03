import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, orders, parcels, quotes } from "@/db";
import { priceForEstimate } from "@/lib/pricing";
import { RECONCILE_MIN_CENTS, RECONCILE_PCT } from "@/lib/config";

const bodySchema = z.object({
  code: z.string().min(5),
  actualWeightKg: z.number().min(0.1).max(1000),
});

// Warehouse weigh-in: record actuals, re-quote when the delta matters.
export async function POST(req: NextRequest) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { code, actualWeightKg } = parsed.data;

  const order = db
    .select()
    .from(orders)
    .where(eq(orders.code, code.trim().toUpperCase()))
    .get();
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parcel = db
    .select()
    .from(parcels)
    .where(eq(parcels.orderId, order.id))
    .get();
  if (!parcel) return NextResponse.json({ error: "no_parcel" }, { status: 404 });

  const newPrice = priceForEstimate(
    {
      weightKg: actualWeightKg,
      dims: { l: parcel.estL, w: parcel.estW, h: parcel.estH },
      packagingType: parcel.packagingType,
      fragile: parcel.fragile,
      confidence: 1,
      summaryFr: "",
      summaryEn: "",
      estimatedBy: "heuristic",
    },
    order.pickupCents > 0 ? undefined : undefined
  );
  // Keep original pickup price — distance didn't change at weigh-in
  const newTotal =
    newPrice.packagingCents + newPrice.shippingCents + order.pickupCents;
  const delta = newTotal - order.totalCents;

  db.update(parcels)
    .set({
      actualWeightKg,
      weighedAt: new Date(),
      priceDeltaCents: delta,
    })
    .where(eq(parcels.id, parcel.id))
    .run();

  const needsReconciliation =
    Math.abs(delta) >= RECONCILE_MIN_CENTS &&
    Math.abs(delta) / order.totalCents >= RECONCILE_PCT;

  if (needsReconciliation) {
    const last = db
      .select({ version: quotes.version })
      .from(quotes)
      .where(eq(quotes.orderId, order.id))
      .orderBy(desc(quotes.version))
      .get();
    db.insert(quotes)
      .values({
        orderId: order.id,
        version: (last?.version ?? 1) + 1,
        packagingCents: newPrice.packagingCents,
        shippingCents: newPrice.shippingCents,
        pickupCents: order.pickupCents,
        totalCents: newTotal,
        reason: "weigh_in_reconciliation",
        createdAt: new Date(),
      })
      .run();
    db.update(orders)
      .set({ totalCents: newTotal })
      .where(eq(orders.id, order.id))
      .run();
  }

  return NextResponse.json({
    code: order.code,
    actualWeightKg,
    deltaCents: delta,
    reconciled: needsReconciliation,
    newTotalCents: needsReconciliation ? newTotal : order.totalCents,
  });
}
