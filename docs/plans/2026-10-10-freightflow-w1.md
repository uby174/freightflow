# FreightFlow — Wave 1 plan (white-label platform)

**Decision (2026-10-10):** Turn the SN Groupage site into **FreightFlow**, a white-label
shipping platform. A tenant config drives brand, lanes, rates, catalog, contacts and
locales. SN Groupage (Alsace → Cameroun) is demo tenant #1; a second demo tenant proves
the "your site = new config" pitch. Portfolio target: GitHub, sold to country-to-country
shipping businesses.

Non-negotiables carried over: prices are never produced by AI (classify-only + pure
pricing), same selection = same price, unknown items get closest-match + dimensions, the
carrier partner is never visible to customers.

## Steps → verification

1. **Tenant layer** — `src/tenant/{types,index}.ts` + `src/tenant/tenants/{sn-groupage,dakar-express}.ts`.
   All hardcoded brand/lane/rate/contact/catalog/departure/forbidden-term values read from
   `getTenant()` (env `NEXT_PUBLIC_FREIGHTFLOW_TENANT`, default `sn-groupage`). One SQLite
   file per tenant. i18n strings interpolate `{brand}`, `{origin}`, `{destCountry}`… from
   the tenant.
   → verify: `tsc --noEmit` clean; `vitest` green; `NEXT_PUBLIC_FREIGHTFLOW_TENANT=dakar-express`
   renders a different brand, lane, colours, rate card and parcel prefix on `/`.
2. **Rate card + services pages** — `/tarifs` (public pricing table from tenant lanes +
   catalog), `/services` (lanes, pickup, groupage explainer).
   → verify: pages render for both tenants; prices on `/tarifs` equal `priceQuote` output.
3. **Stripe test-mode checkout** — `/api/checkout` (Checkout Session, test key from env or
   admin secrets field), `/book/success`, order `paymentStatus`. Falls back to
   pay-at-terminal when no key.
   → verify: with `STRIPE_SECRET_KEY=sk_test_…` a booking redirects to Stripe's test page;
   without it the current flow is unchanged (vitest + manual).
4. **AI guardrails evals + doc** — `src/lib/__tests__/guardrails.test.ts` (prompt-injection
   attempts never change price; N-run determinism; AI output outside catalog rejected;
   carrier names never leak through sanitize) + `docs/AI-GUARDRAILS.md`.
   → verify: vitest green; doc lists each guardrail with the test that proves it.
5. **Playwright e2e + CI** — `e2e/{quote,booking,tracking,admin}.spec.ts`,
   `.github/workflows/ci.yml` (tsc → vitest → playwright).
   → verify: `npx playwright test` green locally; workflow file lint-valid.
6. **README + screenshots** — architecture, guardrails, tenant how-to, badges, two-tenant
   screenshots in `docs/screenshots/`.
   → verify: README renders; every command in it runs.

Out of W1: real carrier API, Twilio/Resend live transports, legal pages (W3, reuse
`agency` compliance templates), per-lane SEO pages (W3), booking across multiple lanes
(W1 books on `lanes[0]`; `/tarifs` lists all), folder rename `camfret → freightflow`
(done last, with the GitHub push).

## Status (2026-10-10, end of W1)

| Step | Result |
|---|---|
| 1 Tenant layer | Done — SN `:3004` + Dakar `:3005` render from config; per-tenant `distDir` fixed a hydration mismatch |
| 2 Rate card + services | Done — `/tarifs` unit prices match the engine rule; `/services` |
| 3 Stripe test checkout | Done — optional; verified `available:false` path; live test needs `STRIPE_SECRET_KEY` |
| 4 Guardrail evals + doc | Done — `guardrails.test.ts` (72 tests), `docs/AI-GUARDRAILS.md`; vitest 95/95 |
| 5 Playwright e2e + CI | Done — 8 specs green ×3 locally; `ci.yml` not yet exercised on GitHub |
| 6 README + screenshots | Done — `docs/screenshots/` both tenants, rates, services |

Open: push to GitHub as `freightflow` (rename folder then), run CI once, set `OWNER` in README badge.
