"use client";

import { MapPin, MessageCircle, Phone } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Footer() {
  const t = useT();
  return (
    <footer className="bg-primary-dark text-white mt-20">
      <div className="mx-auto max-w-6xl px-4 py-12 grid gap-8 sm:grid-cols-3 text-sm">
        <div>
          <p className="font-black text-lg mb-2">CamFret</p>
          <p className="text-blue-200">{t("footer_legal")}</p>
        </div>
        <div>
          <p className="font-bold mb-2">{t("footer_warehouse")}</p>
          <p className="flex items-start gap-2 text-blue-200">
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
            Zone Portuaire, 67100 Strasbourg, France
          </p>
        </div>
        <div>
          <p className="font-bold mb-2">{t("footer_contact")}</p>
          <p className="flex items-center gap-2 text-blue-200">
            <MessageCircle className="w-4 h-4 shrink-0" aria-hidden />
            WhatsApp : +33 6 00 00 00 00
          </p>
          <p className="flex items-center gap-2 text-blue-200 mt-1">
            <Phone className="w-4 h-4 shrink-0" aria-hidden />
            +33 3 88 00 00 00
          </p>
        </div>
      </div>
    </footer>
  );
}
