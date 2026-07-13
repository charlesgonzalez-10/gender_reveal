import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getClientId,
  isDefaultPin,
  isPinConfigured,
  issueAdminToken,
  verifyAdminToken,
  verifyPin,
} from "./adminAuth";

describe("adminAuth", () => {
  beforeEach(() => {
    vi.stubEnv("ADMIN_PIN", "super-secret-pin");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("verifies only the exact configured PIN", () => {
    expect(verifyPin("super-secret-pin")).toBe(true);
    expect(verifyPin("wrong")).toBe(false);
    expect(verifyPin("")).toBe(false);
    expect(verifyPin(undefined)).toBe(false);
  });

  it("reports whether ADMIN_PIN is configured", () => {
    expect(isPinConfigured()).toBe(true);
    vi.stubEnv("ADMIN_PIN", "");
    expect(isPinConfigured()).toBe(false);
  });

  it("flags the insecure default PIN", () => {
    vi.stubEnv("ADMIN_PIN", "change-this-pin");
    expect(isDefaultPin()).toBe(true);
    vi.stubEnv("ADMIN_PIN", "a-real-pin");
    expect(isDefaultPin()).toBe(false);
  });

  it("throws when ADMIN_PIN is not configured at all", () => {
    vi.stubEnv("ADMIN_PIN", "");
    expect(() => verifyPin("anything")).toThrow();
  });

  it("issues a token that verifies successfully and rejects tampering", () => {
    const token = issueAdminToken();
    expect(verifyAdminToken(token)).toBe(true);
    expect(verifyAdminToken(token + "x")).toBe(false);
    expect(verifyAdminToken("garbage")).toBe(false);
    expect(verifyAdminToken(undefined)).toBe(false);
  });

  it("rejects an expired token", () => {
    vi.useFakeTimers();
    const token = issueAdminToken();
    expect(verifyAdminToken(token)).toBe(true);
    vi.advanceTimersByTime(16 * 60 * 1000);
    expect(verifyAdminToken(token)).toBe(false);
    vi.useRealTimers();
  });

  it("rejects a token signed under a different secret", () => {
    const token = issueAdminToken();
    vi.stubEnv("ADMIN_TOKEN_SECRET", "a-totally-different-secret");
    expect(verifyAdminToken(token)).toBe(false);
  });

  it("extracts the first x-forwarded-for address as the client id", () => {
    expect(getClientId({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }, "fallback")).toBe("1.2.3.4");
    expect(getClientId({ "x-forwarded-for": ["9.9.9.9"] }, "fallback")).toBe("9.9.9.9");
    expect(getClientId({}, "fallback-ip")).toBe("fallback-ip");
  });
});
