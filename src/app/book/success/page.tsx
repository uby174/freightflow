import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, orders } from "@/db";
import { getStripeKey } from "@/lib/secrets";

export const dynamic = "force-dynamic";

// Stripe return URL. We verify the session server-side before marking the order
// paid — the query string alone is never trusted.
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session_id?: string }>;
}) {
  const { code, session_id } = await searchParams;
  const upper = (code ?? "").toUpperCase();
  let paid = false;
  const key = getStripeKey();
  if (upper && session_id && key) {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(session_id).catch(() => null);
    if (session && session.payment_status === "paid" && session.metadata?.code === upper) {
      db.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.code, upper)).run();
      paid = true;
    }
  }
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-3xl font-black text-primary">
        {paid ? "Paiement confirmé" : "Paiement non confirmé"}
      </h1>
      <p className="mt-2 text-muted text-sm">
        {paid ? "Payment confirmed." : "Payment not confirmed."} {upper}
      </p>
      {upper && (
        <Link
          href={"/track/" + upper}
          className="mt-8 inline-block rounded-xl bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 transition-colors"
        >
          Suivre mon envoi · Track my shipment
        </Link>
      )}
    </div>
  );
}
