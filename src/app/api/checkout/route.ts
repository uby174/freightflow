import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { getStripeKey } from "@/lib/secrets";
import { getTenant } from "@/tenant";

// Stripe Checkout (test mode in the demo). Optional: without STRIPE_SECRET_KEY the
// booking flow stays pay-at-terminal. The amount is the order total already pinned
// by the deterministic engine — never recomputed here.
export const dynamic = "force-dynamic";

function siteUrl(req: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
}

export async function GET() {
  return NextResponse.json({ available: Boolean(getStripeKey()) });
}

export async function POST(req: NextRequest) {
  const key = getStripeKey();
  if (!key) return NextResponse.json({ available: false });
  const parsed = z
    .object({ code: z.string().min(5).max(20) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const code = parsed.data.code.trim().toUpperCase();
  const order = db.select().from(orders).where(eq(orders.code, code)).get();
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.paymentStatus === "paid") return NextResponse.json({ error: "already_paid" }, { status: 409 });

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(key);
  const base = siteUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: order.totalCents,
          product_data: { name: getTenant().name + " — " + order.code },
        },
      },
    ],
    success_url: base + "/book/success?code=" + order.code + "&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: base + "/track/" + order.code,
    metadata: { code: order.code },
  });
  db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, order.id)).run();
  return NextResponse.json({ available: true, url: session.url });
}
