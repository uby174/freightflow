"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Locale } from "@/lib/i18n";
import { bookingLane, tenantVars, interpolate } from "@/tenant";

// Diaspora trust is built peer-to-peer on WhatsApp already — mirroring that
// exact visual language makes testimonials read as real word-of-mouth.
const MESSAGES: Array<{
  name: string;
  route: string;
  color: string;
  time: string;
  fr: string;
  en: string;
}> = [
  {
    name: "Marie N.",
    route: "{origin} → {primaryCity}",
    color: "#c1533f",
    time: "09:24",
    fr: "Mon réfrigérateur et mes cartons sont arrivés intacts 🙏 Les messages à chaque étape m'ont vraiment rassurée. Merci !",
    en: "My fridge and boxes arrived intact 🙏 The updates at every step really reassured me. Thank you!",
  },
  {
    name: "Serge T.",
    route: "{origin} → {secondCity}",
    color: "#1f7aec",
    time: "14:02",
    fr: "J'ai envoyé une moto et deux palettes. L'enlèvement à domicile m'a évité toute la logistique. Prix annoncé = prix payé 👌",
    en: "I sent a motorcycle and two pallets. Home pickup saved me all the logistics. Price quoted = price paid 👌",
  },
  {
    name: "Aïcha B.",
    route: "{origin} → {primaryCity}",
    color: "#8a4fbf",
    time: "hier",
    fr: "Ma mère a reçu le colis à {primaryCity} 😍 Elle a pu suivre la livraison en direct, incroyable. Je recommande à toute la diaspora.",
    en: "My mother received the parcel in {primaryCity} 😍 She could follow the delivery live — incredible. I recommend it to the whole diaspora.",
  },
];

function ReadTicks({ animate }: { animate: boolean }) {
  const reduce = useReducedMotion();
  const active = animate && !reduce;
  return (
    <motion.svg
      viewBox="0 0 18 12"
      className="inline-block w-[15px] h-[10px] ml-1 align-middle"
      initial={false}
      animate={{ color: active ? "#53bdeb" : reduce ? "#53bdeb" : "#8696a0" }}
      transition={{ duration: 0.3, delay: reduce ? 0 : 0.55 }}
      style={{ color: reduce ? "#53bdeb" : "#8696a0" }}
      aria-hidden
    >
      <path
        d="M1 6.5 L4.5 10 L11 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <motion.path
        d="M6.5 6.5 L10 10 L16.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: active ? 1 : reduce ? 1 : 0 }}
        transition={{ duration: 0.25, delay: reduce ? 0 : 0.4 }}
      />
    </motion.svg>
  );
}

export function WhatsAppTestimonials({ locale }: { locale: Locale }) {
  const reduce = useReducedMotion();
  const lane = bookingLane();
  const V: Record<string, string> = { ...tenantVars(locale), secondCity: lane.destCities[1] ?? lane.destCities[0] };
  return (
    <div className="mx-auto mt-8 max-w-md rounded-3xl overflow-hidden border border-border shadow-lg shadow-blue-900/5">
      {/* WhatsApp-style header */}
      <div className="flex items-center gap-3 bg-[#008069] px-4 py-3 text-white">
        <span className="grid place-items-center w-9 h-9 rounded-full bg-white/20 font-black text-sm">
          SN
        </span>
        <div className="leading-tight">
          <p className="font-semibold text-sm">
            {locale === "fr" ? "Avis de nos clients" : "Our customers"}
          </p>
          <p className="text-[11px] text-white/80">
            {locale === "fr" ? `diaspora · ${V.destCountry}` : `${V.destCountry} diaspora`}
          </p>
        </div>
      </div>

      {/* Chat wallpaper */}
      <div
        className="px-3 py-4 space-y-2.5"
        style={{
          backgroundColor: "#efeae2",
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.035) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {MESSAGES.map((m, i) => (
          <motion.div
            key={m.name}
            className="flex"
            initial={{ opacity: 0, y: reduce ? 0 : 12, scale: reduce ? 1 : 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
              delay: reduce ? 0 : i * 0.35,
            }}
          >
            <div className="relative max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm">
              {/* bubble tail */}
              <span
                className="absolute -left-1.5 top-0 w-0 h-0"
                style={{
                  borderTop: "8px solid #ffffff",
                  borderLeft: "8px solid transparent",
                }}
                aria-hidden
              />
              <p className="text-[13px] font-bold" style={{ color: m.color }}>
                {m.name}
                <span className="font-normal text-[#667781]"> · {interpolate(m.route, V)}</span>
              </p>
              <p className="mt-0.5 text-[13.5px] leading-snug text-[#111b21]">
                {interpolate(locale === "fr" ? m.fr : m.en, V)}
              </p>
              <p className="mt-0.5 text-right text-[10.5px] text-[#667781] leading-none">
                {m.time}
                <ReadTicks animate />
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
