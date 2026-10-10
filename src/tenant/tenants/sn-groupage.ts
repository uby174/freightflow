import type { Tenant } from "../types";
import { BASE_CATALOG } from "@/lib/catalog/base";

// Demo tenant #1 — real brand facts from SN Groupage Solutions' flyers.
export const snGroupage: Tenant = {
  id: "sn-groupage",
  name: "SN Groupage Solutions",
  shortName: "SN",
  tagline: {
    fr: "Transport de colis en toute confiance",
    en: "Shipping you can trust",
  },
  parcelPrefix: "SN",
  defaultLocale: "fr",
  colors: {
    primary: "#16234d",
    primaryDark: "#0e1833",
    secondary: "#2f3fae",
    accent: "#d21f28",
    accentDark: "#ab141c",
    gold: "#f4b81e",
    goldDark: "#d99e10",
  },
  contact: {
    phones: ["07 53 13 25 03", "06 05 77 51 01"],
    phoneDest: "+237 657 748 808",
    whatsapp: "33605775101",
    email: "nsgroupages@gmail.com", // CONFIRM before go-live (flyer was cut off)
  },
  lanes: [
    {
      id: "alsace-cameroun",
      originRegion: "Alsace",
      originCountry: "France",
      terminal: {
        name: "Terminal SN Groupage",
        address: "Terminal SN Groupage, 67240 Bischwiller, France",
        city: "Bischwiller",
        lat: 48.7667,
        lng: 7.8583,
      },
      port: "Le Havre",
      destCountry: { fr: "Cameroun", en: "Cameroon", frArticle: "le Cameroun" },
      destCities: ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Buea", "Limbe", "Kribi"],
      transitWeeks: [4, 8],
      // Anchored on published market rates (France Fret Express): €750/m³, 200 kg = 1 m³
      rate: { perM3Cents: 75000, kgPerM3: 200, minFreightCents: 4500 },
    },
  ],
  pickup: { baseCents: 500, perKmCents: 19, maxKm: 200 },
  departures: { everyDays: 14, cutoffDays: 2, transitDays: 25, labelPrefix: "Conteneur SN-" },
  catalog: BASE_CATALOG,
  forbiddenTerms: [
    ["TransGlobal Express", "SN Groupage Solutions"],
    ["TransGlobal", "SN Groupage Solutions"],
    ["TGE Cameroun SARL", "notre agent local"],
    ["TGE", "SN Groupage Solutions"],
    ["MSC AMANDA", "le navire"],
    ["MSC", "notre transporteur maritime"],
    ["Maersk", "notre transporteur maritime"],
    ["CMA CGM", "notre transporteur maritime"],
    ["DHL", "notre réseau"],
    ["Express Union", "notre livreur local"],
    ["Kehl", "notre région"],
  ],
  mockCarrier: {
    name: "TransGlobal Express",
    depot: "Kehl",
    vessel: "MSC AMANDA",
    localAgent: "TGE Cameroun SARL",
    courier: "Express Union",
  },
};
