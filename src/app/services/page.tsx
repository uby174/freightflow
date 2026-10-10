"use client";

import Link from "next/link";
import { Ship, Truck, Car, Radar, ShieldCheck, Sparkles, Package } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { getTenant, tenantVars } from "@/tenant";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export default function ServicesPage() {
  const { locale } = useLocale();
  const fr = locale === "fr";
  const T = getTenant();
  const V = tenantVars(locale);

  const services = [
    {
      Icon: Ship,
      t: fr ? "Groupage maritime" : "Sea groupage",
      d: fr
        ? `Vos colis voyagent dans un conteneur partagé ${V.portFrom} vers ${V.destCountryArt}. Vous ne payez que votre volume : ${V.ratePerM3} €/m³, règle ${V.kgPerM3} kg = 1 m³. Transit ${V.transitMin}–${V.transitMax} semaines porte à porte.`
        : `Your goods travel in a shared container from ${V.port} to ${V.destCountry}. You pay only for your volume: €${V.ratePerM3}/m³, ${V.kgPerM3} kg = 1 m³ rule. Transit ${V.transitMin}–${V.transitMax} weeks door to door.`,
    },
    {
      Icon: Car,
      t: fr ? "Véhicules" : "Vehicles",
      d: fr
        ? "Voitures, utilitaires, motos et scooters au forfait, prix affiché à l'avance. Nous gérons le chargement et le dédouanement à l'arrivée."
        : "Cars, vans, motorcycles and scooters at a flat rate, shown upfront. We handle loading and customs on arrival.",
    },
    {
      Icon: Truck,
      t: fr ? "Enlèvement à domicile" : "Home pickup",
      d: fr
        ? `${V.pickupBase} + ${V.pickupPerKm}/km depuis notre terminal de ${V.terminalCity} (jusqu'à ${V.pickupMaxKm} km). Dépôt au terminal gratuit.`
        : `${V.pickupBase} + ${V.pickupPerKm}/km from our ${V.terminalCity} terminal (up to ${V.pickupMaxKm} km). Terminal drop-off is free.`,
    },
    {
      Icon: Package,
      t: fr ? "Pesée & conditionnement" : "Weighing & conditioning",
      d: fr
        ? "Chaque envoi est pesé et conditionné à notre terminal. Si le poids réel change votre prix de plus de 15 %, nous vous prévenons avant le départ — jamais de surprise."
        : "Every shipment is weighed and conditioned at our terminal. If the actual weight changes your price by more than 15%, we tell you before departure — never a surprise.",
    },
    {
      Icon: Radar,
      t: fr ? "Suivi de bout en bout" : "End-to-end tracking",
      d: fr
        ? `Un numéro ${V.prefix}-AAAA-XXXXXX unique, une page de suivi claire et des nouvelles sur WhatsApp à chaque étape : terminal, conteneur, mer, port, douane, livraison.`
        : `One ${V.prefix}-YYYY-XXXXXX number, a clear tracking page and WhatsApp updates at every step: terminal, container, sea, port, customs, delivery.`,
    },
    {
      Icon: Sparkles,
      t: fr ? "Assistant IA fiable" : "Trustworthy AI assistant",
      d: fr
        ? "L'assistant reconnaît vos articles et répond à vos questions, mais il n'invente jamais un prix : chaque montant vient de notre grille, identique pour tous."
        : "The assistant recognises your items and answers questions, but never invents a price: every figure comes from our rate card, identical for everyone.",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Reveal>
        <h1 className="text-4xl font-black tracking-tight text-primary">
          {fr ? "Nos services" : "Our services"}
        </h1>
        <p className="mt-2 text-muted max-w-2xl">
          {fr
            ? `${T.name} — ${V.origin} → ${V.destCountry} (${V.destCitiesDash}). Du carton à la voiture, un seul interlocuteur.`
            : `${T.name} — ${V.origin} → ${V.destCountry} (${V.destCitiesDash}). From a box to a car, one point of contact.`}
        </p>
      </Reveal>

      <StaggerGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <StaggerItem key={s.t}>
            <div className="h-full rounded-2xl bg-white border border-border p-6">
              <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center">
                <s.Icon className="w-5 h-5 text-accent" aria-hidden />
              </div>
              <h2 className="mt-4 font-bold text-lg text-primary">{s.t}</h2>
              <p className="mt-1.5 text-sm text-muted">{s.d}</p>
            </div>
          </StaggerItem>
        ))}
      </StaggerGroup>

      <Reveal className="mt-12 rounded-2xl bg-primary text-white p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="flex items-center gap-2 font-black text-xl">
            <ShieldCheck className="w-6 h-6 text-gold" aria-hidden />
            {fr ? "Prix annoncé, prix payé." : "Price quoted, price paid."}
          </p>
          <p className="mt-1 text-white/80 text-sm">
            {fr ? "Estimation instantanée, sans engagement." : "Instant estimate, no commitment."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/tarifs" className="rounded-xl border border-white/30 px-5 py-2.5 font-semibold hover:bg-white/10 transition-colors">
            {fr ? "Voir les tarifs" : "See rates"}
          </Link>
          <Link href="/book" className="rounded-xl bg-accent hover:bg-accent-dark px-5 py-2.5 font-bold transition-colors">
            {fr ? "Réserver" : "Book"}
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
