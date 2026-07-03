import { z } from "zod";
import { ANTHROPIC_MODEL, hasAI } from "./config";

export interface Estimate {
  weightKg: number;
  dims: { l: number; w: number; h: number };
  packagingType: string;
  fragile: boolean;
  confidence: number;
  summaryFr: string;
  summaryEn: string;
  estimatedBy: "ai" | "heuristic";
}

const PACKAGING_TYPES = [
  "envelope",
  "small_box",
  "medium_box",
  "large_box",
  "barrel",
  "fragile_crate",
] as const;

const aiSchema = z.object({
  weight_kg: z.number().min(0.1).max(500),
  dims_cm: z.object({
    l: z.number().min(1).max(300),
    w: z.number().min(1).max(300),
    h: z.number().min(1).max(300),
  }),
  packaging_type: z.enum(PACKAGING_TYPES),
  fragile: z.boolean(),
  confidence: z.number().min(0).max(1),
  summary_fr: z.string(),
  summary_en: z.string(),
});

// ── Deterministic fallback: keyword × weight table (FR + EN keywords) ──
const ITEMS: Array<{ re: RegExp; kg: number; fragile?: boolean; vol?: number }> = [
  { re: /valise|suitcase|sac de voyage/i, kg: 15, vol: 70 },
  { re: /v[êe]tement|habits?|clothes|clothing|linge/i, kg: 8, vol: 40 },
  { re: /chaussure|shoes?|basket/i, kg: 3, vol: 15 },
  { re: /ordinateur portable|laptop|pc portable/i, kg: 2.5, fragile: true, vol: 8 },
  { re: /t[ée]l[ée]phone|phone|smartphone|iphone/i, kg: 0.5, fragile: true, vol: 2 },
  { re: /t[ée]l[ée]viseur|tv|t[ée]l[ée]|television|écran|screen/i, kg: 12, fragile: true, vol: 60 },
  { re: /ordinateur|computer|desktop/i, kg: 8, fragile: true, vol: 40 },
  { re: /riz|rice/i, kg: 25, vol: 30 },
  { re: /nourriture|food|provisions|conserve/i, kg: 10, vol: 25 },
  { re: /m[ée]dicament|medicine|medication|pharmacie/i, kg: 2, vol: 6 },
  { re: /document|papier|paper|dossier/i, kg: 0.5, vol: 1 },
  { re: /livre|book/i, kg: 5, vol: 12 },
  { re: /frigo|r[ée]frig[ée]rateur|fridge|cong[ée]lateur|freezer/i, kg: 45, fragile: true, vol: 350 },
  { re: /machine [àa] laver|washing machine/i, kg: 60, fragile: true, vol: 300 },
  { re: /moto|motorcycle|scooter/i, kg: 90, vol: 600 },
  { re: /pi[èe]ces? d[ée]tach[ée]es?|spare parts?|pi[èe]ces auto/i, kg: 15, vol: 30 },
  { re: /jouet|toys?/i, kg: 4, vol: 20 },
  { re: /assiette|vaisselle|dishes|verre|glass/i, kg: 8, fragile: true, vol: 25 },
];

function heuristicEstimate(description: string): Estimate {
  let weight = 0;
  let volume = 0;
  let fragile = false;
  const matched: string[] = [];

  for (const item of ITEMS) {
    const m = description.match(item.re);
    if (!m) continue;
    // quantity: look for a number within 12 chars before the match
    const idx = description.search(item.re);
    const before = description.slice(Math.max(0, idx - 12), idx);
    const qty = Number((before.match(/(\d+)\s*$/) ?? [])[1] ?? 1) || 1;
    weight += item.kg * Math.min(qty, 20);
    volume += (item.vol ?? 10) * Math.min(qty, 20);
    if (item.fragile) fragile = true;
    matched.push(m[0]);
  }

  if (weight === 0) {
    // Nothing recognized — conservative default so we never under-price
    weight = 12;
    volume = 45;
  }

  const packagingType =
    volume <= 3 && weight <= 1
      ? "envelope"
      : fragile && weight <= 60
        ? "fragile_crate"
        : weight <= 10
          ? "small_box"
          : weight <= 25
            ? "medium_box"
            : weight <= 40
              ? "large_box"
              : "barrel";

  const side = Math.round(Math.cbrt(volume * 1000));
  return {
    weightKg: Math.round(weight * 10) / 10,
    dims: { l: side, w: side, h: side },
    packagingType,
    fragile,
    confidence: matched.length > 0 ? 0.55 : 0.3,
    summaryFr: `Estimation: environ ${Math.round(weight)} kg`,
    summaryEn: `Estimate: around ${Math.round(weight)} kg`,
    estimatedBy: "heuristic",
  };
}

async function aiEstimate(description: string): Promise<Estimate | null> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 400,
      system:
        "You estimate parcel logistics for CamFret, a Europe→Cameroon sea-freight service. " +
        "Given a customer's item description (French or English), estimate total weight, box dimensions, " +
        "packaging type, and fragility. Be conservative (round weight UP). " +
        `Respond ONLY with JSON: {"weight_kg":number,"dims_cm":{"l":n,"w":n,"h":n},` +
        `"packaging_type":"envelope|small_box|medium_box|large_box|barrel|fragile_crate",` +
        `"fragile":boolean,"confidence":0-1,"summary_fr":"1 short sentence","summary_en":"1 short sentence"}`,
      messages: [{ role: "user", content: description.slice(0, 2000) }],
    });
    const text = res.content.find((b) => b.type === "text")?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const parsed = aiSchema.parse(json);
    return {
      weightKg: parsed.weight_kg,
      dims: parsed.dims_cm,
      packagingType: parsed.packaging_type,
      fragile: parsed.fragile,
      confidence: parsed.confidence,
      summaryFr: parsed.summary_fr,
      summaryEn: parsed.summary_en,
      estimatedBy: "ai",
    };
  } catch {
    return null; // any failure → heuristic fallback
  }
}

export async function estimateParcel(description: string): Promise<Estimate> {
  if (hasAI()) {
    const ai = await aiEstimate(description);
    if (ai) return ai;
  }
  return heuristicEstimate(description);
}
