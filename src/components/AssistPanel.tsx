"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, Plus, MessageCircle, Send } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import { CustomBoxForm, type CustomBox } from "@/components/CustomBoxForm";

const WHATSAPP = "33605775101";
function euro(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

interface Suggestion {
  catalogId: string;
  labelFr: string;
  labelEn: string;
  priceCents: number;
}
interface AssistResult {
  answer: string;
  suggestions: Suggestion[];
  askDimensions: boolean;
  source: string;
}

/**
 * Inline smart answer. Grounded in our catalog + rates; suggests the closest
 * items (real prices), invites exact dimensions, and answers questions —
 * so the customer rarely needs WhatsApp. Any price comes from the engine.
 */
export function AssistPanel({
  initialMessage,
  onAddCatalog,
  onAddCustom,
}: {
  initialMessage: string;
  onAddCatalog: (catalogId: string) => void;
  onAddCustom: (box: CustomBox) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [result, setResult] = useState<AssistResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const lastAsked = useRef<string>("");

  async function ask(message: string) {
    if (!message.trim()) return;
    lastAsked.current = message;
    setLoading(true);
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, locale }),
      });
      setResult(await res.json());
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (initialMessage && initialMessage !== lastAsked.current) ask(initialMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  return (
    <div className="rounded-xl bg-surface border border-border p-4 text-sm space-y-3">
      <p className="flex items-center gap-2 font-bold text-primary">
        <Sparkles className="w-4 h-4 text-accent" aria-hidden />
        {t("quote_review_title")}
      </p>

      {loading && !result ? (
        <p className="flex items-center gap-2 text-muted">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          {t("assist_thinking")}
        </p>
      ) : (
        <p className="text-foreground">{result?.answer}</p>
      )}

      {/* Closest-match chips — tap to add at the real catalog price */}
      {result && result.suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted mb-1.5">
            {t("assist_closest")}
          </p>
          <div className="flex flex-wrap gap-2">
            {result.suggestions.map((s) => (
              <button
                key={s.catalogId}
                onClick={() => onAddCatalog(s.catalogId)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-border px-3 py-1.5 text-xs font-semibold hover:border-primary transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-primary" aria-hidden />
                {locale === "fr" ? s.labelFr : s.labelEn}
                <span className="text-muted">· {euro(s.priceCents)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exact dimensions — always available */}
      <div>
        <p className="text-xs font-semibold text-muted mb-1.5">
          {t("assist_or_dims")}
        </p>
        <CustomBoxForm onAdd={onAddCustom} />
      </div>

      {/* Ask a question (FAQ) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
          setQuestion("");
        }}
        className="flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("assist_ask_placeholder")}
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary transition-colors"
          aria-label={t("assist_ask_cta")}
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-40 text-white px-3 transition-colors"
          aria-label={t("assist_send")}
        >
          <Send className="w-4 h-4" aria-hidden />
        </button>
      </form>

      {/* WhatsApp — last resort */}
      <a
        href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
          (locale === "fr" ? "Bonjour, une question : " : "Hello, a question: ") +
            initialMessage
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-success"
      >
        <MessageCircle className="w-4 h-4" aria-hidden />
        {t("quote_whatsapp")}
      </a>
    </div>
  );
}
