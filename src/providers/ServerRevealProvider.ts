import type {
  RevealActionResult,
  RevealProvider,
  RevealStatus,
  SealedRevealResult,
  VerifyPinResult,
} from "../types/reveal";

/**
 * Server-backed reveal provider. Every device reads/writes the same
 * shared state through the /api/reveal/* serverless functions (backed by
 * Redis — see api/_lib/kv.ts) so the locked result is identical no matter
 * which phone or browser asks. The admin PIN is verified entirely on the
 * server (api/_lib/adminAuth.ts); this class only ever holds the opaque
 * session token returned by verifyPin(), never the PIN itself.
 */
export class ServerRevealProvider implements RevealProvider {
  async getStatus(): Promise<RevealStatus> {
    try {
      const res = await fetch("/api/reveal/status");
      if (!res.ok) return { configured: false, locked: false };
      const data = (await res.json()) as RevealStatus;
      return { configured: Boolean(data.configured), locked: Boolean(data.locked) };
    } catch {
      return { configured: false, locked: false };
    }
  }

  async getRevealValue(): Promise<SealedRevealResult | null> {
    try {
      const res = await fetch("/api/reveal/value");
      if (!res.ok) return null;
      const data = (await res.json()) as { sealedValue: SealedRevealResult | null };
      return data.sealedValue === "optionA" || data.sealedValue === "optionB" ? data.sealedValue : null;
    } catch {
      return null;
    }
  }

  async verifyPin(pin: string): Promise<VerifyPinResult> {
    try {
      const res = await fetch("/api/reveal/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as VerifyPinResult;
      return { ...data, ok: res.ok && Boolean(data.ok) };
    } catch {
      return { ok: false, error: "Network error verifying PIN." };
    }
  }

  async setReveal(result: SealedRevealResult, adminToken: string): Promise<RevealActionResult> {
    try {
      const res = await fetch("/api/reveal/set", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ value: result }),
      });
      const data = (await res.json()) as RevealActionResult;
      return { ...data, ok: res.ok && Boolean(data.ok) };
    } catch {
      return { ok: false, error: "Network error saving the reveal." };
    }
  }

  async resetReveal(adminToken: string): Promise<RevealActionResult> {
    try {
      const res = await fetch("/api/reveal/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      });
      const data = (await res.json()) as RevealActionResult;
      return { ...data, ok: res.ok && Boolean(data.ok) };
    } catch {
      return { ok: false, error: "Network error resetting the reveal." };
    }
  }
}
