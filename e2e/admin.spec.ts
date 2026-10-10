import { test, expect } from "@playwright/test";

test("admin settings: status never leaks a full API key", async ({ request }) => {
  const res = await request.get("/api/admin/settings");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(typeof body.configured).toBe("boolean");
  expect(JSON.stringify(body)).not.toContain("sk-ant-api");
});

test("admin settings: malformed key is rejected", async ({ request }) => {
  const res = await request.post("/api/admin/settings", { data: { apiKey: "bad" } });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toBe("invalid_key_format");
});

test("admin page renders the API key panel", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText(/Clé API/)).toBeVisible();
});
