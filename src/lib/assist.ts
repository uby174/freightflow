// Grounded shipping assistant. Answers quoting help + shipping FAQ using ONLY
// our real data. Any price it states comes from the deterministic engine (a
// tool call with the AI, or direct computation offline) — never invented.

import { ANTHROPIC_MODEL, hasAI } from "./config";
import { CATALOG } from "./catalog/catalog";
import { matchDescription, normalize } from "./catalog/match";
import { priceQuote, type QuoteItem } from "./pricing";

export interface Suggestion {
  catalogId: string;
  labelFr: string;
  labelEn: string;
  priceCents: number;
}
export interface AssistResult {
  answer: string;
  suggestions: Suggestion[];
  askDimensions: boolean; // UI should surface the custom-box form
  source: "ai" | "faq" | "fallback";
}

/** Single-unit price for a catalog item (goods only). */
function unitPriceCents(catalogId: string): number {
  return priceQuote([{ catalogId, quantity: 1 }]).goodsCents;
}

/** Closest catalog items to a free-text description (deterministic). */
export function closestMatches(message: string, n = 3): Suggestion[] {
  // Direct alias hits first.
  const direct = matchDescription(message).lines.map((l) => l.catalogId);
  const ranked: Array<{ id: string; score: number }> = [];

  const msgTokens = new Set(normalize(message).split(/[^a-z0-9]+/).filter(Boolean));
  for (const item of CATALOG) {
    if (direct.includes(item.id)) {
      ranked.push({ id: item.id, score: 100 });
      continue;
    }
    let score = 0;
    const words = normalize(
      [item.labelFr, item.labelEn, ...item.aliases].join(" ")
    ).split(/[^a-z0-9]+/);
    for (const w of words) if (w.length >= 3 && msgTokens.has(w)) score += 1;
    if (score > 0) ranked.push({ id: item.id, score });
  }
  ranked.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const r of ranked) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    const item = CATALOG.find((c) => c.id === r.id)!;
    out.push({
      catalogId: item.id,
      labelFr: item.labelFr,
      labelEn: item.labelEn,
      priceCents: unitPriceCents(item.id),
    });
    if (out.length >= n) break;
  }
  return out;
}

// ── Local FAQ knowledge base (grounded facts, keyword-triggered) ──
const FAQ: Array<{ re: RegExp; fr: string; en: string }> = [
  {
    re: /(combien de temps|delai|d[ée]lai|temps|dure|semaine|how long|transit|duration)/i,
    fr: "Par voie maritime (groupage), comptez 4 à 8 semaines porte à porte selon la date de départ du conteneur et le dédouanement à Douala.",
    en: "By sea (groupage), allow 4–8 weeks door to door depending on the container departure and customs clearance in Douala.",
  },
  {
    re: /(prix|tarif|co[uû]t|comment.*calcul|how much|cost|rate|pricing|price|m3|m³)/i,
    fr: "Nos tarifs : 750 €/m³ en groupage maritime, avec la règle 200 kg = 1 m³ (on facture le plus élevé entre le volume et le poids). Les véhicules sont au forfait (citadine 650 €, utilitaire 750 €…). Minimum 45 €. Vous pouvez entrer les dimensions exactes de vos caisses pour un devis immédiat.",
    en: "Our rates: €750/m³ for sea groupage, using the 200 kg = 1 m³ rule (we charge the greater of volume and weight). Vehicles are flat-rated (city car €650, van €750…). €45 minimum. You can enter your exact box dimensions for an instant quote.",
  },
  {
    re: /(interdit|prohib|forbidden|peut pas|autoris|dangereu|batterie|inflammable)/i,
    fr: "Produits interdits : inflammables, batteries au lithium seules, denrées périssables, espèces, et tout article prohibé par la douane camerounaise.",
    en: "Prohibited items: flammables, standalone lithium batteries, perishables, cash, and anything banned by Cameroonian customs.",
  },
  {
    re: /(douane|customs|taxe|duty|dedouan|d[ée]douan|tax)/i,
    fr: "Le dédouanement au Cameroun suit le tarif CEMAC (5 à 30 %) plus une TVA d'environ 19,25 %. Les droits éventuels sont réglés à l'arrivée.",
    en: "Customs in Cameroon follow the CEMAC tariff (5–30%) plus about 19.25% VAT. Any duties are settled on arrival.",
  },
  {
    re: /(enl[èe]vement|pickup|domicile|collect|ramassage|venir chercher)/i,
    fr: "Enlèvement à domicile : 5 € + 0,19 €/km depuis notre terminal de Bischwiller. Le dépôt au terminal est gratuit.",
    en: "Home pickup: €5 + €0.19/km from our Bischwiller terminal. Dropping off at the terminal is free.",
  },
  {
    re: /(paiement|payment|payer|\bpay\b|r[èe]gler|carte|especes|esp[èe]ces)/i,
    fr: "Le paiement se fait au terminal ou à l'enlèvement (espèces ou carte). Aucun paiement en ligne n'est requis pour réserver.",
    en: "Payment is made at the terminal or on pickup (cash or card). No online payment is needed to book.",
  },
  {
    re: /(suivi|tracking|track|num[ée]ro|parcel number|o[uù].*colis|suivre)/i,
    fr: "Chaque envoi reçoit un numéro SN-AAAA-XXXXXX. Suivez-le sur la page Suivi, et vous recevez aussi des nouvelles à chaque étape sur WhatsApp.",
    en: "Every shipment gets an SN-YYYY-XXXXXX number. Track it on the Tracking page, and you also get updates at each step on WhatsApp.",
  },
  {
    re: /(emballage|packaging|embal|prot[ée]ger|caisse)/i,
    fr: "Nous pesons et emballons votre colis à notre terminal. Vous pouvez aussi entrer les dimensions exactes de vos caisses pour obtenir un devis immédiat.",
    en: "We weigh and pack your goods at our terminal. You can also enter the exact dimensions of your boxes to get an instant quote.",
  },
  {
    re: /(d[ée]part|calendrier|prochain|next|schedule|conteneur|quand)/i,
    fr: "Nos conteneurs partent régulièrement du Havre vers Douala (Akwa). Le calendrier des prochains départs est affiché sur la page d'accueil.",
    en: "Our containers leave Le Havre for Douala (Akwa) on a regular schedule. The next departures are shown on the home page.",
  },
  {
    re: /(destination|o[uù]|where|ville|city|livr|cameroun|douala|yaound)/i,
    fr: "Nous expédions de Bischwiller (France) vers Douala (Akwa) et les grandes villes du Cameroun.",
    en: "We ship from Bischwiller (France) to Douala (Akwa) and major cities across Cameroon.",
  },
];

function faqAnswer(message: string, locale: "fr" | "en"): string | null {
  for (const f of FAQ) if (f.re.test(message)) return locale === "fr" ? f.fr : f.en;
  return null;
}

function fallbackAnswer(
  message: string,
  locale: "fr" | "en",
  suggestions: Suggestion[]
): string {
  const faq = faqAnswer(message, locale);
  if (faq) return faq;
  if (suggestions.length > 0) {
    return locale === "fr"
      ? "Voici ce qui ressemble le plus à votre envoi dans notre grille — cliquez pour l'ajouter, ou entrez les dimensions exactes de votre caisse pour un devis précis."
      : "Here's the closest match in our rate card — tap to add it, or enter your box's exact dimensions for a precise quote.";
  }
  return locale === "fr"
    ? "Je n'ai pas cet article dans notre grille, mais je peux vous donner un prix exact tout de suite : entrez les dimensions (L × l × H) et le poids de votre caisse ci-dessous."
    : "I don't have that item in our rate card, but I can price it exactly right now: enter your box's dimensions (L × W × H) and weight below.";
}

function buildSystemPrompt(locale: "fr" | "en"): string {
  const list = CATALOG.map(
    (c) => `${c.id} | ${c.labelFr} / ${c.labelEn} | ≈ ${(unitPriceCents(c.id) / 100).toFixed(0)}€`
  ).join("\n");
  return (
    "You are the assistant for SN Groupage Solutions, a Bischwiller (France) → Douala (Cameroon) " +
    "sea-freight groupage service for the Cameroonian diaspora. Be warm, concise and helpful. " +
    `Answer in ${locale === "fr" ? "French" : "English"}.\n\n` +
    "FACTS: Sea groupage 750 €/m³ with the 200 kg = 1 m³ rule (charge the greater of volume and weight). " +
    "Vehicles are flat-rated. Minimum 45 €. Pickup 5 € + 0,19 €/km from Bischwiller, or free drop-off. " +
    "Transit 4–8 weeks by sea. Payment at the terminal (no online payment). Each shipment gets an " +
    "SN-YYYY-XXXXXX tracking number and WhatsApp updates. Cameroon customs follow CEMAC (5–30%) + ~19.25% VAT, " +
    "paid on arrival. Prohibited: flammables, lone lithium batteries, perishables, cash.\n\n" +
    "PRICING RULES YOU MUST FOLLOW:\n" +
    "- NEVER invent a price. To quote, CALL the price_items tool; state only the number it returns.\n" +
    "- If the item isn't in the catalog, suggest the closest catalog item(s) AND invite the user to enter " +
    "exact box dimensions + weight for a precise quote. Do not guess dimensions.\n" +
    "- Keep answers short (2–4 sentences).\n\n" +
    "CATALOG (id | label | approx single-unit price):\n" +
    list
  );
}

const PRICE_TOOL = {
  name: "price_items",
  description:
    "Compute the exact, official price for a list of items. Use for any quote. " +
    "Each item is either a catalog reference or a custom box with dimensions.",
  input_schema: {
    type: "object" as const,
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            catalog_id: { type: "string" },
            custom: {
              type: "object",
              properties: {
                lengthCm: { type: "number" },
                widthCm: { type: "number" },
                heightCm: { type: "number" },
                weightKg: { type: "number" },
              },
            },
            quantity: { type: "integer", minimum: 1, maximum: 50 },
          },
          required: ["quantity"],
        },
      },
    },
    required: ["items"],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQuoteItems(raw: any): QuoteItem[] {
  if (!raw || !Array.isArray(raw.items)) return [];
  const out: QuoteItem[] = [];
  for (const it of raw.items) {
    const q = Math.min(Math.max(1, Math.floor(it.quantity ?? 1)), 50);
    if (it.custom && it.custom.lengthCm) {
      out.push({
        quantity: q,
        custom: {
          lengthCm: Number(it.custom.lengthCm),
          widthCm: Number(it.custom.widthCm),
          heightCm: Number(it.custom.heightCm),
          weightKg: Number(it.custom.weightKg),
        },
      });
    } else if (it.catalog_id) {
      out.push({ catalogId: String(it.catalog_id), quantity: q });
    }
  }
  return out;
}

async function assistAI(
  message: string,
  locale: "fr" | "en"
): Promise<{ answer: string } | null> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const system = buildSystemPrompt(locale);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages: any[] = [{ role: "user", content: message.slice(0, 1000) }];

    for (let turn = 0; turn < 3; turn++) {
      const res = await client.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 600,
        temperature: 0.2,
        system,
        tools: [PRICE_TOOL],
        messages,
      });
      const toolUses = res.content.filter((b) => b.type === "tool_use");
      if (toolUses.length === 0) {
        const text = res.content
          .filter((b) => b.type === "text")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((b: any) => b.text)
          .join(" ")
          .trim();
        return text ? { answer: text } : null;
      }
      messages.push({ role: "assistant", content: res.content });
      const results = toolUses.map((tu) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = toQuoteItems((tu as any).input);
        const quote = priceQuote(items);
        return {
          type: "tool_result" as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tool_use_id: (tu as any).id,
          content: JSON.stringify({
            total_eur: (quote.totalCents / 100).toFixed(2),
            chargeable_m3: quote.chargeableM3,
            lines: quote.lines.map((l) => ({
              label: locale === "fr" ? l.labelFr : l.labelEn,
              qty: l.quantity,
              eur:
                l.vehicleCents > 0
                  ? (l.vehicleCents / 100).toFixed(2)
                  : undefined,
            })),
          }),
        };
      });
      messages.push({ role: "user", content: results });
    }
    return null;
  } catch {
    return null;
  }
}

export async function assist(
  message: string,
  locale: "fr" | "en"
): Promise<AssistResult> {
  const suggestions = closestMatches(message, 3);
  const askDimensions = suggestions.length === 0 || /dimension|taille|mesure|size|cm|kg|poids|weight/i.test(message);

  if (hasAI()) {
    const ai = await assistAI(message, locale);
    if (ai) return { answer: ai.answer, suggestions, askDimensions, source: "ai" };
  }

  const faq = faqAnswer(message, locale);
  return {
    answer: fallbackAnswer(message, locale, suggestions),
    suggestions,
    askDimensions,
    source: faq ? "faq" : "fallback",
  };
}
