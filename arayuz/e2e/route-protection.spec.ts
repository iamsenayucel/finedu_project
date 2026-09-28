import { test, expect } from "@playwright/test";

// AŞAMA 5 madde 61/95: "Direct URL testi" — SPA içi buton navigasyonu değil,
// adres çubuğundan doğrudan korumalı bir route'a gidildiğinde davranış.
test.describe("Anonymous user hitting a protected route directly", () => {
  for (const path of ["/dashboard", "/profile", "/admin", "/unit/1", "/pre-survey"]) {
    test(`${path} redirects to /login without ever rendering the page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
      // Login formu gerçekten render olmuş mu (blank page değil)
      await expect(page.getByRole("button", { name: /Giriş Yap/i })).toBeVisible();
    });
  }
});
