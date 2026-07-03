"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Scale, Box, Ship, Sparkles } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import { PriceTicker } from "@/components/motion/PriceTicker";

interface QuoteResponse {
  estimate: {
    weightKg: number;
    volumeM3: number;
    itemClass: string;
    summaryFr: string;
    summaryEn: string;
    estimatedBy: string;
  };
  price: {
    packagingCents: number;
    shippingCents: number;
    totalCents: number;
    packagingLabelFr: string;
    packagingLabelEn: string;
  };
}

function euro(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

export function QuoteWidget() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState(false);

  async function getQuote() {
    if (description.trim().length < 3 || loading) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error();
      setQuote(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function book() {
    window.localStorage.setItem(
      "sn_draft",
      JSON.stringify({ description, step: 1 })
    );
    router.push("/book");
  }

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
        disabled={loading || description.trim().length < 3}
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

      {error && (
        <p className="mt-3 text-sm text-destructive">{t("quote_error")}</p>
      )}

      {quote && (
        <div className="mt-4 rounded-xl bg-surface border border-border p-4 space-y-2 text-sm">
          <p className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted">
              <Scale className="w-4 h-4" aria-hidden />
              {t("quote_estimated_weight")}
            </span>
            <span className="font-semibold">
              ~{quote.estimate.weightKg} kg · {quote.estimate.volumeM3} m³
            </span>
          </p>
          <p className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted">
              <Box className="w-4 h-4" aria-hidden />
              {t("quote_packaging")}
            </span>
            <span className="font-semibold text-right">
              {locale === "fr"
                ? quote.price.packagingLabelFr
                : quote.price.packagingLabelEn}{" "}
              · {euro(quote.price.packagingCents)}
            </span>
          </p>
          <p className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-muted">
              <Ship className="w-4 h-4" aria-hidden />
              {t("quote_shipping")}
            </span>
            <span className="font-semibold">
              {euro(quote.price.shippingCents)}
            </span>
          </p>
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="font-bold">{t("quote_total_from")}</span>
            <PriceTicker
              cents={quote.price.totalCents}
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
