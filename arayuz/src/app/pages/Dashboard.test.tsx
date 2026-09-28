import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { invalidateCache } from "../utils/apiCache";

const navigateMock = vi.fn();

// Navbar (bu sayfada her zaman render olur) react-router'ın gerçek <Link>'ini
// kullanıyor, bu da bir Router context'i gerektirir — Login.test.tsx'teki
// pattern'le aynı şekilde basit bir <a>'ya indirgiyoruz.
vi.mock("react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

import Dashboard from "./Dashboard";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 300, status, json: async () => body } as Response;
}

// AŞAMA 5 kapanış: network/5xx/parse hataları ile gerçek 401 (session expiry)
// aynı şey değil — Dashboard artık bunları birbirinden ayırıyor mu?
describe("Dashboard.tsx — non-401 failure vs session expiry (AŞAMA 5 kapanış)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "valid-token");
    invalidateCache();
    navigateMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("a network failure on /api/me/ keeps the token, does not redirect to /login, and shows an error state with retry", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/me/")) throw new TypeError("Failed to fetch");
      throw new Error(`Unexpected fetch in this test: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Dashboard />);

    expect(await screen.findByText("Veriler yüklenirken bir sorun oluştu")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Tekrar Dene/i })).toBeInTheDocument();

    expect(navigateMock).not.toHaveBeenCalledWith("/login");
    expect(localStorage.getItem("token")).toBe("valid-token");
  });

  it("a 500 response from /api/progress/ keeps the token and shows an error state (not treated as auth failure)", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/me/")) return jsonResponse({ user: { role: "STUDENT", completed_count: 0, total_content_count: 0 }, units: [] });
      if (url.endsWith("/api/progress/")) return jsonResponse({ error: "Internal Server Error" }, 500);
      if (url.endsWith("/api/survey/pre_survey/status/")) return jsonResponse({ is_completed: true });
      if (url.endsWith("/api/student/support-preference/")) return jsonResponse({ preference: null });
      throw new Error(`Unexpected fetch in this test: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Dashboard />);

    expect(await screen.findByText("Veriler yüklenirken bir sorun oluştu")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith("/login");
    expect(localStorage.getItem("token")).toBe("valid-token");
  });

  it("a genuine 401 clears the session (global apiFetch handling) instead of the page redirecting on its own", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ detail: "Invalid token." }, 401));
    vi.stubGlobal("fetch", fetchMock);

    render(<Dashboard />);

    await vi.waitFor(() => expect(localStorage.getItem("token")).toBeNull());
    // Dashboard's own catch block must not also call navigate("/login") —
    // that's apiFetch's job (window.location.href), not a duplicate here.
    expect(navigateMock).not.toHaveBeenCalledWith("/login");
  });
});
