import type { Metadata } from "next";
import { getTenant, tenantVars } from "@/tenant";
import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const T = getTenant();
const V = tenantVars(T.defaultLocale, T);
const themeVars = {
  "--color-primary": T.colors.primary,
  "--color-primary-dark": T.colors.primaryDark,
  "--color-secondary": T.colors.secondary,
  "--color-accent": T.colors.accent,
  "--color-accent-dark": T.colors.accentDark,
  "--color-gold": T.colors.gold,
  "--color-gold-dark": T.colors.goldDark,
} as React.CSSProperties;

export const metadata: Metadata = {
  title: `${T.name} — Colis & marchandises ${V.origin} → ${V.destCountry}`,
  description: `${T.name} : transport de colis et marchandises de ${V.origin} (${V.originCountry}) vers ${V.destCountry} (${V.destCitiesDash}). Voitures, meubles, électroménagers, cartons — estimation instantanée et suivi WhatsApp.`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={T.defaultLocale} style={themeVars}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <LocaleProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
