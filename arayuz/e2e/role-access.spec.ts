import { test, expect } from "@playwright/test";
import { USERS } from "./fixtures";

async function login(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Kullanıcı adınızı girin").fill(username);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
}

// AŞAMA 5 madde 34/61: rol bazlı frontend UX — gerçek enforcement backend'de,
// bu yalnızca doğru yönlendirmeyi doğrular (bkz. madde 12).
test("an admin can reach /admin", async ({ page }) => {
  await login(page, USERS.admin.username, USERS.admin.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("button", { name: "Eğitim İçerikleri" })).toBeVisible();
});

test("a student visiting /admin directly is redirected away, not shown the admin panel", async ({ page }) => {
  await login(page, USERS.student.username, USERS.student.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard$/);
});
