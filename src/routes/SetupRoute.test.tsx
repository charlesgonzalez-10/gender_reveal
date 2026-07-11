import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SetupRoute from "./SetupRoute";

const PIN = "test-admin-pin";

function renderSetup() {
  return render(
    <MemoryRouter>
      <SetupRoute />
    </MemoryRouter>,
  );
}

describe("SetupRoute", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.stubEnv("VITE_ADMIN_PIN", PIN);
  });

  it("blocks access until the correct PIN is entered", async () => {
    const user = userEvent.setup();
    renderSetup();

    expect(screen.getByLabelText(/enter admin pin/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/enter admin pin/i), "wrong-pin");
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect pin/i);

    await user.clear(screen.getByLabelText(/enter admin pin/i));
    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    expect(await screen.findByRole("heading", { name: "Reveal Setup" })).toBeInTheDocument();
  });

  it("shows a warning when no reveal has been set, and locks after confirming a selection", async () => {
    const user = userEvent.setup();
    renderSetup();

    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    expect(await screen.findByText(/no reveal result has been set/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Girl" }));
    expect(screen.getByText(/you selected/i)).toHaveTextContent("GIRL");

    await user.click(screen.getByRole("button", { name: /lock reveal/i }));

    expect(await screen.findByText(/securely set/i)).toBeInTheDocument();
    expect(await screen.findByText(/LOCKED/)).toBeInTheDocument();

    // The confirmation success message must never restate the plaintext
    // result after locking.
    expect(screen.queryByText(/you selected/i)).not.toBeInTheDocument();
  });

  it("cancel returns to the selection screen without saving anything", async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    await user.click(screen.getByRole("button", { name: "Boy" }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(window.localStorage.getItem("grp_sealed_v1")).toBeNull();
    expect(screen.getByRole("button", { name: "Boy" })).toBeInTheDocument();
  });

  it("requires the PIN again to reset a locked reveal", async () => {
    window.localStorage.setItem("grp_sealed_v1", "optionA");
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    await user.click(await screen.findByRole("button", { name: /reset reveal/i }));
    await user.type(screen.getByLabelText("Admin PIN"), "wrong");
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));
    expect(await screen.findByText(/incorrect pin/i)).toBeInTheDocument();
    expect(window.localStorage.getItem("grp_sealed_v1")).toBe("optionA");

    await user.clear(screen.getByLabelText("Admin PIN"));
    await user.type(screen.getByLabelText("Admin PIN"), PIN);
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() => expect(window.localStorage.getItem("grp_sealed_v1")).toBeNull());
  });

  it("preview mode never writes to the stored reveal", async () => {
    window.localStorage.setItem("grp_sealed_v1", "optionB");
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    await user.click(await screen.findByRole("button", { name: /preview: boy ending/i }));
    expect(await screen.findByText(/preview mode/i)).toBeInTheDocument();

    // Stored (real) reveal must be untouched by previewing the other option.
    expect(window.localStorage.getItem("grp_sealed_v1")).toBe("optionB");
  });
});
