import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, beforeEach } from "vitest";

import { LeadCaptureForm } from "@/components/LeadCaptureForm";

describe("LeadCaptureForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("validates email input before sending", async () => {
    render(<LeadCaptureForm />);

    const input = screen.getByLabelText(/E-mail do kontaktu/i);
    await userEvent.type(input, "invalid-email");
    await userEvent.click(screen.getByRole("button", { name: /umów prezentację/i }));

    expect(
      screen.getByText(/Wpisz poprawny adres e-mail/i)
    ).toBeInTheDocument();
  });

  test("submits lead and shows success state", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) }) as unknown as Response
    ));

    render(<LeadCaptureForm />);

    const input = screen.getByLabelText(/E-mail do kontaktu/i);
    await userEvent.type(input, "kontakt@sklep.pl");
    await userEvent.click(screen.getByRole("button", { name: /umów prezentację/i }));

    await waitFor(() => {
      expect(screen.getByText(/Dziękujemy!/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/leads",
      expect.objectContaining({ method: "POST" })
    );
  });

  test("handles backend error state", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: false, status: 500 }) as unknown as Response
    ));

    render(<LeadCaptureForm />);

    const input = screen.getByLabelText(/E-mail do kontaktu/i);
    await userEvent.type(input, "kontakt@sklep.pl");
    await userEvent.click(screen.getByRole("button", { name: /umów prezentację/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Coś poszło nie tak/i)
      ).toBeInTheDocument();
    });
  });
});
