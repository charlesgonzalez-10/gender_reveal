import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_PIN_WARNING = "change-this-pin";

export const RATE_LIMIT = {
  windowSeconds: 60,
  maxAttempts: 5,
};

function getPin(): string {
  const pin = process.env.ADMIN_PIN;
  if (!pin) {
    throw new Error("ADMIN_PIN is not configured on the server.");
  }
  return pin;
}

/** Falls back to the PIN itself so no second secret is strictly required. */
function getTokenSecret(): string {
  return process.env.ADMIN_TOKEN_SECRET || getPin();
}

function hmac(input: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(input).digest();
}

/**
 * Constant-time-ish string compare: both inputs are hashed to a fixed
 * length first so neither the early-exit nor the length of the raw
 * candidate leaks anything through timing, then compared with
 * crypto.timingSafeEqual.
 */
function safeStringEqual(a: string, b: string): boolean {
  const padSecret = "grp-constant-time-pad";
  const da = hmac(a, padSecret);
  const db = hmac(b, padSecret);
  return timingSafeEqual(da, db);
}

export function isPinConfigured(): boolean {
  return typeof process.env.ADMIN_PIN === "string" && process.env.ADMIN_PIN.length > 0;
}

export function isDefaultPin(): boolean {
  return getPin() === DEFAULT_PIN_WARNING;
}

export function verifyPin(candidate: unknown): boolean {
  if (typeof candidate !== "string" || candidate.length === 0) return false;
  return safeStringEqual(candidate, getPin());
}

export function issueAdminToken(): string {
  const payload = JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS });
  const payloadB64 = Buffer.from(payload, "utf8").toString("base64url");
  const sig = hmac(payloadB64, getTokenSecret()).toString("base64url");
  return `${payloadB64}.${sig}`;
}

export function verifyAdminToken(token: unknown): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sig] = parts;
  const expectedSig = hmac(payloadB64, getTokenSecret()).toString("base64url");
  if (expectedSig.length !== sig.length) return false;
  if (!timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function getClientId(headers: Record<string, string | string[] | undefined>, fallback: string): string {
  const fwd = headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd;
  const ip = first?.split(",")[0]?.trim();
  return ip || fallback;
}
