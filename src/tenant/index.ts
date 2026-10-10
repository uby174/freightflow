// Tenant resolution. NEXT_PUBLIC_ so the same id is inlined into the client bundle
// and read by the server — one variable, one tenant per deployment.

import type { Tenant, Lane, Locale } from "./types";
import { snGroupage } from "./tenants/sn-groupage";
import { dakarExpress } from "./tenants/dakar-express";

export type { Tenant, Lane, Locale };

export const TENANTS: Record<string, Tenant> = {
  [snGroupage.id]: snGroupage,
  [dakarExpress.id]: dakarExpress,
};

export const DEFAULT_TENANT_ID = snGroupage.id;

export function getTenant(): Tenant {
  const id = process.env.NEXT_PUBLIC_FREIGHTFLOW_TENANT?.trim() || DEFAULT_TENANT_ID;
  const t = TENANTS[id];
  if (!t) throw new Error(`Unknown tenant "${id}". Known: ${Object.keys(TENANTS).join(", ")}`);
  return t;
}

/** The lane customers book on (W1: a tenant books on its first lane). */
export function bookingLane(t: Tenant = getTenant()): Lane {
  return t.lanes[0];
}

const eur = (cents: number, locale: Locale) =>
  (cents / 100).toLocaleString(locale === "fr" ? "fr-FR" : "en-GB", {
    style: "currency",
    currency: "EUR",
  });

/**
 * Values interpolated into i18n strings and server templates as `{name}`.
 * The single place that turns tenant data into copy variables.
 */
export function tenantVars(locale: Locale, t: Tenant = getTenant()): Record<string, string> {
  const lane = bookingLane(t);
  const cities = lane.destCities.slice(0, 2);
  return {
    brand: t.name,
    short: t.shortName,
    tagline: t.tagline[locale],
    origin: lane.originRegion,
    originCountry: lane.originCountry,
    destCountry: lane.destCountry[locale],
    destCountryArt: locale === "fr" ? (lane.destCountry.frArticle ?? lane.destCountry.fr) : lane.destCountry.en,
    portFrom: locale === "fr" ? (lane.port.startsWith("Le ") ? "du " + lane.port.slice(3) : "de " + lane.port) : "from " + lane.port,
    destCities: cities.join(locale === "fr" ? " et " : " and "),
    destCitiesDash: cities.join("–"),
    primaryCity: lane.destCities[0],
    port: lane.port,
    terminalCity: lane.terminal.city,
    terminalAddress: lane.terminal.address,
    terminalName: lane.terminal.name,
    transitMin: String(lane.transitWeeks[0]),
    transitMax: String(lane.transitWeeks[1]),
    pickupBase: eur(t.pickup.baseCents, locale),
    pickupPerKm: eur(t.pickup.perKmCents, locale),
    pickupMaxKm: String(t.pickup.maxKm),
    ratePerM3: String(lane.rate.perM3Cents / 100),
    kgPerM3: String(lane.rate.kgPerM3),
    minFreight: String(lane.rate.minFreightCents / 100),
    prefix: t.parcelPrefix,
  };
}

export function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
