// The ACTIVE catalog = the tenant's catalog. Everything that prices or classifies
// imports from here, so one tenant switch re-points the whole engine.
import { getTenant } from "@/tenant";
import type { CatalogItem } from "./base";

export type { CatalogItem, ItemClass } from "./base";
export { DEFAULT_ITEM_ID } from "./base";

export const CATALOG: readonly CatalogItem[] = getTenant().catalog;
export const CATALOG_IDS = CATALOG.map((c) => c.id) as [string, ...string[]];
export const CATALOG_BY_ID: ReadonlyMap<string, CatalogItem> = new Map(
  CATALOG.map((c) => [c.id, c])
);
