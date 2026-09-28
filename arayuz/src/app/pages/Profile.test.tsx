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

import Profile from "./Profile";

function jsonResponse(body: unknown, status = 200) {
  return { ok: status < 300, status, json: async () => body } as Response;
}

describe("Profile.tsx — non-401 failure vs session expiry (AŞAMA 5 kapanış)", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "valid-token");
    invalidateCache();
    navigateMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("a network failure keeps the token, does not redirect to /login, and shows an error state with retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("Failed to fetch"); }));

    render(<Profile />);

    expect(await screen.findByText("Profil yüklenirken bir sorun oluştu")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Tekrar Dene/i })).toBeInTheDocument();

    expect(navigateMock).not.toHaveBeenCalledWith("/login");
    expect(localStorage.getItem("token")).toBe("valid-token");
  });

  it("a 500 response keeps the token and shows an error state (not treated as auth failure)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ error: "Internal Server Error" }, 500)));

    render(<Profile />);

    expect(await screen.findByText("Profil yüklenirken bir sorun oluştu")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalledWith("/login");
    expect(localStorage.getItem("token")).toBe("valid-token");
  });

  it("a 403 preserves the session — no forced logout", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "Forbidden" }, 403)));

    render(<Profile />);

    expect(await screen.findByText("Profil yüklenirken bir sorun oluştu")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBe("valid-token");
  });

  it("a genuine 401 clears the session via the global handler", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ detail: "Invalid token." }, 401)));

    render(<Profile />);

    await vi.waitFor(() => expect(localStorage.getItem("token")).toBeNull());
  });
});
