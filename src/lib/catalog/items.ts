// Shared validation for quote items (catalog refs + custom boxes), used by the
// quote and order APIs so both accept and pin the same shapes.

import { z } from "zod";
import {
  MAX_LINE_QUANTITY,
  CUSTOM_MIN_CM,
  CUSTOM_MAX_CM,
  CUSTOM_MIN_KG,
  CUSTOM_MAX_KG,
} from "../config";
import { CATALOG_BY_ID } from "./catalog";
import type { QuoteItem } from "../pricing";

export const catalogRefSchema = z.object({
  catalogId: z.string(),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
});

export const customItemSchema = z.object({
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
  custom: z.object({
    lengthCm: z.number().min(CUSTOM_MIN_CM).max(CUSTOM_MAX_CM),
    widthCm: z.number().min(CUSTOM_MIN_CM).max(CUSTOM_MAX_CM),
    heightCm: z.number().min(CUSTOM_MIN_CM).max(CUSTOM_MAX_CM),
    weightKg: z.number().min(CUSTOM_MIN_KG).max(CUSTOM_MAX_KG),
    labelFr: z.string().max(80).optional(),
    labelEn: z.string().max(80).optional(),
  }),
});

export const quoteItemSchema = z.union([customItemSchema, catalogRefSchema]);

/** Keep only valid items: catalog refs must exist; custom boxes must be in bounds. */
export function coerceQuoteItems(raw: unknown): QuoteItem[] {
  const parsed = z.array(quoteItemSchema).safeParse(raw);
  if (!parsed.success) return [];
  return parsed.data.filter((i) =>
    "custom" in i ? true : CATALOG_BY_ID.has(i.catalogId)
  ) as QuoteItem[];
}
