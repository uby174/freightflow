import { test, expect } from "@playwright/test";

const AMOUNT = /\d+,\d{2}\s?€/;

test("quote: known items are recognised and priced", async ({ page }) => {
  await page.goto("/");
  await page.locator("textarea#quote-desc").fill("1 frigo et 2 cartons");
  await page.getByRole("button", { name: /Estimer|Estimate/ }).click();

  await expect(page.getByText(/Articles reconnus|Recognised items/)).toBeVisible();
  await expect(page.getByText(AMOUNT).first()).toBeVisible();
});

test("quote: unknown item offers custom dimensions and prices them", async ({ page }) => {
  await page.goto("/");
  await page.locator("textarea#quote-desc").fill("un piano");
  await page.getByRole("button", { name: /Estimer|Estimate/ }).click();

  // Unrecognised -> inline assistant with the exact-dimensions form.
  const length = page.getByLabel(/Longueur|Length/);
  await expect(length).toBeVisible();
  await expect(length).toHaveAttribute("type", "number");

  await length.fill("150");
  await page.getByLabel(/Largeur|Width/).fill("110");
  await page.getByLabel(/Hauteur|Height/).fill("140");
  await page.getByLabel(/Poids|Weight/).fill("180");
  await page.getByLabel(/Quantité|Quantity/).fill("1");
  await page.getByRole("button", { name: /Ajouter au devis|Add to quote/ }).click();

  await expect(page.getByText(/Articles reconnus|Recognised items/)).toBeVisible();
  await expect(page.getByText(AMOUNT).first()).toBeVisible();
});
