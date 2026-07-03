"use client";

import useSWRLikeDepartures from "@/components/useDepartures";
import { QuoteWidget } from "@/components/QuoteWidget";
import { useLocale, useT } from "@/lib/i18n";
import {
  PencilLine,
  Truck,
  Radar,
  Ship,
  CalendarDays,
  ShieldCheck,
  MessageCircle,
  Quote,
} from "lucide-react";

export default function Landing() {
  const t = useT();
  const { locale } = useLocale();
  const departures = useSWRLikeDepartures();

  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
    });

  return (
    <div>
      {/* Hero — instant quote, price before personal details */}
      <section className="bg-gradient-to-b from-white to-surface border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-primary-dark leading-[1.05]">
              {t("hero_title")}
            </h1>
            <p className="mt-5 text-lg text-muted max-w-lg">{t("hero_sub")}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5 font-medium">
                <Ship className="w-4 h-4 text-primary" aria-hidden />
                Strasbourg → Douala · Yaoundé
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-success" aria-hidden />
                {locale === "fr" ? "Pesée et emballage inclus" : "Weighing & packing included"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5 font-medium">
                <MessageCircle className="w-4 h-4 text-success" aria-hidden />
                {locale === "fr" ? "Suivi WhatsApp" : "WhatsApp updates"}
              </span>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <QuoteWidget />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-black tracking-tight text-primary-dark text-center">
          {t("how_title")}
        </h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-6">
          {(
            [
              [PencilLine, "how_1_t", "how_1_d"],
              [Truck, "how_2_t", "how_2_d"],
              [Radar, "how_3_t", "how_3_d"],
            ] as const
          ).map(([Icon, titleKey, descKey]) => (
            <div
              key={titleKey}
              className="rounded-2xl bg-white border border-border p-6 hover:shadow-lg hover:shadow-blue-900/5 transition-shadow"
            >
              <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" aria-hidden />
              </div>
              <h3 className="mt-4 font-bold text-lg">{t(titleKey)}</h3>
              <p className="mt-1.5 text-sm text-muted">{t(descKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Consolidation calendar — operational reality as a trust signal */}
      <section className="bg-primary-dark text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-accent" aria-hidden />
            <h2 className="text-3xl font-black tracking-tight">{t("cal_title")}</h2>
          </div>
          <p className="mt-2 text-blue-200">{t("cal_sub")}</p>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {departures.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl bg-white/10 border border-white/15 p-5"
              >
                <p className="font-bold text-lg">{d.label}</p>
                <p className="mt-2 text-sm text-blue-200">
                  {t("wiz_departs")} {d.port} :{" "}
                  <span className="text-white font-semibold">{fmt(d.departsAt)}</span>
                </p>
                <p className="text-sm text-blue-200">
                  {t("wiz_cutoff")} :{" "}
                  <span className="text-white font-semibold">{fmt(d.cutoffAt)}</span>
                </p>
                <p className="text-sm text-blue-200">
                  {t("wiz_eta")} :{" "}
                  <span className="text-white font-semibold">{fmt(d.etaDouala)}</span>
                </p>
              </div>
            ))}
            {departures.length === 0 && (
              <p className="text-blue-200 text-sm col-span-3">…</p>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials — names + city pairs, per diaspora trust research */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-black tracking-tight text-primary-dark text-center">
          {t("trust_title")}
        </h2>
        <div className="mt-10 grid sm:grid-cols-3 gap-6">
          {[
            {
              name: "Marie N.",
              route: "Strasbourg → Douala",
              fr: "Le carton est arrivé complet, rien ne manquait. Les messages WhatsApp à chaque étape m'ont vraiment rassurée.",
              en: "The box arrived complete, nothing missing. The WhatsApp updates at every step really reassured me.",
            },
            {
              name: "Serge T.",
              route: "Colmar → Yaoundé",
              fr: "L'enlèvement à domicile m'a évité deux heures de route. Prix annoncé, prix payé.",
              en: "Home pickup saved me a two-hour drive. The price quoted was the price paid.",
            },
            {
              name: "Aïcha B.",
              route: "Mulhouse → Douala",
              fr: "Ma mère a reçu le colis à Bonabéri. Elle a pu suivre le camion de livraison, incroyable.",
              en: "My mother received the parcel in Bonabéri. She could follow the delivery — incredible.",
            },
          ].map((tm) => (
            <figure
              key={tm.name}
              className="rounded-2xl bg-white border border-border p-6"
            >
              <Quote className="w-6 h-6 text-accent" aria-hidden />
              <blockquote className="mt-3 text-sm text-foreground">
                {locale === "fr" ? tm.fr : tm.en}
              </blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-bold">{tm.name}</span>
                <span className="text-muted"> · {tm.route}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-8">
        <h2 className="text-3xl font-black tracking-tight text-primary-dark text-center">
          {t("faq_title")}
        </h2>
        <div className="mt-8 space-y-3">
          {[
            {
              qFr: "Combien de temps dure le transport ?",
              aFr: "Par voie maritime, comptez 4 à 8 semaines porte à porte selon la date de départ du conteneur et le dédouanement à Douala.",
              qEn: "How long does shipping take?",
              aEn: "By sea, allow 4–8 weeks door to door depending on the container departure date and customs clearance in Douala.",
            },
            {
              qFr: "Comment est calculé le prix ?",
              aFr: "Emballage selon notre grille tarifaire + transport au poids. Le prix est confirmé au pesage à l'entrepôt — s'il change de plus de 15 %, nous vous prévenons avant l'expédition.",
              qEn: "How is the price calculated?",
              aEn: "Packaging from our price chart + shipping by weight. The price is confirmed at warehouse weigh-in — if it changes by more than 15%, we tell you before shipping.",
            },
            {
              qFr: "Qui livre au Cameroun ?",
              aFr: "CamFret gère votre colis de bout en bout, avec notre agent local à Douala et Yaoundé. Un seul interlocuteur : nous.",
              qEn: "Who delivers in Cameroon?",
              aEn: "CamFret handles your parcel end to end, with our local agent in Douala and Yaoundé. One single point of contact: us.",
            },
            {
              qFr: "Que ne puis-je pas envoyer ?",
              aFr: "Produits inflammables, batteries au lithium seules, denrées périssables, espèces et objets interdits par la douane camerounaise.",
              qEn: "What can't I send?",
              aEn: "Flammable goods, standalone lithium batteries, perishables, cash, and items prohibited by Cameroonian customs.",
            },
          ].map((f) => (
            <details
              key={f.qFr}
              className="group rounded-xl bg-white border border-border px-5 py-4"
            >
              <summary className="font-semibold text-sm list-none flex justify-between items-center">
                {locale === "fr" ? f.qFr : f.qEn}
                <span className="text-muted group-open:rotate-45 transition-transform text-lg leading-none">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted">
                {locale === "fr" ? f.aFr : f.aEn}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
