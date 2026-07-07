// Deterministic keyword matcher: free text → catalog line items.
// Pure function — the same input always yields the same output. Used as the
// offline/no-API path AND as the schema-safe validator for the AI path.

import { CATALOG, type ItemClass } from "./catalog";

export interface MatchLine {
  catalogId: string;
  quantity: number;
}

export interface MatchResult {
  lines: MatchLine[];
  unmatched: string[]; // substantive fragments we could not map
  issues: string[]; // e.g. "quantity_out_of_range", "fractional_quantity"
}

const MAX_QTY = 50;

// Normalize: lowercase, strip accents, map non-ASCII digits, collapse spaces.
export function normalize(text: string): string {
  let s = (text ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) → ASCII digits
  s = s.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  s = s.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
  return s.replace(/\s+/g, " ").trim();
}

const NUMBER_WORDS: Record<string, number> = {
  un: 1, une: 1, a: 1, an: 1, deux: 2, two: 2, trois: 3, three: 3,
  quatre: 4, four: 4, cinq: 5, five: 5, six: 6, sept: 7, seven: 7,
  huit: 8, eight: 8, neuf: 9, nine: 9, dix: 10, ten: 10, onze: 11,
  eleven: 11, douze: 12, twelve: 12, dozen: 12, douzaine: 12,
};

const STOPWORDS = new Set([
  // connectors / articles / filler
  "and", "et", "avec", "with", "plus", "de", "des", "du", "la", "le", "les",
  "un", "une", "the", "a", "an", "some", "my", "mes", "mon", "ma", "pour",
  "for", "envoyer", "send", "ship", "shipping", "environ", "about",
  "grand", "grande", "petit", "petite", "quelques", "several", "aussi", "also",
  "en", "of", "dans", "sur", "par", "aux", "au", "ou", "or", "and/or", "puis",
  // content descriptors (what's INSIDE a box — not separate catalog items)
  "vetements", "vetement", "habits", "habit", "clothes", "clothing", "linge",
  "chaussures", "chaussure", "shoes", "nourriture", "food", "provisions",
  "vivres", "denrees", "affaires", "effets", "personnels", "personnel",
  "personal", "cuisine", "kitchen", "maison", "house", "home", "bureau",
  "office", "bebe", "baby", "enfant", "enfants", "child", "children", "outils",
  "tools", "materiel", "equipment", "divers", "various", "cadeaux", "cadeau",
  "gifts", "gift", "produits", "produit", "products", "marchandise",
  "marchandises", "goods", "neuf", "neufs", "used", "occasion", "assortiment",
  "melange", "mixed", "papiers", "fournitures", "supplies", "medicaments",
  "medecine", "cosmetiques", "cosmetics",
  // conversational filler / pronouns / verbs (offline path forgiveness)
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "on", "ce",
  "cette", "ces", "ma", "ta", "sa", "notre", "votre", "leur", "leurs",
  "veux", "voudrais", "souhaite", "souhaiterais", "aimerais", "besoin",
  "expedier", "transporter", "envoi", "want", "need", "would", "like",
  "have", "has", "have", "ai", "avons", "est", "sont", "voir", "aussi",
  "bonjour", "hello", "hi", "merci", "thanks", "please", "svp", "sil",
  "plait", "vers", "que", "qui", "quoi", "comme", "environ", "peu",
  "beaucoup", "juste", "seulement", "only", "get", "quote", "devis",
  "prix", "price", "combien", "much", "cost", "coute", "this", "that",
  "these", "those", "it", "them", "there",
]);

interface QtyParse {
  qty: number;
  start: number; // index where the quantity token begins (for span consumption)
  fractional?: boolean;
  negative?: boolean;
}

/** Parse a quantity in the ~16 chars immediately before an alias match. */
function parseQtyBefore(text: string, matchStart: number): QtyParse {
  const window = text.slice(Math.max(0, matchStart - 16), matchStart);

  // Patterns like "3x", "x3", "3 x" just before the item
  const nx = window.match(/(\d+)\s*x\s*$/);
  if (nx) return { qty: Number(nx[1]), start: matchStart - nx[0].length };

  // Decimal / negative / integer digits: "-3 ", "1.5 ", "12 "
  const num = window.match(/(-?)(\d+)([.,]\d+)?\s*$/);
  if (num) {
    const negative = num[1] === "-";
    const fractional = Boolean(num[3]);
    return {
      qty: Number(num[2]),
      start: matchStart - num[0].length,
      fractional,
      negative,
    };
  }

  // Number words: "deux ", "a dozen "
  const word = window.match(/(?:^|\s)([a-z]+)\s*$/);
  if (word && NUMBER_WORDS[word[1]] !== undefined) {
    return { qty: NUMBER_WORDS[word[1]], start: matchStart - word[1].length - 1 };
  }
  return { qty: 1, start: matchStart };
}

// Alias index, longest-first so "carton moyen" wins over "carton".
const ALIAS_INDEX: Array<{ re: RegExp; id: string; len: number }> = CATALOG.flatMap(
  (item) =>
    item.aliases.map((a) => {
      const alias = normalize(a);
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return {
        id: item.id,
        len: alias.length,
        // trailing s? absorbs common FR/EN plurals (fridges, cartons, frigos)
        re: new RegExp(`(?<![a-z0-9])${escaped}s?(?![a-z0-9])`, "g"),
      };
    })
).sort((a, b) => b.len - a.len);

export function matchDescription(description: string): MatchResult {
  const text = normalize(description);
  if (!text) return { lines: [], unmatched: [], issues: [] };

  const consumed = new Array<boolean>(text.length).fill(false);
  const spanFree = (s: number, e: number) => {
    for (let i = s; i < e; i++) if (consumed[i]) return false;
    return true;
  };
  const consume = (s: number, e: number) => {
    for (let i = Math.max(0, s); i < e; i++) consumed[i] = true;
  };

  const byId = new Map<string, number>();
  const issues = new Set<string>();

  for (const { re, id } of ALIAS_INDEX) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const s = m.index;
      const e = s + m[0].length;
      if (!spanFree(s, e)) continue;
      const q = parseQtyBefore(text, s);
      if (q.negative) issues.add("negative_quantity");
      if (q.fractional) issues.add("fractional_quantity");
      if (q.qty <= 0) issues.add("zero_quantity");
      if (q.qty > MAX_QTY) issues.add("quantity_out_of_range");
      const qty = q.qty;
      consume(q.start, e);
      byId.set(id, (byId.get(id) ?? 0) + (qty > 0 ? qty : 0));
    }
  }

  // Leftover substantive tokens → unmatched
  let leftover = "";
  for (let i = 0; i < text.length; i++) leftover += consumed[i] ? " " : text[i];
  const unmatched = leftover
    .split(/[^a-z0-9]+/)
    .filter((tok) => tok.length >= 3 && !STOPWORDS.has(tok) && !/^\d+$/.test(tok));

  const lines: MatchLine[] = [...byId.entries()]
    .filter(([, qty]) => qty > 0)
    .map(([catalogId, quantity]) => ({ catalogId, quantity: Math.min(quantity, MAX_QTY) }))
    // Canonical order (by id) so summation order is irrelevant to any downstream step
    .sort((a, b) => a.catalogId.localeCompare(b.catalogId));

  return { lines, unmatched, issues: [...issues] };
}

export function classForId(catalogId: string): ItemClass | undefined {
  return CATALOG.find((c) => c.id === catalogId)?.class;
}
