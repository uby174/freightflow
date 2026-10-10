"use client";

import Link from "next/link";
import { Ship, Truck, Car, Info } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { getTenant, tenantVars } from "@/tenant";
import { Reveal } from "@/components/motion/Reveal";
import type { CatalogItem, ItemClass } from "@/lib/catalog/base";

const CLASS_LABEL: Record<ItemClass, { fr: string; en: string }> = {
  parcel: { fr: "Cartons", en: "Boxes" },
  bag: { fr: "Sacs & valises", en: "Bags & suitcases" },
  tv: { fr: "Télévisions", en: "TVs" },
  tiles: { fr: "Carreaux", en: "Tiles" },
  appliance_small: { fr: "Petit électroménager", en: "Small appliances" },
  appliance_large: { fr: "Gros électroménager", en: "Large appliances" },
  furniture: { fr: "Meubles", en: "Furniture" },
  pallet: { fr: "Palettes", en: "Pallets" },
  vehicle_moto: { fr: "Deux-roues", en: "Two-wheelers" },
  vehicle_car: { fr: "Véhicules", en: "Vehicles" },
  other: { fr: "Divers", en: "Other" },
};
const ORDER: ItemClass[] = ["parcel", "bag", "tv", "appliance_small", "appliance_large", "furniture", "tiles", "pallet", "other", "vehicle_moto", "vehicle_car"];

const euro = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Unit price straight from the same rule the quote engine uses (no per-order floor). */
function unitCents(item: CatalogItem, perM3: number, kgPerM3: number) {
  if (item.flatPriceCents != null) return item.flatPriceCents;
  const vol = (item.lengthCm * item.widthCm * item.heightCm) / 1_000_000;
  return Math.round(Math.max(vol, item.weightKg / kgPerM3) * perM3);
}

export default function RatesPage() {
  const { locale } = useLocale();
  const fr = locale === "fr";
  const T = getTenant();
  const V = tenantVars(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <h1 className="text-4xl font-black tracking-tight text-primary">
          {fr ? "Grille tarifaire" : "Rate card"}
        </h1>
        <p className="mt-2 text-muted max-w-2xl">
          {fr
            ? "Des prix fixes et publics. Le même article coûte toujours le même prix — c'est la règle."
            : "Fixed, public prices. The same item always costs the same — that's the rule."}
        </p>
      </Reveal>

      {/* Lanes */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {T.lanes.map((lane) => (
          <Reveal key={lane.id} className="rounded-2xl bg-primary text-white p-6">
            <p className="flex items-center gap-2 font-bold text-lg">
              <Ship className="w-5 h-5 text-gold" aria-hidden />
              {lane.originRegion} → {lane.destCountry[locale]}
            </p>
            <p className="mt-1 text-sm text-white/80">
              {lane.terminal.city} · {lane.port} → {lane.destCities.slice(0, 2).join(" · ")}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-white/70">{fr ? "Groupage" : "Groupage"}</p>
                <p className="font-black text-xl text-gold">{lane.rate.perM3Cents / 100} €/m³</p>
              </div>
              <div>
                <p className="text-white/70">{fr ? "Règle" : "Rule"}</p>
                <p className="font-bold">{lane.rate.kgPerM3} kg = 1 m³</p>
              </div>
              <div>
                <p className="text-white/70">{fr ? "Transit" : "Transit"}</p>
                <p className="font-bold">{lane.transitWeeks[0]}–{lane.transitWeeks[1]} {fr ? "sem." : "wks"}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/70">
              {fr ? "Minimum" : "Minimum"} {lane.rate.minFreightCents / 100} € {fr ? "par envoi" : "per shipment"}
            </p>
          </Reveal>
        ))}
        <Reveal className="rounded-2xl bg-white border border-border p-6">
          <p className="flex items-center gap-2 font-bold text-lg text-primary">
            <Truck className="w-5 h-5 text-accent" aria-hidden />
            {fr ? "Enlèvement à domicile" : "Home pickup"}
          </p>
          <p className="mt-2 text-sm text-muted">
            {V.pickupBase} + {V.pickupPerKm}/km {fr ? "depuis notre terminal de" : "from our terminal in"} {V.terminalCity}.{" "}
            {fr ? `Jusqu'à ${V.pickupMaxKm} km.` : `Up to ${V.pickupMaxKm} km.`}{" "}
            {fr ? "Dépôt au terminal gratuit." : "Terminal drop-off is free."}
          </p>
        </Reveal>
      </div>

      {/* Catalog */}
      <p className="mt-10 flex items-start gap-2 text-sm text-muted">
        <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
        {fr
          ? "Prix unitaire = max(volume, poids ÷ règle) × tarif au m³. Les véhicules sont au forfait. Le minimum par envoi s'applique au total."
          : "Unit price = max(volume, weight ÷ rule) × rate per m³. Vehicles are flat-rated. The per-shipment minimum applies to the total."}
      </p>
      {ORDER.map((cls) => {
        const items = T.catalog.filter((c) => c.class === cls);
        if (!items.length) return null;
        const lane = T.lanes[0];
        return (
          <Reveal key={cls} className="mt-8">
            <h2 className="flex items-center gap-2 text-xl font-black text-primary">
              {cls.startsWith("vehicle") && <Car className="w-5 h-5 text-accent" aria-hidden />}
              {CLASS_LABEL[cls][locale]}
            </h2>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="px-4 py-2.5 font-semibold">{fr ? "Article" : "Item"}</th>
                    <th className="px-4 py-2.5 font-semibold">{fr ? "Dimensions" : "Size"}</th>
                    <th className="px-4 py-2.5 font-semibold">{fr ? "Poids" : "Weight"}</th>
                    <th className="px-4 py-2.5 font-semibold text-right">{fr ? "Prix" : "Price"}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-medium">{fr ? it.labelFr : it.labelEn}</td>
                      <td className="px-4 py-2.5 text-muted">{it.lengthCm}×{it.widthCm}×{it.heightCm} cm</td>
                      <td className="px-4 py-2.5 text-muted">{it.weightKg} kg</td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary">
                        {euro(unitCents(it, lane.rate.perM3Cents, lane.rate.kgPerM3))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        );
      })}

      <div className="mt-12 text-center">
        <Link href="/book" className="inline-block rounded-xl bg-accent hover:bg-accent-dark text-white font-bold px-8 py-3 transition-colors">
          {fr ? "Obtenir mon devis" : "Get my quote"}
        </Link>
      </div>
    </div>
  );
}
