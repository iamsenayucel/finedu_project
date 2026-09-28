import { test, expect } from "@playwright/test";
import { USERS } from "./fixtures";

async function login(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Kullanıcı adınızı girin").fill(username);
  await page.getByPlaceholder("••••••••").fill(password);
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
}

test("a student with a completed pre-survey logs in and lands on the dashboard", async ({ page }) => {
  await login(page, USERS.student.username, USERS.student.password);

  await expect(page).toHaveURL(/\/dashboard$/);
  // Token gerçekten localStorage'a yazılmış mı (auth source of truth).
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("token")))
    .not.toBeNull();
  await expect(page.getByRole("heading", { name: "Eğitim Ünitelerin" })).toBeVisible();
});

// AŞAMA 5 madde 30: ön anketi tamamlamamış öğrenci /pre-survey'e yönlendirilmeli.
test("a student with an incomplete pre-survey is redirected to /pre-survey after login", async ({ page }) => {
  await login(page, USERS.studentPreSurvey.username, USERS.studentPreSurvey.password);

  await expect(page).toHaveURL(/\/pre-survey$/);
  await expect(page.getByText("Ön Anket")).toBeVisible();
});

test("a wrong password shows the app's own Turkish error (not raw backend text) and does not store a token", async ({ page }) => {
  await login(page, USERS.student.username, "wrong-password-xyz");

  // Backend (DRF'nin stock obtain_auth_token'ı) İngilizce "Unable to log in
  // with provided credentials." döner — kullanıcıya bu ham metin değil,
  // ürünün kendi Türkçe mesajı gösterilmeli (AŞAMA 5 madde 47/93).
  await expect(page.getByText("Kullanıcı adı veya şifre hatalı!")).toBeVisible();
  await expect(page.getByText(/Unable to log in/i)).toHaveCount(0);
  await expect(page).toHaveURL(/\/login$/);
  const token = await page.evaluate(() => localStorage.getItem("token"));
  expect(token).toBeNull();
});
