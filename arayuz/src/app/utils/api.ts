import { invalidateCache } from "./apiCache";

// Tek kaynak: backend origin + auth header üretimi.
//
// Önceden her sayfa/bileşen "https://finedu-project.onrender.com" adresini
// kendi içinde tekrar tanımlıyordu (bkz. CLAUDE.md "No shared API client").
// Backend origin secret değildir (bkz. CLAUDE.md), bu yüzden build-time env
// değişkeni olarak taşınması güvenlik riski oluşturmaz — yalnızca farklı
// ortamlar (lokal backend, staging vb.) için override edilebilirliği sağlar.
// VITE_API_BASE_URL tanımlı değilse mevcut production adresine sessizce
// düşülür — bu, bugüne kadarki gerçek deploy davranışıyla birebir aynıdır.
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://finedu-project.onrender.com";

// Bilinen tüm sayfalar bugün token'ı localStorage["token"] altında okuyor;
// bu format/konum değişmiyor, yalnızca tekrar eden okuma tek yere toplanıyor.
export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

// localStorage değişikliği kendi başına React'i re-render etmez. ChatBot gibi
// <RouterProvider>'ın DIŞINDA, App seviyesinde mount olan bileşenler login
// sonrası client-side navigate("/dashboard")'da hiç yeniden render olmadığı
// için token'ın artık var olduğunu asla öğrenemiyordu (AŞAMA 5 kapanış —
// gerçek bug: ChatBot her login sonrası sayfa yenilenene kadar hiç
// görünmüyordu). setAuthToken + onAuthChange bu event'i merkezileştirir.
const AUTH_CHANGE_EVENT = "finedu:auth-changed";

export function setAuthToken(token: string): void {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function onAuthChange(callback: () => void): () => void {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback); // diğer sekmelerdeki login/logout
  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// includeJson=true iken mevcut sayfalardaki `{"Content-Type": "application/json"}`
// eklenen varyantla birebir aynı header seti üretilir.
export function authHeaders(includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Token ${getAuthToken()}`,
  };
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

// Tek kaynak: logout / session-expiry sonrası temizlenmesi gereken her şey.
// localStorage["token"] silinmezse eski token'lı istekler tekrar 401 üretmeye
// devam eder; apiCache silinmezse bir sonraki kullanıcı önceki kullanıcının
// /api/me/ verisini (rol, isim, rozetler) görebilir (AŞAMA 5, user isolation).
export function clearSession(): void {
  localStorage.removeItem("token");
  invalidateCache();
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

// Merkezi 401 davranışı: AŞAMA 5 öncesinde her sayfa kendi fetch'ini yapıyor,
// 401 durumunda token localStorage'da kalmaya devam ediyor ve kullanıcı stale
// bir sayfada kilitli kalabiliyordu. apiFetch yalnızca base URL + auth header +
// 401 temizliğini merkezileştirir; response.json() sorumluluğu çağırana aittir
// (mevcut sayfa davranışlarını bozmamak için body otomatik parse edilmez).
//
// NOT: /api/login/ (yanlış şifre → 401) ve /api/register/ gibi kimlik doğrulama
// gerektirmeyen public uçlar apiFetch üzerinden ÇAĞRILMAMALI — aksi halde bir
// login hatası yanlışlıkla global logout/redirect tetikler (AŞAMA 5 madde 19).
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    ...authHeaders(true),
    ...(options.headers as Record<string, string> | undefined),
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    clearSession();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }

  return response;
}
