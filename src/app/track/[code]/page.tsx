"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, Ship, MapPin } from "lucide-react";
import { useLocale, useT, type DictKey } from "@/lib/i18n";
import type { MilestoneKey } from "@/lib/carrier/types";

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
            Strasbourg {t("track_to")} {data.receiverCity} · {data.receiverName}
          </p>
        </div>
        {data.departure && (
          <div className="rounded-xl bg-white border border-border px-4 py-3 text-sm">
            <p className="flex items-center gap-1.5 font-semibold">
              <Ship className="w-4 h-4 text-primary" aria-hidden />
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
          const isLast = i === data.milestones.length - 1;
          const eventsFor = data.events.filter((e) => e.statusKey === m);
          return (
            <li key={m} className="relative pl-10 pb-6">
              {!isLast && (
                <span
                  className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${
                    i < reachedIndex ? "bg-primary" : "bg-border"
                  }`}
                  aria-hidden
                />
              )}
              {reached ? (
                <CheckCircle2
                  className="absolute left-0 top-0.5 w-7 h-7 text-primary fill-white"
                  aria-hidden
                />
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
              {eventsFor.map((e) => (
                <div
                  key={e.occurredAt}
                  className="mt-1.5 rounded-xl bg-white border border-border px-4 py-2.5 text-sm"
                >
                  <p>{locale === "fr" ? e.messageFr : e.messageEn}</p>
                  <p className="mt-1 text-xs text-muted">{fmt(e.occurredAt)}</p>
                </div>
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
