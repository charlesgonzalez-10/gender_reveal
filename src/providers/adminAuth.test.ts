import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAdminSession, getAdminToken, isAdminSessionVerified, verifyAdminPin } from "./adminAuth";

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("adminAuth", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores the server-issued token on a correct PIN and reports the session verified", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { ok: true, token: "server-token-abc" })),
    );

    expect(isAdminSessionVerified()).toBe(false);
    const result = await verifyAdminPin("super-secret-pin");
    expect(result.ok).toBe(true);
    expect(getAdminToken()).toBe("server-token-abc");
    expect(isAdminSessionVerified()).toBe(true);
  });

  it("never stores a token when the server rejects the PIN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(401, { ok: false, error: "Incorrect PIN." })),
    );

    const result = await verifyAdminPin("wrong");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Incorrect PIN.");
    expect(getAdminToken()).toBeNull();
    expect(isAdminSessionVerified()).toBe(false);
  });

  it("surfaces rate-limit retry timing from a 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(429, { ok: false, error: "Too many incorrect attempts.", retryAfterSeconds: 42 }),
      ),
    );

    const result = await verifyAdminPin("wrong");
    expect(result.ok).toBe(false);
    expect(result.retryAfterSeconds).toBe(42);
  });

  it("clears the session token on clearAdminSession", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(200, { ok: true, token: "server-token-abc" })),
    );
    await verifyAdminPin("super-secret-pin");
    expect(isAdminSessionVerified()).toBe(true);
    clearAdminSession();
    expect(isAdminSessionVerified()).toBe(false);
    expect(getAdminToken()).toBeNull();
  });

  it("treats a network failure as a non-fatal, retryable error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await verifyAdminPin("super-secret-pin");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/network error/i);
  });
});
