import { test, expect } from "@playwright/test";
import { USERS } from "./fixtures";

// AŞAMA 5 madde 17/35: token localStorage'da geçerliymiş gibi duruyor ama
// backend onu artık kabul etmiyor (revoke/expire). apiFetch'in merkezi 401
// davranışı: session temizlenir, kullanıcı login'e döner — stale bir sayfada
// kilitli kalmaz. Gerçek token expiry'yi tetiklemek yerine backend cevabını
// network seviyesinde 401'e çeviriyoruz (madde 35 "mock/intercept kullanmak
// daha güvenliyse browser seviyesinde response override kullanılabilir").
test("a 401 from the backend clears the stale session and returns the user to /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("Kullanıcı adınızı girin").fill(USERS.student.username);
  await page.getByPlaceholder("••••••••").fill(USERS.student.password);
  await page.getByRole("button", { name: /Giriş Yap/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.route("**/api/**", (route) => {
    route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
  });

  // apiFetch'in 401 üzerine yaptığı window.location.href = "/login" redirect'i
  // bu goto'nun kendi "load" beklemesini yarıda kesip net::ERR_ABORTED
  // fırlatabilir — bu, test edilmek istenen davranışın ta kendisi (client-side
  // redirect), o yüzden goto'nun reddini yutup sonucu URL üzerinden doğruluyoruz.
  await page.goto("/profile").catch(() => {});

  await expect(page).toHaveURL(/\/login$/);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("token")))
    .toBeNull();
});
