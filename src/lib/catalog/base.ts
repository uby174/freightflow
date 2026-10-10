// ─────────────────────────────────────────────────────────────────────────────
// SN Groupage — canonical freight catalog (SINGLE SOURCE OF TRUTH for pricing).
//
// A given item ALWAYS has the same fixed dimensions and weight, so it ALWAYS
// prices the same. The AI classifier may ONLY pick ids from this list; it never
// emits weights, dimensions, or prices. Price is a pure function of these rows
// (see pricing.ts) at €750/m³ with the 200 kg = 1 m³ volumetric rule.
//
// Vehicles use a flat rate (flatPriceCents); everything else is volumetric.
// Dimensions/weights are realistic, packed/boxed figures. Rates anchored on
// published market pricing (France Fret Express). Edit here → review → ship.
// ─────────────────────────────────────────────────────────────────────────────

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

export interface CatalogItem {
  id: string;
  labelFr: string;
  labelEn: string;
  class: ItemClass;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
  flatPriceCents: number | null; // non-null ⇒ vehicle flat rate, bypasses volumetric calc
  aliases: string[]; // FR+EN keyword hints (matched accent-insensitively)
}

export const BASE_CATALOG: readonly CatalogItem[] = [
  // ── PARCEL ──
  { id: "carton_s", labelFr: "Carton petit format", labelEn: "Small box", class: "parcel", lengthCm: 40, widthCm: 30, heightCm: 30, weightKg: 10, flatPriceCents: null, aliases: ["carton", "petit carton", "small box", "boite", "colis"] },
  { id: "carton_m", labelFr: "Carton format moyen", labelEn: "Medium box", class: "parcel", lengthCm: 55, widthCm: 35, heightCm: 30, weightKg: 15, flatPriceCents: null, aliases: ["carton moyen", "medium box", "carton standard"] },
  { id: "carton_l", labelFr: "Carton grand format", labelEn: "Large box", class: "parcel", lengthCm: 60, widthCm: 45, heightCm: 40, weightKg: 20, flatPriceCents: null, aliases: ["grand carton", "large box", "gros carton"] },
  { id: "carton_xl", labelFr: "Carton très grand format", labelEn: "XL box", class: "parcel", lengthCm: 65, widthCm: 50, heightCm: 45, weightKg: 25, flatPriceCents: null, aliases: ["carton xl", "extra large box", "tres grand carton"] },
  { id: "carton_documents", labelFr: "Carton de documents / livres", labelEn: "Box of documents / books", class: "parcel", lengthCm: 40, widthCm: 30, heightCm: 25, weightKg: 18, flatPriceCents: null, aliases: ["documents", "livres", "papiers", "books", "dossier"] },

  // ── BAG ──
  { id: "sac_badjock", labelFr: "Sac badjock / sac tissé", labelEn: "Woven bag (badjock)", class: "bag", lengthCm: 60, widthCm: 40, heightCm: 90, weightKg: 30, flatPriceCents: null, aliases: ["sac badjock", "badjock", "ghana bag", "woven bag", "sac cargo", "sac de voyage tisse"] },
  { id: "valise", labelFr: "Valise (grande)", labelEn: "Suitcase (large)", class: "bag", lengthCm: 75, widthCm: 50, heightCm: 30, weightKg: 20, flatPriceCents: null, aliases: ["valise", "grosse valise", "suitcase", "luggage", "bagage"] },
  { id: "sac_riz_25kg", labelFr: "Sac de riz / vivres 25 kg", labelEn: "Rice / food sack 25 kg", class: "bag", lengthCm: 70, widthCm: 40, heightCm: 15, weightKg: 25, flatPriceCents: null, aliases: ["sac de riz", "riz", "vivres", "rice", "food sack", "denrees"] },
  { id: "sac_plastique_costaud", labelFr: "Sac plastique renforcé", labelEn: "Heavy-duty plastic sack", class: "bag", lengthCm: 65, widthCm: 45, heightCm: 40, weightKg: 22, flatPriceCents: null, aliases: ["sac plastique", "poly sack", "sac renforce", "tote bag"] },
  { id: "sac_dos", labelFr: "Sac à dos / bagage cabine", labelEn: "Backpack / cabin bag", class: "bag", lengthCm: 50, widthCm: 35, heightCm: 25, weightKg: 8, flatPriceCents: null, aliases: ["sac a dos", "backpack", "bagage cabine", "cabin bag"] },

  // ── TV ──
  { id: "tv_32", labelFr: "Télévision 32 pouces", labelEn: "TV 32\"", class: "tv", lengthCm: 85, widthCm: 15, heightCm: 55, weightKg: 8, flatPriceCents: null, aliases: ["tv 32", "tele 32", "television 32", "32 pouces"] },
  { id: "tv_43", labelFr: "Télévision 43 pouces", labelEn: "TV 43\"", class: "tv", lengthCm: 105, widthCm: 18, heightCm: 68, weightKg: 13, flatPriceCents: null, aliases: ["tv 43", "tele 43", "television 43", "43 pouces"] },
  { id: "tv_55", labelFr: "Télévision 55 pouces", labelEn: "TV 55\"", class: "tv", lengthCm: 140, widthCm: 20, heightCm: 85, weightKg: 22, flatPriceCents: null, aliases: ["tv 55", "tele 55", "television 55", "55 pouces", "tv", "television", "televiseur", "ecran"] },
  { id: "tv_65", labelFr: "Télévision 65 pouces", labelEn: "TV 65\"", class: "tv", lengthCm: 160, widthCm: 22, heightCm: 98, weightKg: 28, flatPriceCents: null, aliases: ["tv 65", "tele 65", "television 65", "65 pouces"] },

  // ── TILES (weight-dominant) ──
  { id: "carreaux_pack_m2", labelFr: "Carreaux — pack 1 m²", labelEn: "Tiles — 1 m² pack", class: "tiles", lengthCm: 50, widthCm: 33, heightCm: 10, weightKg: 22, flatPriceCents: null, aliases: ["carreaux", "carrelage", "tiles", "faience", "ceramique"] },
  { id: "carreaux_palette", labelFr: "Carreaux — palette (~40 m²)", labelEn: "Tiles — full pallet (~40 m²)", class: "tiles", lengthCm: 120, widthCm: 100, heightCm: 100, weightKg: 900, flatPriceCents: null, aliases: ["palette carreaux", "tile pallet", "palette carrelage"] },

  // ── SMALL APPLIANCES ──
  { id: "micro_ondes", labelFr: "Four micro-ondes", labelEn: "Microwave oven", class: "appliance_small", lengthCm: 55, widthCm: 45, heightCm: 35, weightKg: 14, flatPriceCents: null, aliases: ["micro-ondes", "micro ondes", "microwave"] },
  { id: "mixeur_blender", labelFr: "Mixeur / blender", labelEn: "Blender / mixer", class: "appliance_small", lengthCm: 25, widthCm: 20, heightCm: 40, weightKg: 4, flatPriceCents: null, aliases: ["mixeur", "blender", "robot mixeur", "food processor"] },
  { id: "fer_a_repasser", labelFr: "Fer à repasser", labelEn: "Iron", class: "appliance_small", lengthCm: 30, widthCm: 15, heightCm: 15, weightKg: 2, flatPriceCents: null, aliases: ["fer a repasser", "iron", "fer"] },
  { id: "bouilloire", labelFr: "Bouilloire électrique", labelEn: "Electric kettle", class: "appliance_small", lengthCm: 25, widthCm: 20, heightCm: 25, weightKg: 2, flatPriceCents: null, aliases: ["bouilloire", "kettle"] },
  { id: "ventilateur", labelFr: "Ventilateur sur pied", labelEn: "Standing fan", class: "appliance_small", lengthCm: 40, widthCm: 40, heightCm: 120, weightKg: 6, flatPriceCents: null, aliases: ["ventilateur", "ventilo", "fan", "standing fan"] },
  { id: "plaque_cuisson", labelFr: "Plaque de cuisson", labelEn: "Countertop cooktop", class: "appliance_small", lengthCm: 60, widthCm: 50, heightCm: 15, weightKg: 9, flatPriceCents: null, aliases: ["plaque de cuisson", "rechaud", "cooktop", "hot plate", "hob"] },

  // ── LARGE APPLIANCES ──
  { id: "frigo_standard", labelFr: "Réfrigérateur standard", labelEn: "Standard fridge", class: "appliance_large", lengthCm: 60, widthCm: 65, heightCm: 180, weightKg: 70, flatPriceCents: null, aliases: ["frigo", "refrigerateur", "fridge", "refrigerator"] },
  { id: "frigo_americain", labelFr: "Réfrigérateur américain", labelEn: "American fridge", class: "appliance_large", lengthCm: 90, widthCm: 75, heightCm: 180, weightKg: 110, flatPriceCents: null, aliases: ["frigo americain", "side by side", "american fridge"] },
  { id: "congelateur", labelFr: "Congélateur", labelEn: "Freezer", class: "appliance_large", lengthCm: 100, widthCm: 65, heightCm: 90, weightKg: 55, flatPriceCents: null, aliases: ["congelateur", "freezer", "congelateur coffre"] },
  { id: "lave_linge", labelFr: "Lave-linge", labelEn: "Washing machine", class: "appliance_large", lengthCm: 60, widthCm: 60, heightCm: 85, weightKg: 65, flatPriceCents: null, aliases: ["lave-linge", "lave linge", "machine a laver", "washing machine"] },
  { id: "lave_vaisselle", labelFr: "Lave-vaisselle", labelEn: "Dishwasher", class: "appliance_large", lengthCm: 60, widthCm: 60, heightCm: 85, weightKg: 45, flatPriceCents: null, aliases: ["lave-vaisselle", "lave vaisselle", "dishwasher"] },
  { id: "gaziniere", labelFr: "Cuisinière / gazinière", labelEn: "Cooker / stove", class: "appliance_large", lengthCm: 60, widthCm: 60, heightCm: 90, weightKg: 45, flatPriceCents: null, aliases: ["gaziniere", "cuisiniere", "cooker", "stove", "four", "oven"] },
  { id: "clim_split", labelFr: "Climatiseur split (2 blocs)", labelEn: "AC unit (split)", class: "appliance_large", lengthCm: 90, widthCm: 35, heightCm: 30, weightKg: 25, flatPriceCents: null, aliases: ["climatiseur", "clim", "air conditioner", "ac unit", "split"] },

  // ── FURNITURE ──
  { id: "matelas_1place", labelFr: "Matelas une place", labelEn: "Single mattress", class: "furniture", lengthCm: 190, widthCm: 90, heightCm: 20, weightKg: 15, flatPriceCents: null, aliases: ["matelas 1 place", "single mattress", "matelas simple"] },
  { id: "matelas_2places", labelFr: "Matelas deux places", labelEn: "Double mattress", class: "furniture", lengthCm: 190, widthCm: 140, heightCm: 25, weightKg: 25, flatPriceCents: null, aliases: ["matelas 2 places", "double mattress", "queen mattress", "matelas"] },
  { id: "canape_2places", labelFr: "Canapé 2 places", labelEn: "2-seat sofa", class: "furniture", lengthCm: 160, widthCm: 90, heightCm: 85, weightKg: 45, flatPriceCents: null, aliases: ["canape 2 places", "2 seater sofa", "loveseat"] },
  { id: "canape_3places", labelFr: "Canapé 3 places", labelEn: "3-seat sofa", class: "furniture", lengthCm: 210, widthCm: 90, heightCm: 85, weightKg: 60, flatPriceCents: null, aliases: ["canape 3 places", "3 seater sofa", "couch", "canape", "sofa", "salon"] },
  { id: "armoire", labelFr: "Armoire / penderie", labelEn: "Wardrobe", class: "furniture", lengthCm: 120, widthCm: 60, heightCm: 200, weightKg: 55, flatPriceCents: null, aliases: ["armoire", "penderie", "wardrobe", "closet"] },
  { id: "table_a_manger", labelFr: "Table de salle à manger", labelEn: "Dining table", class: "furniture", lengthCm: 140, widthCm: 80, heightCm: 75, weightKg: 25, flatPriceCents: null, aliases: ["table a manger", "table salle a manger", "dining table", "table"] },
  { id: "chaise", labelFr: "Chaise", labelEn: "Chair", class: "furniture", lengthCm: 45, widthCm: 45, heightCm: 90, weightKg: 5, flatPriceCents: null, aliases: ["chaise", "chair"] },
  { id: "cadre_de_lit", labelFr: "Cadre de lit (démonté)", labelEn: "Bed frame (disassembled)", class: "furniture", lengthCm: 150, widthCm: 20, heightCm: 20, weightKg: 30, flatPriceCents: null, aliases: ["cadre de lit", "sommier", "bed frame", "lit"] },

  // ── PALLET ──
  { id: "palette_demi", labelFr: "Demi-palette", labelEn: "Half pallet", class: "pallet", lengthCm: 80, widthCm: 60, heightCm: 60, weightKg: 150, flatPriceCents: null, aliases: ["demi palette", "half pallet", "mini palette"] },
  { id: "palette_standard", labelFr: "Palette standard", labelEn: "Standard pallet", class: "pallet", lengthCm: 120, widthCm: 80, heightCm: 100, weightKg: 300, flatPriceCents: null, aliases: ["palette", "pallet", "palette standard", "euro pallet"] },
  { id: "palette_haute", labelFr: "Palette pleine hauteur", labelEn: "Full-height pallet", class: "pallet", lengthCm: 120, widthCm: 80, heightCm: 180, weightKg: 500, flatPriceCents: null, aliases: ["palette haute", "full height pallet", "palette complete"] },

  // ── OTHER ──
  { id: "velo", labelFr: "Vélo (emballé)", labelEn: "Bicycle (boxed)", class: "other", lengthCm: 130, widthCm: 20, heightCm: 75, weightKg: 15, flatPriceCents: null, aliases: ["velo", "bicycle", "bike", "bicyclette"] },
  { id: "groupe_electrogene", labelFr: "Groupe électrogène", labelEn: "Generator", class: "other", lengthCm: 70, widthCm: 55, heightCm: 60, weightKg: 60, flatPriceCents: null, aliases: ["groupe electrogene", "generator", "generatrice", "groupe electro"] },
  { id: "jouets_carton", labelFr: "Carton de jouets", labelEn: "Box of toys", class: "other", lengthCm: 50, widthCm: 40, heightCm: 40, weightKg: 12, flatPriceCents: null, aliases: ["jouets", "toys", "carton jouets"] },
  { id: "item_non_repertorie", labelFr: "Article divers", labelEn: "General item", class: "other", lengthCm: 55, widthCm: 45, heightCm: 40, weightKg: 20, flatPriceCents: null, aliases: ["autre", "divers", "misc", "general"] },

  // ── VEHICLES (flat rate — €650 citadine / €750 van anchor) ──
  { id: "moto_scooter", labelFr: "Scooter", labelEn: "Scooter", class: "vehicle_moto", lengthCm: 180, widthCm: 70, heightCm: 115, weightKg: 100, flatPriceCents: 30000, aliases: ["scooter", "moto scooter"] },
  { id: "moto_standard", labelFr: "Moto", labelEn: "Motorcycle", class: "vehicle_moto", lengthCm: 210, widthCm: 80, heightCm: 120, weightKg: 160, flatPriceCents: 35000, aliases: ["moto", "motorcycle", "motorbike"] },
  { id: "voiture_citadine", labelFr: "Voiture citadine", labelEn: "City car", class: "vehicle_car", lengthCm: 380, widthCm: 165, heightCm: 150, weightKg: 1050, flatPriceCents: 65000, aliases: ["voiture citadine", "petite voiture", "citadine", "small car", "city car", "clio", "polo"] },
  { id: "voiture_berline", labelFr: "Voiture berline", labelEn: "Sedan", class: "vehicle_car", lengthCm: 460, widthCm: 178, heightCm: 145, weightKg: 1350, flatPriceCents: 70000, aliases: ["voiture berline", "grande voiture", "berline", "sedan", "saloon", "voiture", "car"] },
  { id: "voiture_suv", labelFr: "SUV / 4x4", labelEn: "SUV / 4x4", class: "vehicle_car", lengthCm: 480, widthCm: 190, heightCm: 170, weightKg: 1700, flatPriceCents: 90000, aliases: ["voiture suv", "suv", "4x4", "crossover", "jeep"] },
  { id: "van_utilitaire", labelFr: "Camionnette / utilitaire", labelEn: "Small van", class: "vehicle_car", lengthCm: 500, widthCm: 190, heightCm: 220, weightKg: 1900, flatPriceCents: 75000, aliases: ["utilitaire", "camionnette", "small van", "kangoo", "partner"] },
  { id: "van_grand", labelFr: "Grand utilitaire / fourgon", labelEn: "Large van", class: "vehicle_car", lengthCm: 600, widthCm: 210, heightCm: 250, weightKg: 2400, flatPriceCents: 95000, aliases: ["grand utilitaire", "fourgon", "large van", "transit", "sprinter"] },
] as const;


/** Default fallback id for a described-but-unrecognised physical good. */
export const DEFAULT_ITEM_ID = "item_non_repertorie";
