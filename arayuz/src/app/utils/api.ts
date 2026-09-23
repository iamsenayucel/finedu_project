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
