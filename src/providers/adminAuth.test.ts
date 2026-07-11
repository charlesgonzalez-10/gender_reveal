import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkAdminPin, clearAdminSession, isAdminSessionVerified, isUsingDefaultPin, markAdminSessionVerified } from "./adminAuth";

describe("adminAuth", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_ADMIN_PIN", "super-secret-pin");
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts only the exact configured PIN", () => {
    expect(checkAdminPin("super-secret-pin")).toBe(true);
    expect(checkAdminPin("wrong")).toBe(false);
    expect(checkAdminPin("")).toBe(false);
  });

  it("flags the insecure default PIN", () => {
    vi.stubEnv("VITE_ADMIN_PIN", "change-this-pin");
    expect(isUsingDefaultPin()).toBe(true);
    vi.stubEnv("VITE_ADMIN_PIN", "a-real-pin");
    expect(isUsingDefaultPin()).toBe(false);
  });

  it("tracks admin session verification independently of storage for the reveal itself", () => {
    expect(isAdminSessionVerified()).toBe(false);
    markAdminSessionVerified();
    expect(isAdminSessionVerified()).toBe(true);
    clearAdminSession();
    expect(isAdminSessionVerified()).toBe(false);
  });
});
