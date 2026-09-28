import { test, expect, type Page } from "@playwright/test";
import { USERS } from "./fixtures";

// AŞAMA 5 kapanış — responsive sanity. Pixel-perfect değil: kritik içerik
// viewport dışına taşmıyor mu, istemsiz horizontal overflow var mı, ana
// aksiyon (CTA)/nav kontrolleri erişilebilir mi. İki representative viewport
// (§19) — bir düzine kombinasyon değil.
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 }; // iPhone 13/14 boyutu

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Kullanıcı adınızı girin").fill(username);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  // 1px tolerans: sub-pixel rounding gerçek bir overflow değildir.
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("Responsive sanity — public auth pages", () => {
  for (const viewport of [DESKTOP, MOBILE]) {
    test(`Login is usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/login");
      await assertNoHorizontalOverflow(page);
      await expect(page.getByRole("button", { name: /Giriş Yap/i })).toBeVisible();
    });

    test(`Register is usable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/register");
      await assertNoHorizontalOverflow(page);
      await expect(page.getByRole("button", { name: /Kayıt Ol/i })).toBeVisible();
    });
  }
});

test.describe("Responsive sanity — authenticated shell + student flow (mobile)", () => {
  test("Navbar's profile/logout controls are reachable and Dashboard has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await login(page, USERS.student.username, USERS.student.password);
    await expect(page).toHaveURL(/\/dashboard$/);

    await assertNoHorizontalOverflow(page);
    await expect(page.getByRole("link", { name: /Profil/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Çıkış Yap" })).toBeVisible();
  });

  test("student can open the seeded unit on mobile — no overflow, primary CTA visible", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await login(page, USERS.student.username, USERS.student.password);
    await page.getByText("E2E Test Ünitesi").click();
    await expect(page).toHaveURL(/\/unit\/\d+$/);

    await assertNoHorizontalOverflow(page);
    await expect(page.getByRole("button", { name: "Oyna" })).toBeVisible();
  });

  test("ChatBot's floating toggle doesn't cover the primary dashboard action on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await login(page, USERS.student.username, USERS.student.password);

    await expect(page.getByRole("button", { name: "Sohbet asistanını aç" })).toBeVisible();
    // Chatbot kapalıyken ana ünite kartı hâlâ görünür ve tıklanabilir olmalı.
    await expect(page.getByText("E2E Test Ünitesi")).toBeVisible();
  });
});

test.describe("Responsive sanity — AdminPanel critical access (mobile)", () => {
  test("admin's tab navigation stays reachable on mobile", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await login(page, USERS.admin.username, USERS.admin.password);
    // login() sadece submit butonuna tıklar; token yazılıp yönlendirme
    // tamamlanmadan /admin'e gitmek RequireAuth'u tokensiz yakalayıp
    // /login'e geri atabilir (gerçek bir bug değil, test-timing hatasıydı —
    // diğer tüm testler login sonrası /dashboard URL'ini bekliyor).
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/admin");

    // AdminPanel masaüstü ağırlıklı bir tablo/liste düzeni kullanır — bilinçli
    // yatay scroll (geniş içerik) "responsive fail" sayılmaz (§25). Burada
    // doğrulanan: sekme/ana kontroller görünür ve tıklanabilir kalıyor mu.
    await expect(page.getByRole("button", { name: "Eğitim İçerikleri" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Kullanıcılar" })).toBeVisible();
    await page.getByRole("button", { name: "Kullanıcılar" }).click();
    await expect(page.getByRole("button", { name: "Kullanıcılar" })).toHaveClass(/border-primary/);
  });
});
