# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tracking.spec.ts >> tracking: an API-created order shows its code and milestones
- Location: e2e\tracking.spec.ts:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'SN-2026-886400' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('heading', { name: 'SN-2026-886400' }) with timeout 15000ms
  - waiting for getByRole('heading', { name: 'SN-2026-886400' })

```

```yaml
- banner:
  - link "SN Groupage Solutions":
    - /url: /
    - text: SN Groupage Solutions Transport de colis en toute confiance
  - navigation:
    - link "Services":
      - /url: /services
    - link "Tarifs":
      - /url: /tarifs
    - link "Suivre un colis":
      - /url: /track
    - link "WhatsApp":
      - /url: https://wa.me/33605775101
    - link "Réserver":
      - /url: /book
    - button "Switch to English": EN
- main: …
- contentinfo:
  - text: SN SN Groupage Solutions
  - paragraph: Transport de colis & marchandises, France → Cameroun.
  - paragraph: Terminal
  - paragraph: Terminal SN Groupage
  - paragraph: 67240 Bischwiller, France
  - paragraph: "→ Cameroun : Douala et Yaoundé"
  - paragraph: Info & Réservation
  - paragraph: 07 53 13 25 03
  - paragraph: 06 05 77 51 01
  - paragraph: +237 657 748 808
  - paragraph: Contact
  - link "WhatsApp":
    - /url: https://wa.me/33605775101
  - link "nsgroupages@gmail.com":
    - /url: mailto:nsgroupages@gmail.com
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test("tracking: an API-created order shows its code and milestones", async ({ page, request }) => {
  4  |   const res = await request.post("/api/orders", {
  5  |     data: {
  6  |       locale: "fr",
  7  |       mode: "dropoff",
  8  |       contents: "1 frigo",
  9  |       lines: [{ catalogId: "frigo_standard", quantity: 1 }],
  10 |       departureId: 1,
  11 |       sender: { name: "E2E Test", phone: "+33612345678", whatsapp: true },
  12 |       receiver: { name: "Dest", phone: "+237677889900", city: "Douala" },
  13 |     },
  14 |   });
  15 |   expect(res.ok()).toBeTruthy();
  16 |   const { code } = await res.json();
  17 |   expect(code).toMatch(/^[A-Z]{2}-\d{4}-\d{6}$/);
  18 | 
  19 |   await page.goto(`/track/${code}`);
> 20 |   await expect(page.getByRole("heading", { name: code })).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  21 | 
  22 |   const milestones = page.locator("ol > li");
  23 |   await expect(milestones.first()).toBeVisible();
  24 |   expect(await milestones.count()).toBeGreaterThan(1);
  25 | });
  26 | 
  27 | test("tracking: unknown code says not found", async ({ page }) => {
  28 |   await page.goto("/track/XX-0000-000000");
  29 |   await expect(page.getByText(/introuvable|not found/i)).toBeVisible();
  30 | });
  31 | 
```