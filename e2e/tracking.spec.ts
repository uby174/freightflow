import { test, expect } from "@playwright/test";

test("tracking: an API-created order shows its code and milestones", async ({ page, request }) => {
  const res = await request.post("/api/orders", {
    data: {
      locale: "fr",
      mode: "dropoff",
      contents: "1 frigo",
      lines: [{ catalogId: "frigo_standard", quantity: 1 }],
      departureId: 1,
      sender: { name: "E2E Test", phone: "+33612345678", whatsapp: true },
      receiver: { name: "Dest", phone: "+237677889900", city: "Douala" },
    },
  });
  expect(res.status()).toBe(200);
  const { code } = await res.json();
  expect(code).toMatch(/^[A-Z]{2}-\d{4}-\d{6}$/);

  await page.goto(`/track/${code}`);
  await expect(page.getByRole("heading", { name: code })).toBeVisible();

  const milestones = page.locator("ol > li");
  await expect(milestones.first()).toBeVisible();
  expect(await milestones.count()).toBeGreaterThan(1);
});

test("tracking: unknown code says not found", async ({ page }) => {
  await page.goto("/track/XX-0000-000000");
  await expect(page.getByText(/introuvable|not found/i)).toBeVisible();
});
