import type { Tenant } from "../types";
import { BASE_CATALOG } from "@/lib/catalog/base";

// Demo tenant #2 — FICTIONAL. Exists to prove the platform is white-label:
// different brand, lane, colours, rates and parcel prefix from one config file.
export const dakarExpress: Tenant = {
  id: "dakar-express",
  name: "Dakar Express Cargo",
  shortName: "DX",
  tagline: {
    fr: "Paris → Dakar, chaque semaine",
    en: "Paris → Dakar, every week",
  },
  parcelPrefix: "DX",
  defaultLocale: "fr",
  colors: {
    primary: "#0f3d3e",
    primaryDark: "#082626",
    secondary: "#1b7f7a",
    accent: "#f26b1d",
    accentDark: "#c9540f",
    gold: "#ffc857",
    goldDark: "#d9a53a",
  },
  contact: {
    phones: ["01 23 45 67 89"],
    phoneDest: "+221 77 000 00 00",
    whatsapp: "33123456789",
    email: "contact@dakar-express.example",
  },
  lanes: [
    {
      id: "idf-senegal",
      originRegion: "Île-de-France",
      originCountry: "France",
      terminal: {
        name: "Entrepôt Dakar Express",
        address: "Entrepôt Dakar Express, 92230 Gennevilliers, France",
        city: "Gennevilliers",
        lat: 48.9333,
        lng: 2.2833,
      },
      port: "Le Havre",
      destCountry: { fr: "Sénégal", en: "Senegal", frArticle: "le Sénégal" },
      destCities: ["Dakar", "Thiès", "Saint-Louis", "Touba", "Ziguinchor"],
      transitWeeks: [2, 4],
      rate: { perM3Cents: 65000, kgPerM3: 200, minFreightCents: 4000 },
    },
  ],
  pickup: { baseCents: 800, perKmCents: 25, maxKm: 120 },
  departures: { everyDays: 7, cutoffDays: 2, transitDays: 12, labelPrefix: "Conteneur DX-" },
  catalog: BASE_CATALOG.map((c) =>
    c.flatPriceCents == null ? c : { ...c, flatPriceCents: Math.round(c.flatPriceCents * 0.9) }
  ),
  forbiddenTerms: [
    ["TransGlobal Express", "Dakar Express Cargo"],
    ["TransGlobal", "Dakar Express Cargo"],
    ["TGE Sénégal SARL", "notre agent local"],
    ["TGE", "Dakar Express Cargo"],
    ["MSC AMANDA", "le navire"],
    ["MSC", "notre transporteur maritime"],
    ["Maersk", "notre transporteur maritime"],
    ["CMA CGM", "notre transporteur maritime"],
    ["DHL", "notre réseau"],
    ["Sénégal Poste Express", "notre livreur local"],
    ["Rouen", "notre région"],
  ],
  mockCarrier: {
    name: "TransGlobal Express",
    depot: "Rouen",
    vessel: "MSC AMANDA",
    localAgent: "TGE Sénégal SARL",
    courier: "Sénégal Poste Express",
  },
};
