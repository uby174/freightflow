import { db, forbiddenTerms } from "@/db";
import { ANTHROPIC_MODEL, hasAI } from "./config";
import type { MilestoneKey } from "./carrier/types";

// ── Layer 4 fail-safe: static branded templates per milestone ──
export const TEMPLATES: Record<MilestoneKey, { fr: string; en: string }> = {
  booked: {
    fr: "Votre commande est confirmée. Nous préparons l'accueil de votre colis.",
    en: "Your order is confirmed. We are getting ready to receive your parcel.",
  },
  received_warehouse: {
    fr: "Votre colis est bien arrivé à notre terminal de Bischwiller. Il sera pesé et conditionné avec soin.",
    en: "Your shipment has arrived at our Bischwiller terminal. It will be weighed and carefully conditioned.",
  },
  consolidated: {
    fr: "Votre colis a rejoint le conteneur en préparation. Prochaine étape : le départ du port.",
    en: "Your parcel has joined the container being prepared. Next step: departure from the port.",
  },
  departed: {
    fr: "Ça y est ! Le conteneur a quitté le port du Havre en direction de Douala.",
    en: "It's on its way! The container has left Le Havre port, bound for Douala.",
  },
  at_sea: {
    fr: "Votre colis est en mer et avance bien vers le Cameroun. Nous vous préviendrons à l'arrivée.",
    en: "Your parcel is at sea and making good progress towards Cameroon. We'll let you know when it arrives.",
  },
  arrived_douala: {
    fr: "Bonne nouvelle : votre colis est arrivé au port de Douala !",
    en: "Good news: your parcel has arrived at the port of Douala!",
  },
  customs: {
    fr: "Votre colis passe le dédouanement à Douala. C'est une étape normale qui prend quelques jours.",
    en: "Your parcel is going through customs clearance in Douala. This is a normal step that takes a few days.",
  },
  out_for_delivery: {
    fr: "Votre colis est en cours de livraison ! Notre livreur local contactera le destinataire.",
    en: "Your parcel is out for delivery! Our local courier will contact the recipient.",
  },
  delivered: {
    fr: "Livré ! Votre colis est arrivé à destination. Merci d'avoir choisi SN Groupage Solutions.",
    en: "Delivered! Your shipment has reached its destination. Thank you for choosing SN Groupage Solutions.",
  },
};

// ── Layer 1 + 3: deny-list scrub (runs before AND after the AI rewrite) ──
export function scrub(text: string): string {
  const terms = db.select().from(forbiddenTerms).all();
  let out = text;
  // Longest terms first so "TransGlobal Express" wins over "TGE"
  for (const t of [...terms].sort((a, b) => b.term.length - a.term.length)) {
    out = out.replace(
      new RegExp(t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"),
      t.replacement
    );
  }
  // Container numbers & carrier refs are identifying too
  out = out.replace(/\b[A-Z]{4}\d{7}\b/g, "notre conteneur");
  out = out.replace(/\b(?:ref|booking)\s+[A-Z0-9-]{4,}\b/gi, "");
  return out;
}

export function containsForbidden(text: string): boolean {
  const terms = db.select().from(forbiddenTerms).all();
  const lower = text.toLowerCase();
  return (
    terms.some((t) => lower.includes(t.term.toLowerCase())) ||
    /\b[A-Z]{4}\d{7}\b/.test(text)
  );
}

// ── Layer 2: AI rewrite into warm branded copy (FR + EN in one call) ──
async function aiRewrite(
  scrubbed: string,
  milestone: MilestoneKey
): Promise<{ fr: string; en: string } | null> {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const res = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 300,
      system:
        "You write shipment status updates for SN Groupage Solutions, a friendly Bischwiller (France) → Douala (Cameroon) shipping company. " +
        "Rewrite the raw logistics event into ONE warm, reassuring customer sentence, in French AND English. " +
        "NEVER mention any company, carrier, vessel, agent or courier name, or any reference/booking number — " +
        "use generic terms (notre terminal, le navire, notre agent local, notre livreur). " +
        'Respond ONLY with JSON: {"fr":"...","en":"..."}',
      messages: [
        {
          role: "user",
          content: `Milestone: ${milestone}\nRaw event: ${scrubbed}`,
        },
      ],
    });
    const text = res.content.find((b) => b.type === "text")?.text ?? "";
    const json = JSON.parse(
      text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)
    ) as { fr?: string; en?: string };
    if (!json.fr || !json.en) return null;
    return { fr: json.fr, en: json.en };
  } catch {
    return null;
  }
}

export interface BrandedMessage {
  fr: string;
  en: string;
  generatedBy: "ai" | "template" | "fallback_template";
}

/**
 * Full anti-leak pipeline: scrub → (AI rewrite) → re-scrub-check → template fallback.
 * Raw partner text can NEVER reach the customer unrewritten.
 */
export async function brandEvent(
  rawText: string,
  milestone: MilestoneKey
): Promise<BrandedMessage> {
  const scrubbed = scrub(rawText);

  if (hasAI()) {
    const ai = await aiRewrite(scrubbed, milestone);
    if (ai && !containsForbidden(ai.fr) && !containsForbidden(ai.en)) {
      return { ...ai, generatedBy: "ai" };
    }
    if (ai) {
      // AI reintroduced a banned term — hard fallback
      const t = TEMPLATES[milestone];
      return { fr: t.fr, en: t.en, generatedBy: "fallback_template" };
    }
  }

  const t = TEMPLATES[milestone];
  return { fr: t.fr, en: t.en, generatedBy: "template" };
}
