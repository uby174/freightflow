import { test, expect } from "@playwright/test";

const AMOUNT = /\d+,\d{2}\s?€/;

test("booking: quote -> 5-step wizard -> confirmation -> tracking", async ({ page }) => {
  // Quote on the landing page, then hand off to the wizard.
  await page.goto("/");
  await page.locator("textarea#quote-desc").fill("1 frigo");
  await page.getByRole("button", { name: /Estimer|Estimate/ }).click();
  await page.getByRole("button", { name: /Réserver cet envoi|Book this shipment/ }).click();
  await expect(page).toHaveURL(/\/book$/);

  const next = () => page.getByRole("button", { name: /Continuer|Continue/ }).click();

  // 1 - shipment + price
  await expect(page.getByText(AMOUNT).first()).toBeVisible();
  await next();

  // 2 - drop-off is the default
  await next();

  // 3 - departure: first container card
  await page.getByRole("button", { name: /Conteneur/ }).first().click();
  await next();

  // 4 - details (first "Nom complet" = sender, second = receiver)
  const names = page.getByPlaceholder(/Nom complet|Full name/);
  await names.nth(0).fill("E2E Expediteur");
  await page.getByPlaceholder(/\+33/).fill("+33612345678");
  await names.nth(1).fill("E2E Destinataire");
  await page.getByPlaceholder(/\+237/).fill("+237677889900");
  await next();

  // 5 - confirm
  await page.getByRole("button", { name: /Confirmer ma réservation|Confirm my booking/ }).click();
  const codeEl = page.locator("code");
  await expect(codeEl).toHaveText(/^[A-Z]{2}-\d{4}-\d{6}$/);
  const code = (await codeEl.textContent())!.trim();

  // Follow the link to live tracking
  await page.getByRole("link", { name: /Suivre mon envoi|Track my shipment/ }).click();
  await expect(page).toHaveURL(new RegExp(`/track/${code}$`));
  await expect(page.getByText(/Réservé|Booked/).first()).toBeVisible();
});
