"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Ship, Sparkles, Package, Ruler, X } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import { PriceTicker } from "@/components/motion/PriceTicker";
import { AssistPanel } from "@/components/AssistPanel";
import { CustomBoxForm, type CustomBox } from "@/components/CustomBoxForm";

type QuoteItem = { catalogId: string; quantity: number } | CustomBox;

interface PricedLine {
  catalogId: string;
  quantity: number;
  labelFr: string;
  labelEn: string;
  volumeM3: number;
  vehicleCents: number;
  custom?: boolean;
}
interface QuoteResponse {
  needsReview: boolean;
  unmatched?: string[];
  hasUnmatched?: boolean;
  lines?: QuoteItem[];
  quote?: {
    lines: PricedLine[];
    chargeableM3: number;
    freightCents: number;
    vehicleCents: number;
    totalCents: number;
  };
}

function euro(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

export function QuoteWidget() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [extraItems, setExtraItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const reqId = useRef(0);

  async function getQuote(desc: string, items: QuoteItem[]) {
    if (desc.trim().length < 2 && items.length === 0) return;
    const id = ++reqId.current;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, items }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (id === reqId.current) setResp(data);
    } catch {
      if (id === reqId.current) setError(true);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }

  // Re-quote whenever the user adds/removes explicit items
  useEffect(() => {
    if (extraItems.length > 0 || resp) getQuote(description, extraItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraItems]);

  const addCatalog = (catalogId: string) =>
    setExtraItems((prev) => [...prev, { catalogId, quantity: 1 }]);
  const addCustom = (box: CustomBox) => {
    setExtraItems((prev) => [...prev, box]);
    setShowCustom(false);
  };
  const removeExtra = (i: number) =>
    setExtraItems((prev) => prev.filter((_, idx) => idx !== i));

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
        onChange={(e) => {
          setDescription(e.target.value);
          setResp(null);
        }}
        placeholder={t("quote_placeholder")}
        rows={3}
        className="w-full rounded-xl border border-border bg-surface/60 px-4 py-3 text-sm resize-none focus:border-primary transition-colors"
      />
      <button
        onClick={() => getQuote(description, extraItems)}
        disabled={loading || (description.trim().length < 2 && extraItems.length === 0)}
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

      {/* Always-available: add a measured box */}
      {!showCustom && !resp?.needsReview && (
        <button
          onClick={() => setShowCustom(true)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent transition-colors"
        >
          <Ruler className="w-3.5 h-3.5" aria-hidden />
          {t("dim_toggle")}
        </button>
      )}
      {showCustom && (
        <div className="mt-3">
          <CustomBoxForm onAdd={addCustom} />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{t("quote_error")}</p>}

      {/* Human-quote path → grounded inline assistant instead of a dead end */}
      {resp?.needsReview && (
        <div className="mt-4">
          <AssistPanel
            initialMessage={description}
            onAddCatalog={addCatalog}
            onAddCustom={addCustom}
          />
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
            {q.lines.map((l, i) => (
              <li key={`${l.catalogId}-${i}`} className="flex justify-between gap-2 items-center">
                <span>
                  {l.quantity} × {l.custom ? (locale === "fr" ? l.labelFr : l.labelEn) : locale === "fr" ? l.labelFr : l.labelEn}
                </span>
                <span className="flex items-center gap-2">
                  {l.vehicleCents > 0 ? (
                    <span className="font-semibold">{euro(l.vehicleCents)}</span>
                  ) : (
                    <span className="text-muted">{l.volumeM3} m³</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {/* Remove explicitly-added items */}
          {extraItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {extraItems.map((it, i) => (
                <button
                  key={i}
                  onClick={() => removeExtra(i)}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-border px-2 py-0.5 text-xs text-muted hover:border-destructive hover:text-destructive transition-colors"
                >
                  {"custom" in it
                    ? `${it.custom.lengthCm}×${it.custom.widthCm}×${it.custom.heightCm}`
                    : it.catalogId}
                  <X className="w-3 h-3" aria-hidden />
                </button>
              ))}
            </div>
          )}

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
            <PriceTicker cents={q.totalCents} className="text-xl font-black text-primary" />
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
