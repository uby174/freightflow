import { desc, eq } from "drizzle-orm";
import { db, orders, parcels, carrierShipments } from "@/db";
import { WeighInForm } from "@/components/WeighInForm";

export const dynamic = "force-dynamic";

// Internal ops page (NOT linked from customer UI). This is the ONLY place the
// partner mapping is visible — protect behind auth before any real deployment.
export default function AdminPage() {
  const rows = db
    .select({
      id: orders.id,
      code: orders.code,
      status: orders.status,
      mode: orders.mode,
      totalCents: orders.totalCents,
      senderName: orders.senderName,
      receiverCity: orders.receiverCity,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(50)
    .all();

  const detail = rows.map((o) => {
    const parcel = db
      .select()
      .from(parcels)
      .where(eq(parcels.orderId, o.id))
      .get();
    const shipment = db
      .select({
        carrierName: carrierShipments.carrierName,
        carrierTrackingNumber: carrierShipments.carrierTrackingNumber,
      })
      .from(carrierShipments)
      .where(eq(carrierShipments.orderId, o.id))
      .get();
    return { ...o, parcel, shipment };
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-black text-primary-dark">
        Entrepôt — Ops CamFret
      </h1>
      <p className="text-sm text-muted mt-1">
        Pesée, réconciliation et mapping transporteur (interne uniquement).
      </p>

      <div className="mt-6">
        <WeighInForm />
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-4 py-3 font-semibold">Colis</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Expéditeur</th>
              <th className="px-4 py-3 font-semibold">Destination</th>
              <th className="px-4 py-3 font-semibold">Est. / Réel (kg)</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Partenaire (interne)</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((o) => (
              <tr key={o.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-mono font-semibold">{o.code}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3">{o.senderName}</td>
                <td className="px-4 py-3">{o.receiverCity}</td>
                <td className="px-4 py-3">
                  {o.parcel?.estWeightKg ?? "—"} /{" "}
                  {o.parcel?.actualWeightKg ?? "—"}
                  {o.parcel?.priceDeltaCents ? (
                    <span
                      className={
                        o.parcel.priceDeltaCents > 0
                          ? "text-destructive"
                          : "text-success"
                      }
                    >
                      {" "}
                      ({o.parcel.priceDeltaCents > 0 ? "+" : ""}
                      {(o.parcel.priceDeltaCents / 100).toFixed(2)} €)
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {(o.totalCents / 100).toFixed(2)} €
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {o.shipment
                    ? `${o.shipment.carrierName} · ${o.shipment.carrierTrackingNumber}`
                    : "—"}
                </td>
              </tr>
            ))}
            {detail.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Aucune commande pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
