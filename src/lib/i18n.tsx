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
  brand: { fr: "SN Groupage Solutions", en: "SN Groupage Solutions" },
  tagline: {
    fr: "Transport de colis en toute confiance",
    en: "Parcel & cargo transport you can trust",
  },
  nav_track: { fr: "Suivre un colis", en: "Track a shipment" },
  nav_book: { fr: "Réserver", en: "Book" },
  nav_how: { fr: "Comment ça marche", en: "How it works" },

  // ── Hero / quote widget ──
  next_departure_label: { fr: "Prochain départ", en: "Next departure" },
  next_departure_soon: { fr: "Bientôt annoncé", en: "Announced soon" },
  hero_title: {
    fr: "Bischwiller → Douala : vos colis et marchandises en toute confiance",
    en: "Bischwiller → Douala: your parcels & goods, in full confidence",
  },
  hero_sub: {
    fr: "Du carton à la voiture — décrivez ce que vous envoyez, notre assistant estime le conditionnement et le prix en quelques secondes. Groupage régulier vers Douala (Akwa).",
    en: "From a box to a car — describe what you're sending and our assistant estimates conditioning and price in seconds. Regular groupage to Douala (Akwa).",
  },
  quote_placeholder: {
    fr: "Ex. : 1 réfrigérateur, 3 cartons de vêtements, 1 TV et une moto…",
    en: "E.g.: 1 fridge, 3 boxes of clothes, 1 TV and a motorcycle…",
  },
  quote_widget_title: { fr: "Devis instantané", en: "Instant quote" },
  quote_button: { fr: "Estimer mon envoi", en: "Estimate my shipment" },
  quote_loading: { fr: "Estimation en cours…", en: "Estimating…" },
  quote_estimated_weight: { fr: "Poids / volume estimés", en: "Estimated weight / volume" },
  quote_packaging: { fr: "Conditionnement & manutention", en: "Conditioning & handling" },
  quote_shipping: { fr: "Fret maritime (groupage)", en: "Sea freight (groupage)" },
  quote_total_from: { fr: "Total estimé", en: "Estimated total" },
  quote_cta: { fr: "Réserver cet envoi", en: "Book this shipment" },
  quote_note: {
    fr: "Prix confirmé au pesage à notre terminal. Sans engagement.",
    en: "Price confirmed at our terminal weigh-in. No commitment.",
  },
  quote_error: {
    fr: "Impossible d'estimer pour le moment. Réessayez.",
    en: "Couldn't estimate right now. Please try again.",
  },
  quote_items: { fr: "Articles reconnus", en: "Recognised items" },
  quote_chargeable: { fr: "Volume facturable", en: "Chargeable volume" },
  quote_freight: { fr: "Fret maritime · 750 €/m³", en: "Sea freight · €750/m³" },
  quote_vehicles: { fr: "Véhicule(s)", en: "Vehicle(s)" },
  quote_pickup_line: { fr: "Enlèvement à domicile", en: "Home pickup" },
  quote_review_title: { fr: "Devis personnalisé", en: "Custom quote" },
  quote_review_desc: {
    fr: "Nous voulons vous donner le juste prix. Écrivez-nous ce que vous envoyez sur WhatsApp — on vous confirme le tarif rapidement.",
    en: "We want to give you the right price. Tell us what you're shipping on WhatsApp — we'll confirm the rate quickly.",
  },
  quote_whatsapp: { fr: "Demander sur WhatsApp", en: "Ask on WhatsApp" },
  quote_review_unmatched: { fr: "À préciser", en: "To clarify" },

  // ── Custom dimensions ──
  dim_title: { fr: "Vous connaissez les dimensions ?", en: "Know your measurements?" },
  dim_hint: {
    fr: "Entrez la taille et le poids de votre caisse pour un devis exact, tout de suite.",
    en: "Enter your box size and weight for an exact quote, right away.",
  },
  dim_length: { fr: "Longueur (cm)", en: "Length (cm)" },
  dim_width: { fr: "Largeur (cm)", en: "Width (cm)" },
  dim_height: { fr: "Hauteur (cm)", en: "Height (cm)" },
  dim_weight: { fr: "Poids (kg)", en: "Weight (kg)" },
  dim_qty: { fr: "Quantité", en: "Quantity" },
  dim_add: { fr: "Ajouter au devis", en: "Add to quote" },
  dim_toggle: { fr: "Ajouter une caisse sur mesure", en: "Add a custom box" },

  // ── Inline assistant ──
  assist_closest: { fr: "Articles les plus proches", en: "Closest items" },
  assist_or_dims: { fr: "ou entrez vos dimensions", en: "or enter your dimensions" },
  assist_ask_cta: { fr: "Une question ? Demandez à l'assistant", en: "Have a question? Ask the assistant" },
  assist_ask_placeholder: {
    fr: "Ex. : combien de temps pour Douala ? que puis-je envoyer ?",
    en: "E.g.: how long to Douala? what can I ship?",
  },
  assist_thinking: { fr: "L'assistant réfléchit…", en: "The assistant is thinking…" },
  assist_send: { fr: "Envoyer", en: "Send" },

  // ── Journey scene ──
  journey_title: {
    fr: "Vos colis voyagent ensemble",
    en: "Your parcels travel together",
  },
  journey_sub: {
    fr: "C'est ça, le groupage : chacun envoie ce qu'il veut, tout part dans un seul conteneur — et chacun ne paie que sa part.",
    en: "That's groupage: everyone sends what they want, everything leaves in one container — and everyone pays only their share.",
  },
  journey_caption: {
    fr: "4–8 semaines · Un seul conteneur · Toute la diaspora",
    en: "4–8 weeks · One container · The whole diaspora",
  },
  journey_aria: {
    fr: "Animation : des colis se regroupent dans un conteneur qui voyage du Havre à Douala par bateau",
    en: "Animation: parcels consolidate into a container that travels from Le Havre to Douala by ship",
  },

  // ── Goods we transport ──
  goods_title: { fr: "Nous transportons", en: "We transport" },
  g_cars: { fr: "Voitures", en: "Cars" },
  g_motos: { fr: "Motos", en: "Motorcycles" },
  g_appliances: { fr: "Électroménagers", en: "Appliances" },
  g_furniture: { fr: "Meubles", en: "Furniture" },
  g_boxes: { fr: "Cartons", en: "Boxes" },
  g_bags: { fr: "Sacs badjock", en: "Badjock bags" },
  g_tv: { fr: "TV", en: "TVs" },
  g_tiles: { fr: "Carreaux", en: "Tiles" },
  g_pallets: { fr: "Palettes", en: "Pallets" },
  g_more: { fr: "Et bien plus…", en: "And much more…" },

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
  wiz_dropoff: { fr: "Je dépose au terminal", en: "I drop off at the terminal" },
  wiz_dropoff_desc: {
    fr: "Gratuit — Terminal SN Groupage, 67240 Bischwiller",
    en: "Free — SN Groupage terminal, 67240 Bischwiller",
  },
  wiz_pickup: { fr: "Enlèvement à domicile", en: "Home pickup" },
  wiz_pickup_desc: {
    fr: "5 € + 0,19 € par km depuis notre terminal de Bischwiller",
    en: "€5 + €0.19 per km from our Bischwiller terminal",
  },
  wiz_pickup_address: { fr: "Adresse d'enlèvement", en: "Pickup address" },
  wiz_pickup_postcode: { fr: "Code postal", en: "Postcode" },
  wiz_pickup_city: { fr: "Ville", en: "City" },
  wiz_pickup_calc: { fr: "Calculer la distance", en: "Calculate distance" },
  wiz_pickup_km: { fr: "Distance routière", en: "Road distance" },
  wiz_pickup_too_far: {
    fr: "Au-delà de 200 km, contactez-nous sur WhatsApp pour un devis.",
    en: "Beyond 200 km, contact us on WhatsApp for a quote.",
  },
  wiz_pickup_not_found: {
    fr: "Adresse introuvable. Vérifiez le code postal et la ville.",
    en: "Address not found. Check the postcode and city.",
  },
  wiz_departure_hint: {
    fr: "Votre marchandise doit être au terminal avant la date limite.",
    en: "Your goods must reach the terminal before the cutoff date.",
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
    fr: "Paiement au terminal ou à l'enlèvement (espèces ou carte). Aucun paiement en ligne requis.",
    en: "Payment at the terminal or on pickup (cash or card). No online payment required.",
  },
  wiz_confirm: { fr: "Confirmer ma réservation", en: "Confirm my booking" },
  wiz_confirming: { fr: "Réservation en cours…", en: "Booking…" },
  wiz_done_title: { fr: "Réservation confirmée !", en: "Booking confirmed!" },
  wiz_done_sub: {
    fr: "Votre numéro de suivi — gardez-le précieusement :",
    en: "Your tracking number — keep it safe:",
  },
  wiz_done_track: { fr: "Suivre mon envoi", en: "Track my shipment" },
  wiz_error: {
    fr: "La réservation a échoué. Vérifiez les champs et réessayez.",
    en: "Booking failed. Check the fields and try again.",
  },

  // ── Tracking ──
  track_title: { fr: "Suivre votre envoi", en: "Track your shipment" },
  track_placeholder: { fr: "SN-2026-123456", en: "SN-2026-123456" },
  track_button: { fr: "Suivre", en: "Track" },
  track_not_found: {
    fr: "Numéro introuvable. Vérifiez le format SN-AAAA-XXXXXX.",
    en: "Number not found. Check the SN-YYYY-XXXXXX format.",
  },
  track_to: { fr: "vers", en: "to" },
  track_history: { fr: "Historique", en: "History" },
  track_eta_note: {
    fr: "Groupage maritime : comptez 4 à 8 semaines porte à porte. Nous vous tenons informés à chaque étape.",
    en: "Sea groupage: allow 4–8 weeks door to door. We keep you posted at every step.",
  },

  // Milestones
  ms_booked: { fr: "Réservé", en: "Booked" },
  ms_received_warehouse: { fr: "Reçu au terminal", en: "At our terminal" },
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
    fr: "Notre assistant estime le poids, le volume, le conditionnement et le prix instantanément.",
    en: "Our assistant estimates weight, volume, conditioning and price instantly.",
  },
  how_2_t: { fr: "2. Déposez ou faites enlever", en: "2. Drop off or get picked up" },
  how_2_d: {
    fr: "À notre terminal de Bischwiller, ou enlèvement chez vous (5 € + 0,19 €/km).",
    en: "At our Bischwiller terminal, or home pickup (€5 + €0.19/km).",
  },
  how_3_t: { fr: "3. Suivez jusqu'à Douala", en: "3. Track all the way to Douala" },
  how_3_d: {
    fr: "Un numéro de suivi SN unique et des nouvelles claires à chaque étape, sur WhatsApp.",
    en: "One SN tracking number and clear updates at every step, on WhatsApp.",
  },
  cal_title: { fr: "Prochains départs", en: "Next departures" },
  cal_sub: {
    fr: "Conteneurs groupés au départ du Havre, vers Douala (Akwa).",
    en: "Consolidated containers from Le Havre, to Douala (Akwa).",
  },
  trust_title: { fr: "Ils nous font confiance", en: "They trust us" },
  faq_title: { fr: "Questions fréquentes", en: "Frequently asked questions" },
  footer_warehouse: { fr: "Terminal", en: "Terminal" },
  footer_contact: { fr: "Contact", en: "Contact" },
  footer_legal: {
    fr: "Transport de colis & marchandises, France → Cameroun.",
    en: "Parcel & cargo transport, France → Cameroon.",
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
    const saved = window.localStorage.getItem("sn_locale");
    if (saved === "en" || saved === "fr") setLocaleState(saved);
  }, []);
  const setLocale = (l: Locale) => {
    setLocaleState(l);
    window.localStorage.setItem("sn_locale", l);
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
