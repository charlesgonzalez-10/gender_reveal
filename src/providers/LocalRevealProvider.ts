import type { RevealProvider, SealedRevealResult } from "../types/reveal";

const STORAGE_KEY = "grp_sealed_v1";

function isSealedRevealResult(value: unknown): value is SealedRevealResult {
  return value === "optionA" || value === "optionB";
}

/**
 * Browser-storage-backed reveal provider.
 *
 * Security notes (see README for full detail):
 * - Only the neutral tokens "optionA" / "optionB" are ever written to
 *   storage — never the words "boy" or "girl".
 * - This is client-side storage. Anyone with local access to the
 *   device/browser devtools could technically inspect localStorage and,
 *   with knowledge of the mapping in revealMapping.ts, learn the token's
 *   meaning. This provider is intended for a private, trusted event
 *   setup — not as a secure secret store. For stronger guarantees, swap
 *   in a ServerRevealProvider (see ServerRevealProvider.example.ts).
 */
export class LocalRevealProvider implements RevealProvider {
  async hasRevealBeenSet(): Promise<boolean> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return isSealedRevealResult(raw);
    } catch {
      return false;
    }
  }

  async saveReveal(result: SealedRevealResult): Promise<void> {
    try {
      window.localStorage.setItem(STORAGE_KEY, result);
    } catch {
      throw new Error("Unable to save the reveal. Browser storage may be unavailable.");
    }
  }

  async getReveal(): Promise<SealedRevealResult | null> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return isSealedRevealResult(raw) ? raw : null;
    } catch {
      return null;
    }
  }

  async resetReveal(): Promise<void> {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      throw new Error("Unable to reset the reveal. Browser storage may be unavailable.");
    }
  }
}
