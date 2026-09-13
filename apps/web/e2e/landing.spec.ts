import { test, expect } from "@playwright/test";

test("landing renders the instrument", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Console" })).toBeVisible();
});

test("fixture page mounts the widget host", async ({ page }) => {
  await page.goto("/embed/fixture");
  await expect(page.getByRole("heading", { name: "Fixture" })).toBeVisible();
  await expect(page.locator("signal-widget")).toHaveCount(1);
});
