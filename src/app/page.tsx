"use client";

import { motion, useReducedMotion } from "motion/react";
import useDepartures from "@/components/useDepartures";
import { QuoteWidget } from "@/components/QuoteWidget";
import { HeroScene } from "@/components/motion/HeroScene";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { useLocale, useT, type DictKey } from "@/lib/i18n";
import {
  PencilLine,
  Truck,
  Radar,
  Ship,
  CalendarDays,
  MessageCircle,
  Quote,
  Car,
  Bike,
  WashingMachine,
  Sofa,
  Package,
  ShoppingBag,
  Tv,
  Grid3x3,
  Boxes,
  Sparkles,
} from "lucide-react";

const GOODS: Array<[typeof Car, DictKey]> = [
  [Car, "g_cars"],
  [Bike, "g_motos"],
  [WashingMachine, "g_appliances"],
  [Sofa, "g_furniture"],
  [Package, "g_boxes"],
  [ShoppingBag, "g_bags"],
  [Tv, "g_tv"],
  [Grid3x3, "g_tiles"],
  [Boxes, "g_pallets"],
  [Sparkles, "g_more"],
];

/** Gentle gold breathing ring on the nearest departure — urgency without countdown theater. */
function NextDeparturePulse() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-gold"
      animate={{ opacity: [0.55, 0.12, 0.55], scale: [1, 1.012, 1] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function Landing() {
  const t = useT();
  const { locale } = useLocale();
  const departures = useDepartures();

  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      weekday: "short",
      day: "numeric",
      month: "long",
    });

  const nextMonth =
    departures[0] &&
    new Date(departures[0].departsAt).toLocaleDateString(
      locale === "fr" ? "fr-FR" : "en-GB",
      { month: "long", year: "numeric" }
    );

  return (
    <div>
      {/* Hero — instant quote, price before personal details */}
      <section className="bg-gradient-to-b from-white to-surface border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-gold text-on-gold px-4 py-1.5 text-sm font-bold">
              <CalendarDays className="w-4 h-4" aria-hidden />
              {t("next_departure_label")} :{" "}
              <span className="uppercase">
                {nextMonth ?? t("next_departure_soon")}
              </span>
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-primary leading-[1.05]">
              {t("hero_title")}
            </h1>
            <p className="mt-5 text-lg text-muted max-w-lg">{t("hero_sub")}</p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5 font-medium">
                <Ship className="w-4 h-4 text-accent" aria-hidden />
                Bischwiller → Douala (Akwa)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5 font-medium">
                <Car className="w-4 h-4 text-primary" aria-hidden />
                {locale === "fr" ? "Du carton à la voiture" : "From a box to a car"}
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

      {/* The groupage story — flagship animated scene */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal className="text-center">
          <h2 className="text-3xl font-black tracking-tight text-primary">
            {t("journey_title")}
          </h2>
          <p className="mt-2 text-muted max-w-2xl mx-auto">{t("journey_sub")}</p>
        </Reveal>
        <Reveal delay={0.15} className="mt-6 rounded-3xl bg-white border border-border overflow-hidden">
          <HeroScene />
        </Reveal>
      </section>

      {/* Goods we transport */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <Reveal>
          <h2 className="text-3xl font-black tracking-tight text-primary text-center">
            {t("goods_title")}
          </h2>
        </Reveal>
        <StaggerGroup className="mt-8 flex flex-wrap justify-center gap-3" stagger={0.06}>
          {GOODS.map(([Icon, key]) => (
            <StaggerItem key={key}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white border border-border px-4 py-2.5 text-sm font-semibold hover:border-accent transition-colors">
                <Icon className="w-4 h-4 text-accent" aria-hidden />
                {t(key)}
              </span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 pb-16">
        <Reveal>
          <h2 className="text-3xl font-black tracking-tight text-primary text-center">
            {t("how_title")}
          </h2>
        </Reveal>
        <StaggerGroup className="mt-10 grid sm:grid-cols-3 gap-6">
          {(
            [
              [PencilLine, "how_1_t", "how_1_d"],
              [Truck, "how_2_t", "how_2_d"],
              [Radar, "how_3_t", "how_3_d"],
            ] as const
          ).map(([Icon, titleKey, descKey]) => (
            <StaggerItem key={titleKey}>
              <div className="h-full rounded-2xl bg-white border border-border p-6 hover:shadow-lg hover:shadow-blue-900/5 transition-shadow">
                <div className="w-11 h-11 rounded-xl bg-surface flex items-center justify-center">
                  <Icon className="w-5 h-5 text-accent" aria-hidden />
                </div>
                <h3 className="mt-4 font-bold text-lg text-primary">{t(titleKey)}</h3>
                <p className="mt-1.5 text-sm text-muted">{t(descKey)}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* Consolidation calendar */}
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-gold" aria-hidden />
            <h2 className="text-3xl font-black tracking-tight">{t("cal_title")}</h2>
          </div>
          <p className="mt-2 text-blue-200">{t("cal_sub")}</p>
          <StaggerGroup className="mt-8 grid sm:grid-cols-3 gap-4">
            {departures.map((d, i) => (
              <StaggerItem key={d.id}>
              <div
                className={`relative rounded-2xl bg-white/10 border p-5 ${
                  i === 0 ? "border-gold/70" : "border-white/15"
                }`}
              >
                {i === 0 && <NextDeparturePulse />}
                <p className="font-bold text-lg text-gold">{d.label}</p>
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
              </StaggerItem>
            ))}
            {departures.length === 0 && (
              <p className="text-blue-200 text-sm col-span-3">…</p>
            )}
          </StaggerGroup>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <Reveal>
          <h2 className="text-3xl font-black tracking-tight text-primary text-center">
            {t("trust_title")}
          </h2>
        </Reveal>
        <StaggerGroup className="mt-10 grid sm:grid-cols-3 gap-6">
          {[
            {
              name: "Marie N.",
              route: "Bischwiller → Douala",
              fr: "Mon réfrigérateur et mes cartons sont arrivés intacts. Les messages WhatsApp à chaque étape m'ont vraiment rassurée.",
              en: "My fridge and boxes arrived intact. The WhatsApp updates at every step really reassured me.",
            },
            {
              name: "Serge T.",
              route: "Haguenau → Douala",
              fr: "J'ai envoyé une moto et deux palettes. L'enlèvement à domicile m'a évité la logistique. Prix annoncé, prix payé.",
              en: "I sent a motorcycle and two pallets. Home pickup saved me the logistics. The price quoted was the price paid.",
            },
            {
              name: "Aïcha B.",
              route: "Strasbourg → Douala",
              fr: "Ma mère a reçu le colis à Akwa. Elle a pu suivre la livraison en direct, incroyable.",
              en: "My mother received the parcel in Akwa. She could follow the delivery live — incredible.",
            },
          ].map((tm) => (
            <StaggerItem key={tm.name}>
              <figure className="h-full rounded-2xl bg-white border border-border p-6">
                <Quote className="w-6 h-6 text-accent" aria-hidden />
                <blockquote className="mt-3 text-sm text-foreground">
                  {locale === "fr" ? tm.fr : tm.en}
                </blockquote>
                <figcaption className="mt-4 text-sm">
                  <span className="font-bold text-primary">{tm.name}</span>
                  <span className="text-muted"> · {tm.route}</span>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-8">
        <Reveal>
          <h2 className="text-3xl font-black tracking-tight text-primary text-center">
            {t("faq_title")}
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 space-y-3">
          {[
            {
              qFr: "Que puis-je envoyer ?",
              aFr: "Voitures, motos, gros et petits électroménagers, meubles, cartons, sacs badjock, TV, carreaux, palettes et bien plus — du simple colis à la marchandise volumineuse.",
              qEn: "What can I send?",
              aEn: "Cars, motorcycles, large and small appliances, furniture, boxes, badjock bags, TVs, tiles, pallets and much more — from a single parcel to bulky cargo.",
            },
            {
              qFr: "Combien de temps dure le transport ?",
              aFr: "Par groupage maritime, comptez 4 à 8 semaines porte à porte selon la date de départ du conteneur et le dédouanement à Douala.",
              qEn: "How long does shipping take?",
              aEn: "By sea groupage, allow 4–8 weeks door to door depending on the container departure date and customs clearance in Douala.",
            },
            {
              qFr: "Comment est calculé le prix ?",
              aFr: "Conditionnement selon le type de marchandise + fret au poids ou au volume (le plus élevé des deux, comme tout groupage). Le prix est confirmé au pesage à notre terminal — s'il change de plus de 15 %, nous vous prévenons avant l'expédition.",
              qEn: "How is the price calculated?",
              aEn: "Conditioning by cargo type + freight by weight or volume (whichever is greater, as in all groupage). The price is confirmed at our terminal weigh-in — if it changes by more than 15%, we tell you before shipping.",
            },
            {
              qFr: "Qui livre au Cameroun ?",
              aFr: "SN Groupage Solutions gère votre envoi de bout en bout, avec notre agent local à Douala (Akwa). Un seul interlocuteur : nous.",
              qEn: "Who delivers in Cameroon?",
              aEn: "SN Groupage Solutions handles your shipment end to end, with our local agent in Douala (Akwa). One single point of contact: us.",
            },
          ].map((f) => (
            <details
              key={f.qFr}
              className="group rounded-xl bg-white border border-border px-5 py-4"
            >
              <summary className="font-semibold text-sm list-none flex justify-between items-center text-primary">
                {locale === "fr" ? f.qFr : f.qEn}
                <span className="text-accent group-open:rotate-45 transition-transform text-lg leading-none">
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted">
                {locale === "fr" ? f.aFr : f.aEn}
              </p>
            </details>
          ))}
        </Reveal>
      </section>
    </div>
  );
}
