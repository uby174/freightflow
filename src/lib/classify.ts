// Classify free text → catalog line items. The AI's ONLY job is to pick catalog
// ids + quantities; it never emits weights, dimensions, or prices. Output is
// validated against the real catalog enum, so an invalid/hallucinated id can
// never reach pricing. When the AI is unavailable, a deterministic keyword
// matcher over the SAME catalog is used. Either way: unmatched text or low
// confidence → we defer to a human quote rather than invent a price.

import { z } from "zod";
import {
  ANTHROPIC_MODEL,
  CLASSIFY_MIN_CONFIDENCE,
  MAX_LINE_QUANTITY,
  MAX_ORDER_M3,
} from "./config";
import { hasAI, getAnthropicKey } from "./secrets";
import { CATALOG, CATALOG_IDS } from "./catalog/catalog";
import { matchDescription, normalize, type MatchLine } from "./catalog/match";
import { priceQuote } from "./pricing";

export interface ClassifyResult {
  lines: MatchLine[];
  unmatched: string[];
  confidence: number;
  needsReview: boolean;
  reviewReason?: string;
  source: "ai" | "keyword" | "cache";
}

// In-process pin: identical normalized text resolves to identical lines for the
// life of the server. (Order-level pinning in the DB is the durable guarantee;
// this is a cheap consistency + cost win. A SQLite cache is the next hardening.)
const CACHE = new Map<string, ClassifyResult>();

const lineSchema = z.object({
  catalog_id: z.enum(CATALOG_IDS),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});
const aiSchema = z.object({
  lines: z.array(lineSchema),
  unmatched: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

function gate(
  lines: MatchLine[],
  unmatched: string[],
  confidence: number,
  issues: string[],
  source: ClassifyResult["source"]
): ClassifyResult {
  let needsReview = false;
  let reviewReason: string | undefined;

  if (lines.length === 0) {
    needsReview = true;
    reviewReason = "no_match";
  } else if (unmatched.length > 0) {
    needsReview = true;
    reviewReason = "partial_match";
  } else if (issues.length > 0) {
    needsReview = true;
    reviewReason = issues[0];
  } else if (confidence < CLASSIFY_MIN_CONFIDENCE) {
    needsReview = true;
    reviewReason = "low_confidence";
  } else if (lines.length > 30) {
    needsReview = true;
    reviewReason = "too_many_lines";
  } else {
    const { chargeableM3 } = priceQuote(lines);
    if (chargeableM3 > MAX_ORDER_M3) {
      needsReview = true;
      reviewReason = "oversized";
    }
  }

  return { lines, unmatched, confidence, needsReview, reviewReason, source };
}

async function aiClassify(description: string): Promise<ClassifyResult | null> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: getAnthropicKey() });
    const catalogList = CATALOG.map(
      (c) => `${c.id}: ${c.labelFr} / ${c.labelEn}`
    ).join("\n");

    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 700,
      temperature: 0, // greedy decoding — removes sampling randomness
      system:
        "You classify what a customer wants to ship (France → Cameroon) into catalog line items. " +
        "You may ONLY use catalog_id values from this exact list. Never invent an id. " +
        "Never output weight, size, or price — you do not have that information. " +
        "If a phrase does not clearly match any catalog item, put the raw phrase in 'unmatched' " +
        "instead of guessing. Prefer 'unmatched' over a wrong match.\n\nCATALOG (id: FR / EN):\n" +
        catalogList,
      tools: [
        {
          name: "emit_lines",
          description: "Return the catalog line items for the shipment.",
          input_schema: {
            type: "object",
            properties: {
              lines: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    catalog_id: { type: "string", enum: [...CATALOG_IDS] },
                    quantity: { type: "integer", minimum: 1, maximum: MAX_LINE_QUANTITY },
                  },
                  required: ["catalog_id", "quantity"],
                },
              },
              unmatched: { type: "array", items: { type: "string" } },
              confidence: { type: "number", minimum: 0, maximum: 1 },
            },
            required: ["lines", "unmatched", "confidence"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "emit_lines" },
      messages: [{ role: "user", content: description.slice(0, 1500) }],
    });

    const tool = res.content.find((b) => b.type === "tool_use");
    if (!tool || tool.type !== "tool_use") return null;
    const parsed = aiSchema.safeParse(tool.input);
    if (!parsed.success) return null;

    // Merge duplicate ids, clamp, canonical order — same normalization the
    // keyword path uses, so both paths are structurally identical.
    const byId = new Map<string, number>();
    for (const l of parsed.data.lines) {
      byId.set(l.catalog_id, (byId.get(l.catalog_id) ?? 0) + l.quantity);
    }
    const lines: MatchLine[] = [...byId.entries()]
      .map(([catalogId, quantity]) => ({
        catalogId,
        quantity: Math.min(quantity, MAX_LINE_QUANTITY),
      }))
      .sort((a, b) => a.catalogId.localeCompare(b.catalogId));

    return gate(lines, parsed.data.unmatched, parsed.data.confidence, [], "ai");
  } catch {
    return null;
  }
}

export async function classifyDescription(
  description: string
): Promise<ClassifyResult> {
  const key = normalize(description);
  const cached = CACHE.get(key);
  if (cached) return { ...cached, source: "cache" };

  let result: ClassifyResult | null = null;
  if (hasAI()) result = await aiClassify(description);

  if (!result) {
    const m = matchDescription(description);
    // Keyword confidence: high when clean, lower when nothing/partial matched.
    const confidence =
      m.lines.length > 0 && m.unmatched.length === 0 && m.issues.length === 0
        ? 0.8
        : 0.4;
    result = gate(m.lines, m.unmatched, confidence, m.issues, "keyword");
  }

  CACHE.set(key, result);
  return result;
}
