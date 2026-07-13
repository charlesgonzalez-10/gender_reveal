/**
 * Client-side helper for the /setup admin session.
 *
 * The actual PIN never lives in the browser (see api/_lib/adminAuth.ts —
 * it is read only from the server-only ADMIN_PIN env var and checked with
 * a constant-time comparison inside the serverless function). This module
 * only calls POST /api/reveal/verify-pin and, on success, remembers the
 * short-lived signed token the server hands back so subsequent set/reset
 * calls can prove the PIN was already checked without resending it.
 */
import type { VerifyPinResult } from "../types/reveal";

const TOKEN_KEY = "grp_admin_token_v1";

export async function verifyAdminPin(candidate: string): Promise<VerifyPinResult> {
  try {
    const res = await fetch("/api/reveal/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: candidate }),
    });
    const data = (await res.json()) as VerifyPinResult & { token?: string };
    if (res.ok && data.ok && data.token) {
      try {
        window.sessionStorage.setItem(TOKEN_KEY, data.token);
      } catch {
        // ignore — session persistence is a convenience, not a requirement
      }
      return { ok: true, usingDefaultPin: data.usingDefaultPin };
    }
    return { ok: false, error: data.error || "Incorrect PIN.", retryAfterSeconds: data.retryAfterSeconds };
  } catch {
    return { ok: false, error: "Network error verifying PIN. Check your connection and try again." };
  }
}

export function getAdminToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function isAdminSessionVerified(): boolean {
  return Boolean(getAdminToken());
}

export function clearAdminSession(): void {
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
