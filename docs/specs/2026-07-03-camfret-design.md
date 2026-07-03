# CamFret — Design Spec
**Date:** 2026-07-03 · **Status:** Approved direction (user decisions locked)

## 1. What CamFret is

A white-label parcel shipping platform: customers in Europe book shipments to Cameroon
(Douala/Yaoundé) online, drop goods at the Strasbourg warehouse or book home pickup,
receive a branded CamFret parcel number, and get friendly AI-written tracking updates
in French or English. The real shipping partner is completely hidden — to the customer,
**CamFret is the shipper**.

### Locked decisions (from founder)
| Decision | Value |
|---|---|
| Brand | **CamFret** — parcel numbers `CF-2026-XXXXXX` |
| Warehouse | **Strasbourg, France** (config-driven address) |
| Shipping mode | **Sea groupage only** at launch; container departs on a visible consolidation calendar (every 2 weeks, via Le Havre → Douala) |
| Pickup pricing | **€5.00 base + €0.19/km** road distance from Strasbourg warehouse |
| Payment | **Book online, pay at drop-off/pickup** — no PSP in v1 |
| Scope | **Full vision with mocked carrier** — AI estimator, pickup pricing, branded tracking, AI notifications all working end-to-end against a simulated carrier |
| Languages | **French-first, persistent EN toggle** |

## 2. Market context (research summary)

- Diaspora forwarders on this corridor (CamiLogistics, Fretocam, France Groupage,
  Centrimex, NMJ) run brochure sites with manual quotes and batch updates. **Nobody
  offers instant quote + branded live tracking.** That is the product gap.
- Sea groupage market pricing: named quotes ~€950–1050/m³ door-to-door; transit
  6–8 weeks door-to-door including consolidation wait.
- France has the largest Cameroonian diaspora in Europe (~150–180k). WhatsApp is the
  dominant communication channel.
- Cameroon customs: CEMAC tariff 5–30% + ~19.25% effective VAT — v1 shows an
  indicative landed-cost note, not a binding duty calculation.
- Tracking aggregators (17TRACK, AfterShip) can normalize most partners' events later;
  Cameroon last-mile will likely be manual ground-agent updates → the admin app must
  allow manual event injection.

## 3. User journey

```
Land → instant quote (describe items, AI estimates packaging + price)
     → delivery method (warehouse drop-off | home pickup €5 + €0.19/km, auto-distance)
     → earliest ship date (from consolidation calendar, cutoff 2 days before departure)
     → sender + receiver details (receiver: Cameroon region/city dropdowns + landmark, +237)
     → confirm → CF-2026-XXXXXX issued → pay at drop-off/pickup
     → track at /track/CF-2026-XXXXXX (milestone timeline, AI-written updates, FR/EN)
```

Failure states handled in v1: weigh-in price delta (reconciliation quote versioning),
carrier event gaps (milestone timeline shows expected windows, never a stalled bar),
LLM outage (template fallback), missing API keys (deterministic heuristics).

## 4. Architecture

**Stack:** Next.js 15 (App Router, TypeScript) · SQLite via Drizzle ORM (better-sqlite3,
swap to Postgres at deploy) · Tailwind CSS · in-process mock-carrier timeline player ·
Anthropic API for AI features **with deterministic fallbacks when no key is set**.

### Domain model
`customers, orders, parcels, quotes (versioned), pickup_bookings, pricing_charts
(versioned rows, never mutated), tracking_events_raw, tracking_events_branded,
notifications, forbidden_terms, carrier_accounts (internal-only), departures
(consolidation calendar)`

Branded parcel number ↔ carrier tracking number mapping lives ONLY in internal tables.

### White-label anti-leak pipeline (defense in depth)
1. **Deny-list regex scrub** (versioned `forbidden_terms` table) — always runs.
2. **AI rewrite** into warm branded copy (FR + EN generated once, at event creation).
3. **Post-AI re-scrub** — if any forbidden term survives, fall back to
4. **Static templates** keyed by branded status enum. Raw text never reaches customers.

Customer-facing queries only ever read `tracking_events_branded` + branded order fields.

### AI packaging estimator
LLM classifies only (strict JSON: weight, dims, packaging type, fragile, confidence);
**prices always come from `pricing_charts`**. No API key → keyword-based heuristic
estimator (category × quantity tables) so the site is fully demoable offline.
Warehouse weigh-in records actuals; delta > 15% or €3 triggers a reconciliation quote
version and a customer notification.

### Distance engine (pickup pricing)
Nominatim geocoding + OSRM public routing (both keyless), fallback = haversine × 1.3
road factor from Strasbourg (48.5734, 7.7521). Price = `500 + round(km × 19)` cents.

### Mock carrier (`FakeCarrierAdapter` behind `CarrierAdapter` interface)
`createShipment` returns `FAKE-<uuid>`; a timeline player emits realistic raw events
(deliberately containing fake carrier/depot names to prove the scrubber works) through
the same ingest → sanitize → notify pipeline a real partner will use. Demo mode
compresses weeks into minutes so tracking can be watched live.

### Notifications
Branded event → fan-out rows per channel (WhatsApp-first, email, web). v1 ships the
pipeline with console/log transport + in-app timeline; Twilio/Resend keys slot in later.

## 5. UX design

- **Hero = instant quote widget.** Price before personal details, always.
- 5-step wizard, autosaved to localStorage; sticky mobile CTA with running total.
- Trust strip: consolidation calendar ("Prochain départ: …"), warehouse photos
  placeholder, testimonials (name + city pair), WhatsApp contact bubble, insurance note.
- Tracking: milestone timeline (Réservé → Reçu à l'entrepôt → Conteneur chargé →
  En mer → Arrivé à Douala → Dédouanement → En livraison → Livré) with expected
  date windows per stage.
- Design system (ui-ux-pro-max): primary #2563EB, CTA #EA580C, bg #EFF6FF,
  Inter, bold-minimalist, no emoji icons (Lucide SVG), WCAG AA, 375/768/1024/1440.
- i18n: FR default, EN toggle in nav; notification language = booking-time choice.

## 6. Out of scope for v1
Real PSP (Stripe), real partner API, air freight, multi-warehouse, customs duty
calculator (indicative note only), user accounts/login (orders retrieved by parcel
number + phone), B2B tier.
