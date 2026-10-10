import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db, orders, parcels, quotes } from "@/db";
import { priceQuote } from "@/lib/pricing";
import {
  RECONCILE_MIN_CENTS,
  RECONCILE_PCT,
  SEA_RATE_PER_M3_CENTS,
  VOLUMETRIC_KG_PER_M3,
  MIN_FREIGHT_CENTS,
} from "@/lib/config";
import type { MatchLine } from "@/lib/catalog/match";
import { checkAdminToken } from "@/lib/secrets";

const bodySchema = z.object({
  code: z.string().min(5),
  actualWeightKg: z.number().min(0.1).max(30000),
});

// Terminal weigh-in. The QUOTED price for a selection is always identical; this
// is the separate, disclosed reconciliation layer. The catalog gives an honest
// volumetric estimate; the terminal scale is ground truth. If actual weight
// pushes the volumetric charge (weight/200) past the quoted figure by >15%, we
// version a new quote for staff to notify the customer — never a silent reprice.
export async function POST(req: NextRequest) {
  if (!checkAdminToken(req.headers.get("x-admin-token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
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

  // Re-price from the PINNED lines (never re-classify) so the baseline equals
  // exactly what the customer was quoted.
  const lines: MatchLine[] = order.linesJson
    ? (JSON.parse(order.linesJson) as MatchLine[])
    : [];
  const base = priceQuote(lines);

  // Actual chargeable volume: catalog volume is fixed; only weight can rise.
  const hasGroupage = base.freightCents > 0;
  const actualChargeableM3 = Math.max(
    base.totalVolumeM3,
    actualWeightKg / VOLUMETRIC_KG_PER_M3
  );
  const newFreight = hasGroupage
    ? Math.max(
        Math.round(actualChargeableM3 * SEA_RATE_PER_M3_CENTS),
        MIN_FREIGHT_CENTS
      )
    : 0;
  const newGoods = newFreight + base.vehicleCents;
  const newTotal = newGoods + order.pickupCents;
  const delta = newTotal - order.totalCents;

  if (parcel) {
    db.update(parcels)
      .set({ actualWeightKg, weighedAt: new Date(), priceDeltaCents: delta })
      .where(eq(parcels.id, parcel.id))
      .run();
  }

  const needsReconciliation =
    Math.abs(delta) >= RECONCILE_MIN_CENTS &&
    Math.abs(delta) / Math.max(order.totalCents, 1) >= RECONCILE_PCT;

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
        packagingCents: 0,
        shippingCents: newGoods,
        pickupCents: order.pickupCents,
        totalCents: newTotal,
        reason: "weigh_in_reconciliation",
        createdAt: new Date(),
      })
      .run();
    db.update(orders)
      .set({ totalCents: newTotal, shippingCents: newGoods })
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
