import { test, expect } from "@playwright/test";
import { USERS } from "./fixtures";

// AŞAMA 5 madde 32/67: 38 oyunun tamamını değil, temsili bir oyunu E2E'de
// doğruluyoruz — lazy chunk yükleniyor, component render oluyor, geri dönüş
// çalışıyor. Oyunun kendi puanlama iş mantığı kapsam dışı.
test("student can open the seeded unit, launch its game (lazy chunk), and navigate back", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Kullanıcı adınızı girin").fill(USERS.student.username);
  await page.getByPlaceholder("••••••••").fill(USERS.student.password);
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.getByText("E2E Test Ünitesi").click();
  await expect(page.getByText("E2E Alt Konu")).toBeVisible();

  await page.getByRole("button", { name: "Oyna" }).click();

  // GameContainer'ın paylaşılan kabuğu: lazy chunk indirilip render olduğunda
  // görünür (Suspense fallback "Oyun yükleniyor..." kısa süreli olabilir).
  await expect(page.getByText("Etkileşimli Oyun Modu")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ders Listesine Dön" })).toBeVisible();

  await page.getByRole("button", { name: "Ders Listesine Dön" }).click();
  await expect(page.getByText("E2E Alt Konu")).toBeVisible();
});
