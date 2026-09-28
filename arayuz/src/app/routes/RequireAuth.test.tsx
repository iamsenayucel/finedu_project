import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import RequireAuth from "./RequireAuth";

// AŞAMA 5: anonim kullanıcı korumalı bir route'u doğrudan URL'den açtığında
// (örn. adres çubuğuna /admin yazıp Enter) sayfa hiç mount olmadan /login'e
// yönlendirilmeli — section 95 "Direct URL testi".
function renderWithGuard(initialPath: string, hasToken: boolean) {
  if (hasToken) localStorage.setItem("token", "some-token");

  const router = createMemoryRouter(
    [
      { path: "/login", element: <div>Giriş Sayfası</div> },
      {
        element: <RequireAuth />,
        children: [{ path: "/dashboard", element: <div>Panel İçeriği</div> }],
      },
    ],
    { initialEntries: [initialPath] }
  );

  return render(<RouterProvider router={router} />);
}

describe("RequireAuth — route-level authentication gate (AŞAMA 5)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects an anonymous user straight to /login without rendering the protected page", async () => {
    renderWithGuard("/dashboard", false);
    expect(await screen.findByText("Giriş Sayfası")).toBeInTheDocument();
    expect(screen.queryByText("Panel İçeriği")).not.toBeInTheDocument();
  });

  it("renders the protected page when a token is present", async () => {
    renderWithGuard("/dashboard", true);
    expect(await screen.findByText("Panel İçeriği")).toBeInTheDocument();
  });
});
