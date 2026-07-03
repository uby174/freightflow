"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Locale = "fr" | "en";

const dict = {
  // ── Shared ──
  brand: { fr: "CamFret", en: "CamFret" },
  tagline: {
    fr: "Vos colis pour le Cameroun, en toute confiance",
    en: "Your parcels to Cameroon, with total confidence",
  },
  nav_track: { fr: "Suivre un colis", en: "Track a parcel" },
  nav_book: { fr: "Envoyer un colis", en: "Send a parcel" },
  nav_how: { fr: "Comment ça marche", en: "How it works" },

  // ── Hero / quote widget ──
  hero_title: {
    fr: "Envoyez vos colis au Cameroun depuis Strasbourg",
    en: "Send your parcels to Cameroon from Strasbourg",
  },
  hero_sub: {
    fr: "Décrivez ce que vous envoyez — notre assistant estime l'emballage et le prix en quelques secondes. Départs réguliers vers Douala et Yaoundé.",
    en: "Describe what you're sending — our assistant estimates packaging and price in seconds. Regular departures to Douala and Yaoundé.",
  },
  quote_placeholder: {
    fr: "Ex. : 2 valises de vêtements, 1 ordinateur portable, 1 sac de riz 25 kg…",
    en: "E.g.: 2 suitcases of clothes, 1 laptop, one 25 kg bag of rice…",
  },
  quote_button: { fr: "Estimer mon envoi", en: "Estimate my shipment" },
  quote_loading: { fr: "Estimation en cours…", en: "Estimating…" },
  quote_estimated_weight: { fr: "Poids estimé", en: "Estimated weight" },
  quote_packaging: { fr: "Emballage conseillé", en: "Recommended packaging" },
  quote_shipping: { fr: "Transport maritime", en: "Sea shipping" },
  quote_total_from: { fr: "Total estimé", en: "Estimated total" },
  quote_cta: { fr: "Réserver cet envoi", en: "Book this shipment" },
  quote_note: {
    fr: "Prix confirmé au pesage à l'entrepôt. Sans engagement.",
    en: "Price confirmed at warehouse weigh-in. No commitment.",
  },
  quote_error: {
    fr: "Impossible d'estimer pour le moment. Réessayez.",
    en: "Couldn't estimate right now. Please try again.",
  },

  // ── Wizard ──
  wiz_step: { fr: "Étape", en: "Step" },
  wiz_of: { fr: "sur", en: "of" },
  wiz_s1_title: { fr: "Votre envoi", en: "Your shipment" },
  wiz_s2_title: { fr: "Dépôt ou enlèvement", en: "Drop-off or pickup" },
  wiz_s3_title: { fr: "Date de départ", en: "Departure date" },
  wiz_s4_title: { fr: "Vos coordonnées", en: "Your details" },
  wiz_s5_title: { fr: "Confirmation", en: "Confirmation" },
  wiz_next: { fr: "Continuer", en: "Continue" },
  wiz_back: { fr: "Retour", en: "Back" },
  wiz_dropoff: { fr: "Je dépose à l'entrepôt", en: "I drop off at the warehouse" },
  wiz_dropoff_desc: {
    fr: "Gratuit — Zone Portuaire, 67100 Strasbourg",
    en: "Free — Zone Portuaire, 67100 Strasbourg",
  },
  wiz_pickup: { fr: "Enlèvement à domicile", en: "Home pickup" },
  wiz_pickup_desc: {
    fr: "5 € + 0,19 € par km depuis notre entrepôt de Strasbourg",
    en: "€5 + €0.19 per km from our Strasbourg warehouse",
  },
  wiz_pickup_address: { fr: "Adresse d'enlèvement", en: "Pickup address" },
  wiz_pickup_postcode: { fr: "Code postal", en: "Postcode" },
  wiz_pickup_city: { fr: "Ville", en: "City" },
  wiz_pickup_calc: { fr: "Calculer la distance", en: "Calculate distance" },
  wiz_pickup_km: { fr: "Distance routière", en: "Road distance" },
  wiz_pickup_too_far: {
    fr: "Au-delà de 150 km, contactez-nous sur WhatsApp pour un devis.",
    en: "Beyond 150 km, contact us on WhatsApp for a quote.",
  },
  wiz_pickup_not_found: {
    fr: "Adresse introuvable. Vérifiez le code postal et la ville.",
    en: "Address not found. Check the postcode and city.",
  },
  wiz_departure_hint: {
    fr: "Votre colis doit être à l'entrepôt avant la date limite.",
    en: "Your parcel must reach the warehouse before the cutoff date.",
  },
  wiz_departs: { fr: "Départ", en: "Departs" },
  wiz_cutoff: { fr: "Limite de dépôt", en: "Drop-off cutoff" },
  wiz_eta: { fr: "Arrivée estimée à Douala", en: "Estimated arrival in Douala" },
  wiz_sender: { fr: "Expéditeur (vous)", en: "Sender (you)" },
  wiz_receiver: { fr: "Destinataire au Cameroun", en: "Recipient in Cameroon" },
  wiz_name: { fr: "Nom complet", en: "Full name" },
  wiz_phone: { fr: "Téléphone", en: "Phone" },
  wiz_email: { fr: "E-mail (facultatif)", en: "Email (optional)" },
  wiz_whatsapp_pref: {
    fr: "Recevoir les mises à jour sur WhatsApp",
    en: "Receive updates on WhatsApp",
  },
  wiz_receiver_city: { fr: "Ville", en: "City" },
  wiz_neighborhood: { fr: "Quartier", en: "Neighborhood" },
  wiz_landmark: {
    fr: "Repère (ex. : en face de la pharmacie du rond-point)",
    en: "Landmark (e.g.: opposite the roundabout pharmacy)",
  },
  wiz_summary: { fr: "Récapitulatif", en: "Summary" },
  wiz_payment_note: {
    fr: "Paiement à l'entrepôt ou à l'enlèvement (espèces ou carte). Aucun paiement en ligne requis.",
    en: "Payment at the warehouse or on pickup (cash or card). No online payment required.",
  },
  wiz_confirm: { fr: "Confirmer ma réservation", en: "Confirm my booking" },
  wiz_confirming: { fr: "Réservation en cours…", en: "Booking…" },
  wiz_done_title: { fr: "Réservation confirmée !", en: "Booking confirmed!" },
  wiz_done_sub: {
    fr: "Votre numéro de colis — gardez-le précieusement :",
    en: "Your parcel number — keep it safe:",
  },
  wiz_done_track: { fr: "Suivre mon colis", en: "Track my parcel" },
  wiz_error: {
    fr: "La réservation a échoué. Vérifiez les champs et réessayez.",
    en: "Booking failed. Check the fields and try again.",
  },

  // ── Tracking ──
  track_title: { fr: "Suivre votre colis", en: "Track your parcel" },
  track_placeholder: { fr: "CF-2026-123456", en: "CF-2026-123456" },
  track_button: { fr: "Suivre", en: "Track" },
  track_not_found: {
    fr: "Numéro introuvable. Vérifiez le format CF-AAAA-XXXXXX.",
    en: "Number not found. Check the CF-YYYY-XXXXXX format.",
  },
  track_to: { fr: "vers", en: "to" },
  track_history: { fr: "Historique", en: "History" },
  track_eta_note: {
    fr: "Transport maritime : comptez 4 à 8 semaines porte à porte. Nous vous tenons informés à chaque étape.",
    en: "Sea freight: allow 4–8 weeks door to door. We keep you posted at every step.",
  },

  // Milestones
  ms_booked: { fr: "Réservé", en: "Booked" },
  ms_received_warehouse: { fr: "Reçu à l'entrepôt", en: "At our warehouse" },
  ms_consolidated: { fr: "Conteneur en préparation", en: "Container loading" },
  ms_departed: { fr: "Départ du port", en: "Departed port" },
  ms_at_sea: { fr: "En mer", en: "At sea" },
  ms_arrived_douala: { fr: "Arrivé à Douala", en: "Arrived in Douala" },
  ms_customs: { fr: "Dédouanement", en: "Customs clearance" },
  ms_out_for_delivery: { fr: "En livraison", en: "Out for delivery" },
  ms_delivered: { fr: "Livré", en: "Delivered" },

  // ── Landing sections ──
  how_title: { fr: "Comment ça marche", en: "How it works" },
  how_1_t: { fr: "1. Décrivez votre envoi", en: "1. Describe your shipment" },
  how_1_d: {
    fr: "Notre assistant estime le poids, l'emballage et le prix instantanément.",
    en: "Our assistant estimates weight, packaging and price instantly.",
  },
  how_2_t: { fr: "2. Déposez ou faites enlever", en: "2. Drop off or get picked up" },
  how_2_d: {
    fr: "À notre entrepôt de Strasbourg, ou enlèvement chez vous (5 € + 0,19 €/km).",
    en: "At our Strasbourg warehouse, or home pickup (€5 + €0.19/km).",
  },
  how_3_t: { fr: "3. Suivez jusqu'à Douala", en: "3. Track all the way to Douala" },
  how_3_d: {
    fr: "Un numéro CamFret unique et des nouvelles claires à chaque étape, sur WhatsApp.",
    en: "One CamFret number and clear updates at every step, on WhatsApp.",
  },
  cal_title: { fr: "Prochains départs", en: "Next departures" },
  cal_sub: {
    fr: "Conteneurs groupés au départ du Havre, toutes les deux semaines.",
    en: "Consolidated containers from Le Havre, every two weeks.",
  },
  trust_title: { fr: "Ils nous font confiance", en: "They trust us" },
  faq_title: { fr: "Questions fréquentes", en: "Frequently asked questions" },
  footer_warehouse: { fr: "Entrepôt", en: "Warehouse" },
  footer_contact: { fr: "Contact", en: "Contact" },
  footer_legal: {
    fr: "CamFret — Transport de colis France → Cameroun",
    en: "CamFret — Parcel shipping France → Cameroon",
  },
} as const;

export type DictKey = keyof typeof dict;

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: "fr", setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");
  useEffect(() => {
    const saved = window.localStorage.getItem("camfret_locale");
    if (saved === "en" || saved === "fr") setLocaleState(saved);
  }, []);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem("camfret_locale", l);
  };
  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  const { locale } = useLocale();
  return (key: DictKey) => dict[key][locale];
}
