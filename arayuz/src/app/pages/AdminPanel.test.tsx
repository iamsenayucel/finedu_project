import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { invalidateCache } from "../utils/apiCache";

const navigateMock = vi.fn();

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

import AdminPanel from "./AdminPanel";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 300, status, json: async () => body } as Response;
}

const ADMIN_ME = { user: { role: "ADMIN", first_name: "Admin" } };

// AŞAMA 5 kapanış: "API isteği başarısız oldu" ile "gerçekten hiç veri yok"
// aynı UI'ya düşüyor muydu? Bu iki durum artık ayrı davranmalı.
describe("AdminPanel.tsx — request failure vs genuinely empty data (AŞAMA 5 kapanış)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "valid-token");
    invalidateCache();
    navigateMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("a failed /api/units/ request shows the error state, not the normal (empty-looking) panel", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/me/")) return jsonResponse(ADMIN_ME);
      if (url.endsWith("/api/units/")) return jsonResponse({ error: "Internal Server Error" }, 500);
      if (url.endsWith("/api/users/")) return jsonResponse([]);
      throw new Error(`Unexpected fetch in this test: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminPanel />);

    expect(await screen.findByText("Yönetim paneli verileri yüklenemedi")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Tekrar Dene/i })).toBeInTheDocument();
    expect(screen.queryByText("Mevcut Üniteler")).not.toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("valid-token");
  });

  it("a successful response with zero units renders the normal panel, not the error state", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/me/")) return jsonResponse(ADMIN_ME);
      if (url.endsWith("/api/units/")) return jsonResponse([]);
      if (url.endsWith("/api/users/")) return jsonResponse([]);
      throw new Error(`Unexpected fetch in this test: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminPanel />);

    expect(await screen.findByText("Mevcut Üniteler")).toBeInTheDocument();
    expect(screen.queryByText("Yönetim paneli verileri yüklenemedi")).not.toBeInTheDocument();
  });

  it("a non-admin (403 on /api/users/, backend-expected) redirects to /dashboard — not the error state (regression)", async () => {
    // Backend /api/users/'ı ADMIN olmayana bilinçli olarak 403 ile reddeder
    // (rol yetkisi, bkz. accounts/views.py). Bu bir "request failure" değil
    // — AdminPanel'in kendi role-check redirect'i devreye girmeli. Kısa süre
    // önce bu senaryo yanlışlıkla error state'e düşüyordu (öğrenci /admin'de
    // takılı kalıyordu) çünkü ok-check role-check'ten ÖNCE çalışıyordu.
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/me/")) return jsonResponse({ user: { role: "STUDENT" } });
      if (url.endsWith("/api/units/")) return jsonResponse([]);
      if (url.endsWith("/api/users/")) return jsonResponse({ detail: "Forbidden" }, 403);
      throw new Error(`Unexpected fetch in this test: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AdminPanel />);

    await vi.waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText("Yönetim paneli verileri yüklenemedi")).not.toBeInTheDocument();
  });

  it("a genuine 401 clears the session via the global handler", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "Invalid token." }, 401)));

    render(<AdminPanel />);

    await vi.waitFor(() => expect(localStorage.getItem("token")).toBeNull());
    expect(navigateMock).not.toHaveBeenCalledWith("/login");
  });
});
