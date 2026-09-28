import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { API_BASE_URL, getAuthToken, authHeaders, clearSession, apiFetch } from "./api";
import { setCached, getCached } from "./apiCache";

describe("api.ts — shared origin + auth header helper (AŞAMA 2)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("API_BASE_URL is a non-empty https origin", () => {
    expect(API_BASE_URL).toMatch(/^https:\/\//);
  });

  it("getAuthToken returns null when no token is stored", () => {
    expect(getAuthToken()).toBeNull();
  });

  it("getAuthToken reads the token from localStorage['token']", () => {
    localStorage.setItem("token", "abc123");
    expect(getAuthToken()).toBe("abc123");
  });

  it("authHeaders() without a token still builds an Authorization header (no crash on null)", () => {
    // Register/Login sayfaları token yokken de bu fonksiyonu çağırabilir;
    // template literal `Token ${null}` -> "Token null" üretmeli, undefined/throw değil.
    expect(authHeaders()).toEqual({ Authorization: "Token null" });
  });

  it("authHeaders() includes the stored token and omits Content-Type by default", () => {
    localStorage.setItem("token", "my-token");
    const headers = authHeaders();
    expect(headers.Authorization).toBe("Token my-token");
    expect(headers["Content-Type"]).toBeUndefined();
  });

  it("authHeaders(true) adds Content-Type: application/json", () => {
    localStorage.setItem("token", "my-token");
    const headers = authHeaders(true);
    expect(headers).toEqual({
      Authorization: "Token my-token",
      "Content-Type": "application/json",
    });
  });
});

describe("clearSession — AŞAMA 5 tek logout/session-expiry kaynağı", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes the token and empties the shared apiCache (cross-user isolation)", () => {
    localStorage.setItem("token", "old-user-token");
    setCached("me", { user: { role: "STUDENT", first_name: "Eski Kullanıcı" } });

    clearSession();

    expect(localStorage.getItem("token")).toBeNull();
    expect(getCached("me")).toBeNull();
  });
});

describe("apiFetch — merkezi 401 davranışı (AŞAMA 5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches the stored token and Content-Type, and returns the response untouched on success", async () => {
    localStorage.setItem("token", "good-token");
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _options?: RequestInit) =>
      ({ ok: true, status: 200, json: async () => ({ hello: "world" }) } as Response)
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await apiFetch("https://example.test/api/progress/");

    expect(res.ok).toBe(true);
    expect(await res.json()).toEqual({ hello: "world" });
    const [, options] = fetchMock.mock.calls[0];
    expect((options as RequestInit).headers).toMatchObject({
      Authorization: "Token good-token",
      "Content-Type": "application/json",
    });
  });

  it("on a 401 response, clears the token and the apiCache (does not leave a stale session)", async () => {
    localStorage.setItem("token", "expired-token");
    setCached("me", { user: { role: "STUDENT" } });
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) } as Response)));

    await apiFetch("https://example.test/api/progress/");

    expect(localStorage.getItem("token")).toBeNull();
    expect(getCached("me")).toBeNull();
  });

  it("on a 403 response, leaves the session untouched (403 is not a session-expiry signal)", async () => {
    localStorage.setItem("token", "valid-but-forbidden-token");
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) } as Response)));

    await apiFetch("https://example.test/api/classrooms/1/");

    expect(localStorage.getItem("token")).toBe("valid-but-forbidden-token");
  });
});
