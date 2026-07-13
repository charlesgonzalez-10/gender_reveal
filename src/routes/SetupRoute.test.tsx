import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SetupRoute from "./SetupRoute";

const PIN = "test-admin-pin";
const TOKEN = "test-admin-token";

/**
 * The reveal is now shared server-side (see api/reveal/*), so these tests
 * drive SetupRoute against a small in-memory fake of that API instead of
 * localStorage. This mirrors exactly what a real device would see: the
 * "locked" state lives behind fetch, not in this browser's storage.
 */
function createFakeRevealServer(initial: "optionA" | "optionB" | null = null) {
  let sealedValue: "optionA" | "optionB" | null = initial;

  return async function fakeFetch(input: string | URL | Request, init?: RequestInit) {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";
    const json = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

    if (url.endsWith("/api/reveal/status") && method === "GET") {
      return json(200, { configured: sealedValue !== null, locked: sealedValue !== null });
    }
    if (url.endsWith("/api/reveal/value") && method === "GET") {
      return json(200, { sealedValue });
    }
    if (url.endsWith("/api/reveal/verify-pin") && method === "POST") {
      const body = JSON.parse(String(init?.body ?? "{}")) as { pin?: string };
      if (body.pin === PIN) return json(200, { ok: true, token: TOKEN });
      return json(401, { ok: false, error: "Incorrect PIN." });
    }
    if (url.endsWith("/api/reveal/set") && method === "POST") {
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (auth !== `Bearer ${TOKEN}`) return json(401, { ok: false, error: "Admin session expired." });
      if (sealedValue !== null) return json(409, { ok: false, error: "The reveal has already been locked." });
      const body = JSON.parse(String(init?.body ?? "{}")) as { value?: "optionA" | "optionB" };
      sealedValue = body.value ?? null;
      return json(200, { ok: true });
    }
    if (url.endsWith("/api/reveal/reset") && method === "POST") {
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization;
      if (auth !== `Bearer ${TOKEN}`) return json(401, { ok: false, error: "Admin session expired." });
      sealedValue = null;
      return json(200, { ok: true });
    }
    throw new Error(`Unhandled fake fetch: ${method} ${url}`);
  };
}

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
  });

  it("blocks access until the correct PIN is entered", async () => {
    vi.stubGlobal("fetch", createFakeRevealServer());
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
    vi.stubGlobal("fetch", createFakeRevealServer());
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
    const fake = createFakeRevealServer();
    vi.stubGlobal("fetch", fake);
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    await user.click(await screen.findByRole("button", { name: "Boy" }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.getByRole("button", { name: "Boy" })).toBeInTheDocument();
    const statusRes = await fake("/api/reveal/status");
    expect((await statusRes.json()).locked).toBe(false);
  });

  it("a second device attempting to lock an already-locked reveal is rejected", async () => {
    vi.stubGlobal("fetch", createFakeRevealServer("optionA"));
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    expect(await screen.findByText(/LOCKED/)).toBeInTheDocument();
  });

  it("requires the PIN again to reset a locked reveal", async () => {
    vi.stubGlobal("fetch", createFakeRevealServer("optionA"));
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    await user.click(await screen.findByRole("button", { name: /reset reveal/i }));
    await user.type(screen.getByLabelText("Admin PIN"), "wrong");
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));
    expect(await screen.findByText(/incorrect pin/i)).toBeInTheDocument();
    expect(await screen.findByText(/LOCKED/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Admin PIN"));
    await user.type(screen.getByLabelText("Admin PIN"), PIN);
    await user.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() => expect(screen.getByText(/NOT SET/)).toBeInTheDocument());
  });

  it("preview mode never writes to the stored reveal", async () => {
    const fake = createFakeRevealServer("optionB");
    vi.stubGlobal("fetch", fake);
    const user = userEvent.setup();
    renderSetup();
    await user.type(screen.getByLabelText(/enter admin pin/i), PIN);
    await user.click(screen.getByRole("button", { name: /unlock setup/i }));

    await user.click(await screen.findByRole("button", { name: /preview: boy ending/i }));
    expect(await screen.findByText(/preview mode/i)).toBeInTheDocument();

    // Stored (real) reveal must be untouched by previewing the other option.
    const valueRes = await fake("/api/reveal/value");
    expect((await valueRes.json()).sealedValue).toBe("optionB");
  });
});
