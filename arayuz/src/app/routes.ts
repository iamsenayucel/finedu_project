import { createBrowserRouter } from "react-router";

// Route-level code splitting: each page (and, for /unit/:unitId, the entire
// GameContainer + 38 game components it statically imports) ships in its
// own chunk instead of the single ~1.1MB initial bundle (MEASURED, AŞAMA 4
// bundle analysis). react-router's `lazy` fetches the module on navigation
// and needs no Suspense wrapper — behavior/contract of each page is unchanged.
export const router = createBrowserRouter([
  { path: "/", lazy: () => import("./pages/Landing").then((m) => ({ Component: m.default })) },
  { path: "/login", lazy: () => import("./pages/Login").then((m) => ({ Component: m.default })) },
  { path: "/register", lazy: () => import("./pages/Register").then((m) => ({ Component: m.default })) },
  { path: "/pre-survey", lazy: () => import("./pages/PreSurvey").then((m) => ({ Component: m.default })) },
  { path: "/post-survey", lazy: () => import("./pages/PostSurvey").then((m) => ({ Component: m.default })) },
  { path: "/dashboard", lazy: () => import("./pages/Dashboard").then((m) => ({ Component: m.default })) },
  { path: "/unit/:unitId", lazy: () => import("./pages/UnitDetail").then((m) => ({ Component: m.default })) },
  { path: "/admin", lazy: () => import("./pages/AdminPanel").then((m) => ({ Component: m.default })) },
  { path: "/profile", lazy: () => import("./pages/Profile").then((m) => ({ Component: m.default })) },
  { path: "/values-bridge", lazy: () => import("./pages/ValuesBridge").then((m) => ({ Component: m.default })) },
]);
