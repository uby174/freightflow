"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Warehouse,
  Truck,
  CheckCircle2,
  Copy,
  PartyPopper,
  Ship,
  Ruler,
} from "lucide-react";
import { motion } from "motion/react";
import { useLocale, useT } from "@/lib/i18n";
import { PriceTicker, CodeReveal } from "@/components/motion/PriceTicker";
import { AssistPanel } from "@/components/AssistPanel";
import { CustomBoxForm, type CustomBox } from "@/components/CustomBoxForm";
import type { DepartureDto } from "@/components/useDepartures";

type QuoteItemInput = { catalogId: string; quantity: number } | CustomBox;

interface Draft {
  step: number;
  description: string;
  mode: "dropoff" | "pickup";
  pickupAddress: string;
  pickupPostcode: string;
  pickupCity: string;
  pickupKm?: number;
  departureId?: number;
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  whatsapp: boolean;
  receiverName: string;
  receiverPhone: string;
  receiverCity: string;
  neighborhood: string;
  landmark: string;
  lines?: QuoteItemInput[];
}

interface QuoteLineView {
  catalogId: string;
  quantity: number;
  labelFr: string;
  labelEn: string;
  volumeM3: number;
  vehicleCents: number;
}
interface QuoteState {
  goodsCents: number;
  freightCents: number;
  vehicleCents: number;
  chargeableM3: number;
  totalCents: number;
  lines: QuoteLineView[];
}

const EMPTY: Draft = {
  step: 1,
  description: "",
  mode: "dropoff",
  pickupAddress: "",
  pickupPostcode: "",
  pickupCity: "",
  senderName: "",
  senderPhone: "",
  senderEmail: "",
  whatsapp: true,
  receiverName: "",
  receiverPhone: "+237 ",
  receiverCity: "Douala",
  neighborhood: "",
  landmark: "",
};

const CAMEROON_CITIES = [
  "Douala",
  "Yaoundé",
  "Bafoussam",
  "Bamenda",
  "Garoua",
  "Maroua",
  "Buea",
  "Limbe",
  "Kribi",
  "Autre / Other",
];

function euro(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export default function BookPage() {
  const t = useT();
  const { locale } = useLocale();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [quote, setQuote] = useState<QuoteState | null>(null);
  const [needsReview, setNeedsReview] = useState(false);
  const [departures, setDepartures] = useState<DepartureDto[]>([]);
  const [distanceState, setDistanceState] = useState<
    "idle" | "loading" | "too_far" | "not_found"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Autosave: this audience gets interrupted and comes back later
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("sn_draft");
      if (saved) setDraft({ ...EMPTY, ...JSON.parse(saved) });
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded && !confirmedCode) {
      window.localStorage.setItem("sn_draft", JSON.stringify(draft));
    }
  }, [draft, loaded, confirmedCode]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const pickupCents = useMemo(
    () =>
      draft.mode === "pickup" && draft.pickupKm !== undefined
        ? 500 + Math.round(draft.pickupKm * 19)
        : 0,
    [draft.mode, draft.pickupKm]
  );
  const displayTotal = (quote?.goodsCents ?? 0) + pickupCents;

  // Quote from the PINNED lines when we have them (preserves custom boxes /
  // assistant-added items from the widget); otherwise classify the description.
  async function refreshQuote(extra?: QuoteItemInput[]) {
    const pinned = extra ?? draft.lines ?? [];
    const body =
      pinned.length > 0
        ? { items: pinned }
        : { description: draft.description };
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const data = await res.json();
    setDepartures(data.departures ?? []);
    if (!draft.departureId && data.departures?.[0]) {
      set({ departureId: data.departures[0].id });
    }
    if (data.needsReview) {
      setNeedsReview(true);
      setQuote(null);
      return;
    }
    setNeedsReview(false);
    setQuote({
      goodsCents: data.quote.goodsCents,
      freightCents: data.quote.freightCents,
      vehicleCents: data.quote.vehicleCents,
      chargeableM3: data.quote.chargeableM3,
      totalCents: data.quote.totalCents,
      lines: data.quote.lines,
    });
    set({ lines: data.lines });
  }

  // Assistant / custom-box adds → pin and re-quote
  function addItems(items: QuoteItemInput[]) {
    const next = [...(draft.lines ?? []), ...items];
    set({ lines: next });
    refreshQuote(next);
  }

  useEffect(() => {
    const havePinned = (draft.lines?.length ?? 0) > 0;
    if (loaded && (draft.description.trim().length >= 2 || havePinned) && !quote && !needsReview) {
      refreshQuote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  async function calcDistance() {
    const addr = [draft.pickupAddress, draft.pickupPostcode, draft.pickupCity]
      .filter(Boolean)
      .join(", ");
    if (addr.length < 5) return;
    setDistanceState("loading");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: draft.description || "colis", pickupAddress: addr }),
      });
      const data = await res.json();
      if (data.pickupError === "too_far") setDistanceState("too_far");
      else if (data.pickupError || data.pickupKm === undefined) setDistanceState("not_found");
      else {
        set({ pickupKm: data.pickupKm });
        setDistanceState("idle");
      }
    } catch {
      setDistanceState("not_found");
    }
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          mode: draft.mode,
          contents: draft.description,
          lines: draft.lines ?? [],
          departureId: draft.departureId,
          sender: {
            name: draft.senderName,
            phone: draft.senderPhone,
            email: draft.senderEmail || undefined,
            whatsapp: draft.whatsapp,
            address: draft.mode === "pickup" ? draft.pickupAddress : undefined,
            postcode: draft.mode === "pickup" ? draft.pickupPostcode : undefined,
            city: draft.mode === "pickup" ? draft.pickupCity : undefined,
          },
          receiver: {
            name: draft.receiverName,
            phone: draft.receiverPhone,
            city: draft.receiverCity,
            neighborhood: draft.neighborhood || undefined,
            landmark: draft.landmark || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConfirmedCode(data.code);
      window.localStorage.removeItem("sn_draft");
    } catch {
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const fmt = (ts: number) =>
    new Date(ts).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

  const canNext = () => {
    switch (draft.step) {
      case 1:
        return draft.description.trim().length >= 2 && quote !== null && !needsReview;
      case 2:
        return draft.mode === "dropoff" || draft.pickupKm !== undefined;
      case 3:
        return draft.departureId !== undefined;
      case 4:
        return (
          draft.senderName.trim().length >= 2 &&
          draft.senderPhone.trim().length >= 6 &&
          draft.receiverName.trim().length >= 2 &&
          draft.receiverPhone.trim().length >= 6 &&
          draft.receiverCity.length >= 2
        );
      default:
        return true;
    }
  };

  if (!loaded) return null;

  // ── Confirmation screen ──
  if (confirmedCode) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
        >
          <PartyPopper className="w-14 h-14 text-accent mx-auto" aria-hidden />
        </motion.div>
        <h1 className="mt-4 text-3xl font-black text-primary-dark">
          {t("wiz_done_title")}
        </h1>
        <p className="mt-2 text-muted">{t("wiz_done_sub")}</p>
        <div className="mt-5 flex items-center justify-center gap-2">
          <motion.code
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.15 }}
            className="text-2xl font-black tracking-wider bg-white border-2 border-primary rounded-xl px-5 py-3"
          >
            <CodeReveal code={confirmedCode} />
          </motion.code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(confirmedCode);
              setCopied(true);
            }}
            className="rounded-xl border border-border bg-white p-3 hover:border-primary transition-colors"
            aria-label="Copy"
          >
            {copied ? (
              <CheckCircle2 className="w-5 h-5 text-success" aria-hidden />
            ) : (
              <Copy className="w-5 h-5 text-muted" aria-hidden />
            )}
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">{t("wiz_payment_note")}</p>
        <Link
          href={`/track/${confirmedCode}`}
          className="mt-8 inline-block rounded-xl bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 transition-colors"
        >
          {t("wiz_done_track")}
        </Link>
      </div>
    );
  }

  const stepTitles = [
    t("wiz_s1_title"),
    t("wiz_s2_title"),
    t("wiz_s3_title"),
    t("wiz_s4_title"),
    t("wiz_s5_title"),
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 pb-28">
      {/* Progress */}
      <p className="text-sm font-semibold text-muted">
        {t("wiz_step")} {draft.step} {t("wiz_of")} 5
      </p>
      <div className="relative mt-2">
        <div className="h-1.5 rounded-full bg-muted-bg overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${(draft.step / 5) * 100}%` }}
          />
        </div>
        {/* The journey metaphor: your booking sails toward Douala */}
        <motion.span
          aria-hidden
          className="absolute -top-5"
          initial={false}
          animate={{ left: `calc(${(draft.step / 5) * 100}% - 18px)` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Ship className="w-4 h-4 text-primary" />
        </motion.span>
      </div>
      <h1 className="mt-4 text-2xl font-black text-primary-dark">
        {stepTitles[draft.step - 1]}
      </h1>

      <div className="mt-6 space-y-5">
        {/* Step 1 — contents + estimate */}
        {draft.step === 1 && (
          <>
            <textarea
              value={draft.description}
              onChange={(e) => {
                set({ description: e.target.value, lines: [] });
                setQuote(null);
                setNeedsReview(false);
              }}
              placeholder={t("quote_placeholder")}
              rows={4}
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm resize-none focus:border-primary transition-colors"
            />
            {!quote && !needsReview && draft.description.trim().length >= 2 && (
              <button
                onClick={() => refreshQuote()}
                className="rounded-xl bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 text-sm transition-colors"
              >
                {t("quote_button")}
              </button>
            )}
            {needsReview && (
              <AssistPanel
                initialMessage={draft.description}
                onAddCatalog={(id) => addItems([{ catalogId: id, quantity: 1 }])}
                onAddCustom={(box) => addItems([box])}
              />
            )}
            {quote && (
              <div className="rounded-xl bg-white border border-border p-4 text-sm space-y-2">
                <ul className="space-y-1">
                  {quote.lines.map((l) => (
                    <li key={l.catalogId} className="flex justify-between gap-2">
                      <span>
                        {l.quantity} × {locale === "fr" ? l.labelFr : l.labelEn}
                      </span>
                      {l.vehicleCents > 0 ? (
                        <span className="font-semibold">{euro(l.vehicleCents)}</span>
                      ) : (
                        <span className="text-muted">{l.volumeM3} m³</span>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border pt-2 space-y-1">
                  {quote.freightCents > 0 && (
                    <p className="flex justify-between">
                      <span className="text-muted">
                        {t("quote_freight")} ({quote.chargeableM3} m³)
                      </span>
                      <span className="font-semibold">{euro(quote.freightCents)}</span>
                    </p>
                  )}
                  {quote.vehicleCents > 0 && (
                    <p className="flex justify-between">
                      <span className="text-muted">{t("quote_vehicles")}</span>
                      <span className="font-semibold">{euro(quote.vehicleCents)}</span>
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted pt-1">{t("quote_note")}</p>
              </div>
            )}
            {quote && !needsReview && (
              <details className="text-sm">
                <summary className="inline-flex items-center gap-1.5 cursor-pointer font-semibold text-primary">
                  <Ruler className="w-3.5 h-3.5" aria-hidden />
                  {t("dim_toggle")}
                </summary>
                <div className="mt-2">
                  <CustomBoxForm onAdd={(box) => addItems([box])} />
                </div>
              </details>
            )}
          </>
        )}

        {/* Step 2 — dropoff vs pickup */}
        {draft.step === 2 && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => set({ mode: "dropoff", pickupKm: undefined })}
                className={`rounded-2xl border-2 p-5 text-left transition-colors ${
                  draft.mode === "dropoff"
                    ? "border-primary bg-white"
                    : "border-border bg-white/60 hover:border-primary/50"
                }`}
              >
                <Warehouse className="w-6 h-6 text-primary" aria-hidden />
                <p className="mt-2 font-bold">{t("wiz_dropoff")}</p>
                <p className="text-sm text-muted mt-1">{t("wiz_dropoff_desc")}</p>
              </button>
              <button
                onClick={() => set({ mode: "pickup" })}
                className={`rounded-2xl border-2 p-5 text-left transition-colors ${
                  draft.mode === "pickup"
                    ? "border-primary bg-white"
                    : "border-border bg-white/60 hover:border-primary/50"
                }`}
              >
                <Truck className="w-6 h-6 text-accent" aria-hidden />
                <p className="mt-2 font-bold">{t("wiz_pickup")}</p>
                <p className="text-sm text-muted mt-1">{t("wiz_pickup_desc")}</p>
              </button>
            </div>

            {draft.mode === "pickup" && (
              <div className="rounded-2xl bg-white border border-border p-5 space-y-3">
                <input
                  value={draft.pickupAddress}
                  onChange={(e) => set({ pickupAddress: e.target.value, pickupKm: undefined })}
                  placeholder={t("wiz_pickup_address")}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={draft.pickupPostcode}
                    onChange={(e) => set({ pickupPostcode: e.target.value, pickupKm: undefined })}
                    placeholder={t("wiz_pickup_postcode")}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
                  />
                  <input
                    value={draft.pickupCity}
                    onChange={(e) => set({ pickupCity: e.target.value, pickupKm: undefined })}
                    placeholder={t("wiz_pickup_city")}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
                  />
                </div>
                <button
                  onClick={calcDistance}
                  disabled={distanceState === "loading"}
                  className="rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-bold px-5 py-2.5 text-sm flex items-center gap-2 transition-colors"
                >
                  {distanceState === "loading" && (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                  )}
                  {t("wiz_pickup_calc")}
                </button>
                {draft.pickupKm !== undefined && (
                  <p className="text-sm">
                    {t("wiz_pickup_km")} :{" "}
                    <strong>{draft.pickupKm} km</strong> →{" "}
                    <strong className="text-primary-dark">{euro(pickupCents)}</strong>
                  </p>
                )}
                {distanceState === "too_far" && (
                  <p className="text-sm text-destructive">{t("wiz_pickup_too_far")}</p>
                )}
                {distanceState === "not_found" && (
                  <p className="text-sm text-destructive">{t("wiz_pickup_not_found")}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 3 — departure choice */}
        {draft.step === 3 && (
          <>
            <p className="text-sm text-muted">{t("wiz_departure_hint")}</p>
            <div className="space-y-3">
              {departures.map((d) => (
                <button
                  key={d.id}
                  onClick={() => set({ departureId: d.id })}
                  className={`w-full rounded-2xl border-2 p-4 text-left text-sm transition-colors ${
                    draft.departureId === d.id
                      ? "border-primary bg-white"
                      : "border-border bg-white/60 hover:border-primary/50"
                  }`}
                >
                  <p className="font-bold text-base">{d.label}</p>
                  <p className="text-muted mt-1">
                    {t("wiz_departs")} {d.port} : <strong className="text-foreground">{fmt(d.departsAt)}</strong>
                  </p>
                  <p className="text-muted">
                    {t("wiz_cutoff")} : <strong className="text-foreground">{fmt(d.cutoffAt)}</strong> · {t("wiz_eta")} :{" "}
                    <strong className="text-foreground">{fmt(d.etaDouala)}</strong>
                  </p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 4 — details */}
        {draft.step === 4 && (
          <>
            <fieldset className="rounded-2xl bg-white border border-border p-5 space-y-3">
              <legend className="font-bold text-sm px-2">{t("wiz_sender")}</legend>
              <input
                value={draft.senderName}
                onChange={(e) => set({ senderName: e.target.value })}
                placeholder={t("wiz_name")}
                autoComplete="name"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
              />
              <input
                value={draft.senderPhone}
                onChange={(e) => set({ senderPhone: e.target.value })}
                placeholder={`${t("wiz_phone")} (+33…)`}
                autoComplete="tel"
                inputMode="tel"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
              />
              <input
                value={draft.senderEmail}
                onChange={(e) => set({ senderEmail: e.target.value })}
                placeholder={t("wiz_email")}
                autoComplete="email"
                inputMode="email"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
              />
              <label className="flex items-center gap-2.5 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={draft.whatsapp}
                  onChange={(e) => set({ whatsapp: e.target.checked })}
                  className="w-4 h-4 accent-[#16a34a]"
                />
                {t("wiz_whatsapp_pref")}
              </label>
            </fieldset>

            <fieldset className="rounded-2xl bg-white border border-border p-5 space-y-3">
              <legend className="font-bold text-sm px-2">{t("wiz_receiver")}</legend>
              <input
                value={draft.receiverName}
                onChange={(e) => set({ receiverName: e.target.value })}
                placeholder={t("wiz_name")}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
              />
              <input
                value={draft.receiverPhone}
                onChange={(e) => set({ receiverPhone: e.target.value })}
                placeholder={`${t("wiz_phone")} (+237…)`}
                inputMode="tel"
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={draft.receiverCity}
                  onChange={(e) => set({ receiverCity: e.target.value })}
                  className="rounded-xl border border-border px-3 py-2.5 text-sm bg-white focus:border-primary transition-colors"
                >
                  {CAMEROON_CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                <input
                  value={draft.neighborhood}
                  onChange={(e) => set({ neighborhood: e.target.value })}
                  placeholder={t("wiz_neighborhood")}
                  className="rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
                />
              </div>
              <input
                value={draft.landmark}
                onChange={(e) => set({ landmark: e.target.value })}
                placeholder={t("wiz_landmark")}
                className="w-full rounded-xl border border-border px-4 py-2.5 text-sm focus:border-primary transition-colors"
              />
            </fieldset>
          </>
        )}

        {/* Step 5 — summary + confirm */}
        {draft.step === 5 && quote && (
          <div className="rounded-2xl bg-white border border-border p-5 text-sm space-y-2">
            <h2 className="font-bold text-base">{t("wiz_summary")}</h2>
            <p className="text-muted">{draft.description}</p>
            <div className="border-t border-border pt-2 space-y-1.5">
              {quote.freightCents > 0 && (
                <p className="flex justify-between">
                  <span className="text-muted">
                    {t("quote_freight")} ({quote.chargeableM3} m³)
                  </span>
                  <span className="font-semibold">{euro(quote.freightCents)}</span>
                </p>
              )}
              {quote.vehicleCents > 0 && (
                <p className="flex justify-between">
                  <span className="text-muted">{t("quote_vehicles")}</span>
                  <span className="font-semibold">{euro(quote.vehicleCents)}</span>
                </p>
              )}
              {draft.mode === "pickup" && (
                <p className="flex justify-between">
                  <span className="text-muted">
                    {t("wiz_pickup")} ({draft.pickupKm} km)
                  </span>
                  <span className="font-semibold">{euro(pickupCents)}</span>
                </p>
              )}
              <p className="flex justify-between border-t border-border pt-2">
                <span className="font-bold">{t("quote_total_from")}</span>
                <span className="text-xl font-black text-primary-dark">
                  {euro(displayTotal)}
                </span>
              </p>
            </div>
            <p className="text-xs text-muted">{t("wiz_payment_note")}</p>
            {submitError && (
              <p className="text-sm text-destructive">{t("wiz_error")}</p>
            )}
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full rounded-xl bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-bold py-3.5 flex items-center justify-center gap-2 transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
              {submitting ? t("wiz_confirming") : t("wiz_confirm")}
            </button>
          </div>
        )}
      </div>

      {/* Sticky bottom bar: running total + navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-border">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm">
            <span className="text-muted">{t("quote_total_from")} : </span>
            {quote ? (
              <PriceTicker
                cents={displayTotal}
                className="font-black text-primary-dark text-lg"
              />
            ) : (
              <span className="font-black text-primary-dark text-lg">—</span>
            )}
          </p>
          <div className="flex gap-2">
            {draft.step > 1 && (
              <button
                onClick={() => set({ step: draft.step - 1 })}
                className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold hover:border-primary transition-colors"
              >
                {t("wiz_back")}
              </button>
            )}
            {draft.step < 5 && (
              <button
                onClick={() => set({ step: draft.step + 1 })}
                disabled={!canNext()}
                className="rounded-xl bg-primary hover:bg-primary-dark disabled:opacity-40 text-white px-6 py-2.5 text-sm font-bold transition-colors"
              >
                {t("wiz_next")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
