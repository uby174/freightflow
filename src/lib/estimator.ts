import { z } from "zod";
import { ANTHROPIC_MODEL, hasAI } from "./config";

export type ItemClass =
  | "parcel"
  | "bag"
  | "tv"
  | "tiles"
  | "appliance_small"
  | "appliance_large"
  | "furniture"
  | "pallet"
  | "vehicle_moto"
  | "vehicle_car"
  | "other";

export interface Estimate {
  weightKg: number;
  volumeM3: number;
  dims: { l: number; w: number; h: number };
  itemClass: ItemClass;
  fragile: boolean;
  confidence: number;
  summaryFr: string;
  summaryEn: string;
  estimatedBy: "ai" | "heuristic";
}

const ITEM_CLASSES = [
  "parcel",
  "bag",
  "tv",
  "tiles",
  "appliance_small",
  "appliance_large",
  "furniture",
  "pallet",
  "vehicle_moto",
  "vehicle_car",
  "other",
] as const;

// Higher = "bulkier / dominates the shipment class"
const CLASS_RANK: Record<ItemClass, number> = {
  vehicle_car: 100,
  vehicle_moto: 90,
  pallet: 80,
  appliance_large: 70,
  furniture: 60,
  tiles: 50,
  appliance_small: 40,
  tv: 35,
  bag: 20,
  parcel: 10,
  other: 5,
};

const aiSchema = z.object({
  weight_kg: z.number().min(0.1).max(3000),
  dims_cm: z.object({
    l: z.number().min(1).max(600),
    w: z.number().min(1).max(600),
    h: z.number().min(1).max(600),
  }),
  item_class: z.enum(ITEM_CLASSES),
  fragile: z.boolean(),
  confidence: z.number().min(0).max(1),
  summary_fr: z.string(),
  summary_en: z.string(),
});

// ── Deterministic fallback: keyword × weight/volume table (SN cargo mix) ──
// vol is in litres; volumeM3 = totalLitres / 1000
const ITEMS: Array<{
  re: RegExp;
  kg: number;
  vol: number;
  cls: ItemClass;
  fragile?: boolean;
}> = [
  { re: /voiture|v[ée]hicule|\bcar\b|berline|4x4|suv/i, kg: 1300, vol: 12000, cls: "vehicle_car" },
  { re: /moto|scooter|motorcycle|motorbike/i, kg: 120, vol: 1200, cls: "vehicle_moto" },
  { re: /palette|pallet/i, kg: 300, vol: 1500, cls: "pallet" },
  { re: /r[ée]frig[ée]rateur|frigo|fridge|cong[ée]lateur|freezer/i, kg: 60, vol: 400, cls: "appliance_large", fragile: true },
  { re: /machine [àa] laver|lave-linge|lave-vaisselle|washing machine|dishwasher|cuisini[èe]re|four\b|oven|gazini[èe]re/i, kg: 65, vol: 350, cls: "appliance_large", fragile: true },
  { re: /canap[ée]|sofa|salon|fauteuil|armchair/i, kg: 45, vol: 1800, cls: "furniture" },
  { re: /armoire|wardrobe|commode|table|lit\b|bed|matelas|mattress|[ée]tag[èe]re|meuble/i, kg: 40, vol: 1500, cls: "furniture" },
  { re: /lampe|lampadaire|lamp|luminaire/i, kg: 8, vol: 200, cls: "furniture", fragile: true },
  { re: /carreaux|carrelage|tiles|faïence|fa[ïi]ence/i, kg: 300, vol: 800, cls: "tiles" },
  { re: /t[ée]l[ée]viseur|\btv\b|t[ée]l[ée]\b|[ée]cran|screen|television/i, kg: 15, vol: 120, cls: "tv", fragile: true },
  { re: /micro-?onde|microwave|blender|mixeur|fer [àa] repasser|iron|bouilloire|kettle|grille-pain|toaster|petit [ée]lectrom[ée]nager/i, kg: 5, vol: 40, cls: "appliance_small" },
  { re: /sac|badjock|ballot|\bbag\b|valise|suitcase/i, kg: 25, vol: 150, cls: "bag" },
  { re: /carton|colis|box|parcel/i, kg: 15, vol: 90, cls: "parcel" },
  { re: /v[êe]tement|habits?|clothes|clothing|linge|chaussure|shoes/i, kg: 10, vol: 60, cls: "parcel" },
  { re: /riz|rice|nourriture|food|provisions|denr[ée]e/i, kg: 25, vol: 40, cls: "parcel" },
  { re: /pi[èe]ces? d[ée]tach[ée]es?|spare parts?|pi[èe]ces auto/i, kg: 20, vol: 60, cls: "other" },
];

function pickCube(volLitres: number) {
  const side = Math.max(20, Math.round(Math.cbrt(Math.max(volLitres, 1) * 1000)));
  return { l: side, w: side, h: side };
}

function heuristicEstimate(description: string): Estimate {
  let weight = 0;
  let volume = 0;
  let fragile = false;
  let bestClass: ItemClass = "parcel";
  const matched: string[] = [];

  for (const item of ITEMS) {
    const idx = description.search(item.re);
    if (idx < 0) continue;
    const before = description.slice(Math.max(0, idx - 12), idx);
    const qty = Number((before.match(/(\d+)\s*$/) ?? [])[1] ?? 1) || 1;
    const n = Math.min(qty, 30);
    weight += item.kg * n;
    volume += item.vol * n;
    if (item.fragile) fragile = true;
    if (CLASS_RANK[item.cls] > CLASS_RANK[bestClass]) bestClass = item.cls;
    matched.push(item.re.source);
  }

  if (weight === 0) {
    weight = 15;
    volume = 90;
    bestClass = "parcel";
  }

  const volumeM3 = Math.round((volume / 1000) * 100) / 100;
  return {
    weightKg: Math.round(weight * 10) / 10,
    volumeM3,
    dims: pickCube(volume),
    itemClass: bestClass,
    fragile,
    confidence: matched.length > 0 ? 0.55 : 0.3,
    summaryFr: `Estimation : ~${Math.round(weight)} kg · ~${volumeM3} m³`,
    summaryEn: `Estimate: ~${Math.round(weight)} kg · ~${volumeM3} m³`,
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
        "You estimate groupage cargo for SN Groupage Solutions, a Bischwiller (France) → Douala (Cameroon) " +
        "sea-freight consolidator. Customers ship anything from a carton to a car: parcels, bags (sacs badjock), " +
        "TVs, tiles, small and large appliances, furniture, pallets, motorcycles and cars. " +
        "Given a description (French or English), estimate total weight (kg), overall dimensions (cm), the dominant " +
        "cargo class, and fragility. Round weight and volume UP. " +
        `Respond ONLY with JSON: {"weight_kg":number,"dims_cm":{"l":n,"w":n,"h":n},` +
        `"item_class":"parcel|bag|tv|tiles|appliance_small|appliance_large|furniture|pallet|vehicle_moto|vehicle_car|other",` +
        `"fragile":boolean,"confidence":0-1,"summary_fr":"1 short sentence","summary_en":"1 short sentence"}`,
      messages: [{ role: "user", content: description.slice(0, 2000) }],
    });
    const text = res.content.find((b) => b.type === "text")?.text ?? "";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const parsed = aiSchema.parse(json);
    const volumeM3 =
      Math.round((parsed.dims_cm.l * parsed.dims_cm.w * parsed.dims_cm.h) / 1e6 * 100) / 100;
    return {
      weightKg: parsed.weight_kg,
      volumeM3,
      dims: parsed.dims_cm,
      itemClass: parsed.item_class,
      fragile: parsed.fragile,
      confidence: parsed.confidence,
      summaryFr: parsed.summary_fr,
      summaryEn: parsed.summary_en,
      estimatedBy: "ai",
    };
  } catch {
    return null;
  }
}

export async function estimateParcel(description: string): Promise<Estimate> {
  if (hasAI()) {
    const ai = await aiEstimate(description);
    if (ai) return ai;
  }
  return heuristicEstimate(description);
}
