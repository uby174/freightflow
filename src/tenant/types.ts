// A tenant is everything that makes one shipping company's site: brand, lane(s),
// rates, catalog, contacts. The platform code reads ONLY from this shape.
// New client = new file in ./tenants + NEXT_PUBLIC_FREIGHTFLOW_TENANT=<id>.

import type { CatalogItem } from "@/lib/catalog/base";

export type Locale = "fr" | "en";

export interface Lane {
  id: string;
  originRegion: string; // marketing origin, e.g. "Alsace"
  originCountry: string; // "France"
  terminal: { name: string; address: string; city: string; lat: number; lng: number };
  port: string; // sea departure port, e.g. "Le Havre"
  destCountry: { fr: string; en: string; frArticle?: string }; // frArticle: "le Cameroun"
  destCities: string[]; // first = port of arrival / primary city
  transitWeeks: [number, number]; // door-to-door range
  rate: { perM3Cents: number; kgPerM3: number; minFreightCents: number };
}

export interface Tenant {
  id: string;
  name: string; // "SN Groupage Solutions"
  shortName: string; // "SN" — logo badge + stamps
  tagline: { fr: string; en: string };
  parcelPrefix: string; // "SN" → SN-2026-XXXXXX
  defaultLocale: Locale;
  colors: {
    primary: string;
    primaryDark: string;
    secondary: string;
    accent: string;
    accentDark: string;
    gold: string;
    goldDark: string;
  };
  contact: {
    phones: string[]; // origin-country numbers, display format
    phoneDest?: string; // destination-country number
    whatsapp: string; // wa.me digits
    email: string;
  };
  lanes: Lane[]; // lanes[0] is the booking lane in W1
  pickup: { baseCents: number; perKmCents: number; maxKm: number };
  departures: {
    everyDays: number;
    cutoffDays: number;
    transitDays: number;
    labelPrefix: string; // "Conteneur SN-"
  };
  catalog: readonly CatalogItem[];
  // White-label deny-list: [term, replacement]. Partner names must never reach customers.
  forbiddenTerms: Array<[string, string]>;
  // Fake-carrier identity used by the mock adapter (so the scrubber is exercised).
  mockCarrier: { name: string; depot: string; vessel: string; localAgent: string; courier: string };
}
