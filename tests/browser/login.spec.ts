import { test, expect } from "@playwright/test";

test("requires login, rejects incorrect credentials, returns to TV, and signs out", async ({ page }) => {
  await page.goto("/live?q=kantipur");
  await expect(page).toHaveURL(/\/login\?next=/);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  await page.getByLabel("Username", { exact: true }).fill("viewer");
  await page.getByLabel("Password", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator("#login-error")).toContainText("Incorrect username or password");
  await page.getByLabel("Password", { exact: true }).fill("TVdemo123!");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/live\?q=kantipur$/);
  await expect(page.getByRole("textbox", { name: "Filter channels" })).toHaveValue("kantipur");
  await page.reload();
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/favorites");
  await expect(page).toHaveURL(/\/login\?next=/);
});

test("second account can sign in on mobile and external redirects are ignored", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login?next=https://example.com");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Username", { exact: true }).fill("viewer2");
  await page.getByLabel("Password", { exact: true }).fill("TVdemo456!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("button", { name: "Sign out", exact: true })).toBeVisible();
});
