import { describe, it, expect, beforeEach } from "vitest";
import { API_BASE_URL, getAuthToken, authHeaders } from "./api";

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
