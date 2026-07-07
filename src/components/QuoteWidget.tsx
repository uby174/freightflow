"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ship, Sparkles, Package, MessageCircle } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import { PriceTicker } from "@/components/motion/PriceTicker";

interface PricedLine {
  catalogId: string;
  quantity: number;
  labelFr: string;
  labelEn: string;
  itemClass: string;
  volumeM3: number;
  weightKg: number;
  vehicleCents: number;
}
interface QuoteResponse {
  needsReview: boolean;
  reviewReason?: string;
  unmatched?: string[];
  source?: string;
  lines?: { catalogId: string; quantity: number }[];
  quote?: {
    lines: PricedLine[];
    chargeableM3: number;
    totalWeightKg: number;
    freightCents: number;
    vehicleCents: number;
    pickupCents: number;
    goodsCents: number;
    totalCents: number;
  };
}

const WHATSAPP = "33605775101";
function euro(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function QuoteWidget() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState(false);

  async function getQuote() {
    if (description.trim().length < 2 || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error();
      setResp(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function book() {
    window.localStorage.setItem(
      "sn_draft",
      JSON.stringify({ description, lines: resp?.lines ?? [], step: 1 })
    );
    router.push("/book");
  }

  const q = resp?.quote;

  return (
    <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-blue-900/10 border border-border p-5 sm:p-6">
      <label
        htmlFor="quote-desc"
        className="flex items-center gap-2 text-sm font-semibold text-primary mb-2"
      >
        <Sparkles className="w-4 h-4 text-accent" aria-hidden />
        {t("quote_widget_title")}
      </label>
      <textarea
        id="quote-desc"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("quote_placeholder")}
        rows={3}
        className="w-full rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm resize-none focus:border-primary transition-colors"
      />
      <button
        onClick={getQuote}
        disabled={loading || description.trim().length < 2}
        className="mt-3 w-full rounded-xl bg-accent hover:bg-accent-dark disabled:opacity-50 text-white font-bold py-3 flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            {t("quote_loading")}
          </>
        ) : (
          t("quote_button")
        )}
      </button>

      {error && <p className="mt-3 text-sm text-destructive">{t("quote_error")}</p>}

      {/* Human-quote path — never fabricate a number we can't stand behind */}
      {resp?.needsReview && (
        <div className="mt-4 rounded-xl bg-surface border border-border p-4 text-sm">
          <p className="font-bold text-primary">{t("quote_review_title")}</p>
          <p className="mt-1 text-muted">{t("quote_review_desc")}</p>
          {resp.unmatched && resp.unmatched.length > 0 && (
            <p className="mt-2 text-xs text-muted">
              {t("quote_review_unmatched")} : {resp.unmatched.join(", ")}
            </p>
          )}
          <a
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
              (locale === "fr" ? "Bonjour, je souhaite un devis pour : " : "Hello, I'd like a quote for: ") +
                description
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full rounded-xl bg-success hover:brightness-95 text-white font-bold py-3 flex items-center justify-center gap-2 transition"
          >
            <MessageCircle className="w-4 h-4" aria-hidden />
            {t("quote_whatsapp")}
          </a>
        </div>
      )}

      {/* Itemized deterministic quote */}
      {q && !resp?.needsReview && (
        <div className="mt-4 rounded-xl bg-surface border border-border p-4 space-y-2.5 text-sm">
          <p className="flex items-center gap-2 text-muted font-semibold">
            <Package className="w-4 h-4" aria-hidden />
            {t("quote_items")}
          </p>
          <ul className="space-y-1">
            {q.lines.map((l) => (
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
            {q.freightCents > 0 && (
              <p className="flex justify-between">
                <span className="flex items-center gap-2 text-muted">
                  <Ship className="w-4 h-4" aria-hidden />
                  {t("quote_freight")} ({q.chargeableM3} m³)
                </span>
                <span className="font-semibold">{euro(q.freightCents)}</span>
              </p>
            )}
            {q.vehicleCents > 0 && (
              <p className="flex justify-between">
                <span className="text-muted">{t("quote_vehicles")}</span>
                <span className="font-semibold">{euro(q.vehicleCents)}</span>
              </p>
            )}
          </div>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="font-bold">{t("quote_total_from")}</span>
            <PriceTicker
              cents={q.totalCents}
              className="text-xl font-black text-primary"
            />
          </div>
          <button
            onClick={book}
            className="w-full rounded-xl bg-primary hover:bg-primary-dark text-white font-bold py-3 transition-colors"
          >
            {t("quote_cta")}
          </button>
          <p className="text-xs text-muted text-center">{t("quote_note")}</p>
        </div>
      )}
    </div>
  );
}
