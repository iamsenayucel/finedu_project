import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const navigateMock = vi.fn();

// react-router'ın gerçek <Link>'i BrowserRouter/RouterProvider context'i
// gerektirir; bu sayfa testinde routing'in kendisi değil Login'in davranışı
// test edildiği için <Link>'i basit bir <a>'ya indirgiyoruz.
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

import Login from "./Login";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as Response;
}

describe("Login.tsx — token storage + role-based redirect (AŞAMA 2 shared api.ts)", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores the token and redirects a non-student to /dashboard on success", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/health/")) return jsonResponse({});
      if (url.endsWith("/api/login/")) return jsonResponse({ token: "tok-123" });
      if (url.endsWith("/api/me/")) {
        return jsonResponse({ user: { role: "TEACHER" } });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Login />);

    await userEvent.type(screen.getByPlaceholderText("Kullanıcı adınızı girin"), "teacher1");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /Giriş Yap/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/dashboard"));
    expect(localStorage.getItem("token")).toBe("tok-123");
  });

  it("sends a student with an incomplete pre-survey to /pre-survey instead of /dashboard", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/health/")) return jsonResponse({});
      if (url.endsWith("/api/login/")) return jsonResponse({ token: "tok-456" });
      if (url.endsWith("/api/me/")) return jsonResponse({ user: { role: "STUDENT" } });
      if (url.endsWith("/api/survey/pre_survey/status/")) {
        return jsonResponse({ is_completed: false });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Login />);
    await userEvent.type(screen.getByPlaceholderText("Kullanıcı adınızı girin"), "student1");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /Giriş Yap/i }));

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/pre-survey"));
  });

  it("shows the backend error message and does not store a token on failed login", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.endsWith("/api/health/")) return jsonResponse({});
      if (url.endsWith("/api/login/")) {
        return jsonResponse({ non_field_errors: ["Kullanıcı adı veya şifre hatalı!"] }, false);
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Login />);
    await userEvent.type(screen.getByPlaceholderText("Kullanıcı adınızı girin"), "wronguser");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /Giriş Yap/i }));

    expect(await screen.findByText("Kullanıcı adı veya şifre hatalı!")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(localStorage.getItem("token")).toBeNull();
  });
});
