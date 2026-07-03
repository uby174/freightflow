"use client";

import Link from "next/link";
import { Search, MessageCircle } from "lucide-react";
import { useLocale, useT } from "@/lib/i18n";
import { Logo } from "./Logo";
import { CONTACT } from "@/lib/config";

export function Header() {
  const t = useT();
  const { locale, setLocale } = useLocale();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-border">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" aria-label="SN Groupage Solutions">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3 text-sm font-medium">
          <Link
            href="/track"
            className="hidden sm:flex items-center gap-1.5 text-foreground hover:text-accent transition-colors"
          >
            <Search className="w-4 h-4" aria-hidden />
            {t("nav_track")}
          </Link>
          <a
            href={`https://wa.me/${CONTACT.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-full bg-success/10 text-success px-3 py-1.5 font-semibold hover:bg-success/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden />
            WhatsApp
          </a>
          <Link
            href="/book"
            className="rounded-full bg-accent hover:bg-accent-dark text-white px-4 py-2 font-semibold transition-colors"
          >
            {t("nav_book")}
          </Link>
          <button
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground hover:border-primary transition-colors"
            aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
          >
            {locale === "fr" ? "EN" : "FR"}
          </button>
        </nav>
      </div>
    </header>
  );
}
