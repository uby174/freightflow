"use client";

import { MapPin, MessageCircle, Phone, Mail } from "lucide-react";
import { useT } from "@/lib/i18n";
import { CONTACT } from "@/lib/config";

export function Footer() {
  const t = useT();
  return (
    <footer className="bg-primary text-white mt-20">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-4 text-sm">
        <div className="sm:col-span-1">
          <div className="flex items-center gap-2.5">
            <span
              className="grid place-items-center rounded-lg bg-secondary text-white font-black shrink-0"
              style={{ width: 40, height: 40, fontSize: 18 }}
            >
              SN
            </span>
            <span className="font-black text-base leading-tight">
              SN Groupage
              <br />
              Solutions
            </span>
          </div>
          <p className="mt-3 text-blue-200">{t("footer_legal")}</p>
        </div>
        <div>
          <p className="font-bold mb-2 text-gold">{t("footer_warehouse")}</p>
          <p className="flex items-start gap-2 text-blue-200">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            Terminal SN Groupage
            <br />
          </p>
          <p className="text-blue-200 pl-6">67240 Bischwiller, France</p>
          <p className="text-blue-200 pl-6 mt-1">→ Douala (Akwa), Cameroun</p>
        </div>
        <div>
          <p className="font-bold mb-2 text-gold">Info &amp; Réservation</p>
          <p className="flex items-center gap-2 text-blue-200">
            <Phone className="w-4 h-4 shrink-0" aria-hidden />
            {CONTACT.phoneFr1}
          </p>
          <p className="flex items-center gap-2 text-blue-200 mt-1 pl-6">
            {CONTACT.phoneFr2}
          </p>
          <p className="flex items-center gap-2 text-blue-200 mt-1">
            <span className="w-4 shrink-0 text-center">🇨🇲</span>
            {CONTACT.phoneCm}
          </p>
        </div>
        <div>
          <p className="font-bold mb-2 text-gold">{t("footer_contact")}</p>
          <a
            href={`https://wa.me/${CONTACT.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
            WhatsApp
          </a>
          <a
            href={`mailto:${CONTACT.email}`}
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors mt-1 break-all"
          >
            <Mail className="w-4 h-4 shrink-0" aria-hidden />
            {CONTACT.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
