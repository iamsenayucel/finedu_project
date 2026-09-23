import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

import Register from "./Register";

function jsonResponse(body: unknown, ok = true) {
  return { ok, status: ok ? 201 : 400, json: async () => body } as Response;
}

async function fillCommonFields() {
  await userEvent.type(screen.getByPlaceholderText("Adın"), "Ada");
  await userEvent.type(screen.getByPlaceholderText("Soyadın"), "Lovelace");
  await userEvent.type(screen.getByPlaceholderText("ornek@email.com"), "ada@example.com");
  await userEvent.type(screen.getAllByPlaceholderText("••••••••")[0], "pass1234");
  await userEvent.type(screen.getAllByPlaceholderText("••••••••")[1], "pass1234");
}

describe("Register.tsx — role/grade UX and register payload contract", () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not offer ADMIN as a selectable role (frontend UX guard only — backend enforces this)", () => {
    render(<Register />);
    // Select bileşeni label'ı <select> ile programatik olarak ilişkilendirmiyor
    // (bkz. Input.tsx), bu yüzden getByLabelText yerine render sırasına göre
    // ilk combobox'ı (Rol) alıyoruz.
    const roleSelect = screen.getAllByRole("combobox")[0] as HTMLSelectElement;
    const values = Array.from(roleSelect.options).map((o) => o.value);
    expect(values).toEqual(["STUDENT", "TEACHER"]);
  });

  it("blocks submission with a local error when a student has not picked a grade level", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Register />);
    await fillCommonFields();
    // role varsayılan olarak zaten STUDENT; gradeLevel boş bırakılıyor.
    await userEvent.click(screen.getByRole("button", { name: /Kayıt Ol/i }));

    expect(await screen.findByText("Lütfen eğitim seviyenizi seçin.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends role=TEACHER and grade_level=null when registering as a teacher", async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);

    render(<Register />);
    await fillCommonFields();
    await userEvent.selectOptions(screen.getAllByRole("combobox")[0], "TEACHER");
    await userEvent.click(screen.getByRole("button", { name: /Kayıt Ol/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload).toMatchObject({
      username: "ada@example.com",
      email: "ada@example.com",
      role: "TEACHER",
      grade_level: null,
    });
  });

  it("shows the backend's error message when registration fails", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: "Bu e-posta zaten kullanımda." }, false)
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<Register />);
    await fillCommonFields();
    await userEvent.selectOptions(screen.getAllByRole("combobox")[0], "TEACHER");
    await userEvent.click(screen.getByRole("button", { name: /Kayıt Ol/i }));

    expect(await screen.findByText("Bu e-posta zaten kullanımda.")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
