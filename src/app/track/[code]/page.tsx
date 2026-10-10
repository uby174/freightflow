"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, Ship, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale, useT, type DictKey } from "@/lib/i18n";
import type { MilestoneKey } from "@/lib/carrier/types";
import { PassportStamp } from "@/components/motion/PassportStamp";
import { bookingLane } from "@/tenant";

const LANE = bookingLane();
const TC = LANE.terminal.city.toUpperCase();
const PORT = LANE.port.toUpperCase();
const CITY = LANE.destCities[0].toUpperCase();

// Short seal labels for the passport stamp, plus its ink colour.
const STAMP: Record<MilestoneKey, { fr: string; en: string; ink?: string }> = {
  booked: { fr: "RÉSERVÉ", en: "BOOKED" },
  received_warehouse: { fr: TC, en: TC },
  consolidated: { fr: "GROUPAGE", en: "CONSOLIDATED" },
  departed: { fr: PORT, en: PORT },
  at_sea: { fr: "EN MER", en: "AT SEA" },
  arrived_douala: { fr: CITY, en: CITY },
  customs: { fr: "DOUANE", en: "CUSTOMS" },
  out_for_delivery: { fr: "LIVRAISON", en: "OUT FOR DELIVERY" },
  delivered: { fr: "LIVRÉ", en: "DELIVERED", ink: "#d21f28" },
};

interface TrackData {
  code: string;
  status: string;
  receiverCity: string;
  receiverName: string;
  departure: { label: string; departsAt: number; etaDouala: number } | null;
  milestones: MilestoneKey[];
  events: Array<{
    statusKey: string;
    messageFr: string;
    messageEn: string;
    occurredAt: number;
  }>;
}

export default function TrackingPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const t = useT();
  const { locale } = useLocale();
  const reduce = useReducedMotion();
  const [data, setData] = useState<TrackData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/track/${encodeURIComponent(code)}`);
        if (cancelled) return;
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setData(await res.json());
        setNotFound(false);
      } catch {}
    }
    load();
    const id = setInterval(load, 20_000); // live demo: new events appear as the mock timeline plays
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [code]);

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-primary-dark">{code}</h1>
        <p className="mt-3 text-muted">{t("track_not_found")}</p>
        <Link
          href="/track"
          className="mt-6 inline-block rounded-xl bg-primary text-white font-bold px-6 py-2.5"
        >
          {t("track_button")}
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center text-muted">…</div>
    );
  }

  const reachedIndex = data.milestones.reduce((acc, m, i) => {
    return data.events.some((e) => e.statusKey === m) ? i : acc;
  }, 0);
  const delivered = reachedIndex === data.milestones.length - 1;

  const fmt = (ts: number) =>
    new Date(ts).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  const fmtDate = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      day: "numeric",
      month: "long",
    });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted">{t("track_title")}</p>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-primary-dark">
            {data.code}
          </h1>
          <p className="mt-1 text-sm text-muted flex items-center gap-1.5">
            <MapPin className="w-4 h-4" aria-hidden />
            Alsace {t("track_to")} {data.receiverCity} · {data.receiverName}
          </p>
        </div>
        {data.departure && (
          <div className="rounded-xl bg-white border border-border px-4 py-3 text-sm">
            <p className="flex items-center gap-1.5 font-semibold">
              {/* The living ship — the parcel is a real object in motion */}
              <motion.span
                aria-hidden
                animate={
                  reduce || delivered ? {} : { y: [0, -2.5, 0], rotate: [0, -2, 0] }
                }
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="inline-flex"
              >
                <Ship className="w-4 h-4 text-primary" />
              </motion.span>
              {data.departure.label}
            </p>
            <p className="text-muted mt-0.5">
              {t("wiz_eta")} : {fmtDate(data.departure.etaDouala)}
            </p>
          </div>
        )}
      </div>

      {/* Milestone timeline — expectation management for 4-8 week sea freight */}
      <ol className="mt-8 space-y-0">
        {data.milestones.map((m, i) => {
          const reached = i <= reachedIndex;
          const isCurrent = i === reachedIndex && !delivered;
          const isLast = i === data.milestones.length - 1;
          const eventsFor = data.events.filter((e) => e.statusKey === m);
          return (
            <li key={m} className="relative pl-10 pb-6">
              {!isLast && (
                <span
                  className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-border"
                  aria-hidden
                >
                  {/* Progress ink draws down the connector as milestones land */}
                  <motion.span
                    className="absolute inset-0 bg-primary"
                    style={{ transformOrigin: "top" }}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: i < reachedIndex ? 1 : 0 }}
                    transition={{
                      duration: reduce ? 0.2 : 0.7,
                      ease: [0.16, 1, 0.3, 1],
                      delay: reduce ? 0 : 0.15 + i * 0.12,
                    }}
                  />
                </span>
              )}
              {reached ? (
                <motion.span
                  className="absolute left-0 top-0.5 inline-flex"
                  initial={{ scale: reduce ? 1 : 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                    delay: reduce ? 0 : 0.2 + i * 0.12,
                  }}
                >
                  <CheckCircle2
                    className="w-7 h-7 text-primary fill-white"
                    aria-hidden
                  />
                  {isCurrent && !reduce && (
                    <motion.span
                      aria-hidden
                      className="absolute inset-0 rounded-full border-2 border-gold"
                      animate={{ scale: [1, 1.55], opacity: [0.6, 0] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeOut",
                        repeatDelay: 0.6,
                      }}
                    />
                  )}
                </motion.span>
              ) : (
                <CircleDashed
                  className="absolute left-0 top-0.5 w-7 h-7 text-border"
                  aria-hidden
                />
              )}
              <p
                className={`font-bold ${
                  reached ? "text-primary-dark" : "text-muted"
                }`}
              >
                {t(`ms_${m}` as DictKey)}
              </p>
              {eventsFor.map((e, ei) => (
                <motion.div
                  key={e.occurredAt}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, scale: 1.12, rotate: -2.5, y: -6 }
                  }
                  animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                  transition={
                    reduce
                      ? { duration: 0.25 }
                      : { type: "spring", stiffness: 340, damping: 24 }
                  }
                  className="relative mt-1.5 mr-1 rounded-xl bg-white border border-border px-4 py-2.5 pr-14 text-sm"
                >
                  {/* Passport stamp presses onto the first check-in of each milestone */}
                  {ei === 0 && (
                    <PassportStamp
                      label={locale === "fr" ? STAMP[m].fr : STAMP[m].en}
                      ink={STAMP[m].ink}
                    />
                  )}
                  <p>{locale === "fr" ? e.messageFr : e.messageEn}</p>
                  <p className="mt-1 text-xs text-muted">{fmt(e.occurredAt)}</p>
                </motion.div>
              ))}
            </li>
          );
        })}
      </ol>

      <p className="mt-2 rounded-xl bg-surface border border-border px-4 py-3 text-sm text-muted">
        {t("track_eta_note")}
      </p>
    </div>
  );
}
