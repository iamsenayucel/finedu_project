import { defineConfig, devices } from "@playwright/test";

// AŞAMA 5 E2E baseline: kritik kullanıcı yolculuklarını gerçek bir browser'da
// (route + localStorage + navigation + network + render birlikte) doğrulamak
// içindir — devasa bir cross-browser matrisi değil (bkz. madde 41). Chromium
// tek başına yeterli görülmüştür.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // aynı seed'lenmiş backend'i paylaşan testler; izole bir DB per-test değil
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : "list",
  timeout: 30_000,

  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  // İki ayrı sunucu: Vite dev server (frontend) + gerçek local Django backend
  // (izole e2e_db.sqlite3 üzerinde, migrate + seed_e2e sonrası — bkz.
  // e2e/backend_server.py). Prod Neon DB'ye veya Render'a asla dokunulmaz
  // (madde 27). CI dışında zaten çalışan bir sunucu varsa yeniden kullanılır.
  webServer: [
    {
      command: "npm run dev -- --port 5173",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        VITE_API_BASE_URL: "http://localhost:8000",
      },
    },
    {
      command: "node ../e2e/run-backend.cjs",
      url: "http://localhost:8000/api/health/",
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        SQLITE_NAME: "e2e_db.sqlite3",
        DEBUG: "True",
      },
    },
  ],
});
