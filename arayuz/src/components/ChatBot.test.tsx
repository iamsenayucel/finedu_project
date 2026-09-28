import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { setAuthToken, clearSession } from "../app/utils/api";
import ChatBot from "./ChatBot";

// AŞAMA 5 kapanış — confirmed bug (found via Playwright responsive test):
// ChatBot mount olur App seviyesinde, <RouterProvider>'ın DIŞINDA. Login
// sayfası client-side navigate("/dashboard") yaptığında ChatBot'un kendisi
// hiç re-render olmuyordu, bu yüzden token artık var olsa bile ChatBot sayfa
// yenilenene kadar hep `null` render ediyordu (asistan hiç görünmüyordu).
describe("ChatBot.tsx — reacts to login/logout without a full page reload", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing when there is no token", () => {
    render(<ChatBot />);
    expect(screen.queryByRole("button", { name: "Sohbet asistanını aç" })).not.toBeInTheDocument();
  });

  it("appears after setAuthToken() is called post-mount (client-side login, no page reload)", async () => {
    render(<ChatBot />);
    expect(screen.queryByRole("button", { name: "Sohbet asistanını aç" })).not.toBeInTheDocument();

    setAuthToken("fresh-token");

    expect(await screen.findByRole("button", { name: "Sohbet asistanını aç" })).toBeInTheDocument();
  });

  it("disappears after clearSession() is called post-mount (logout without a page reload)", async () => {
    setAuthToken("fresh-token");
    render(<ChatBot />);
    expect(await screen.findByRole("button", { name: "Sohbet asistanını aç" })).toBeInTheDocument();

    clearSession();

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Sohbet asistanını aç" })).not.toBeInTheDocument()
    );
  });
});
