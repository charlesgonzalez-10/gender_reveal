import { ServerRevealProvider } from "./ServerRevealProvider";
import type { RevealProvider } from "../types/reveal";

/**
 * Single source of truth for which RevealProvider implementation the app
 * uses. The reveal is shared server-side (see api/reveal/*) so every
 * device sees the exact same locked result.
 */
export const revealProvider: RevealProvider = new ServerRevealProvider();

/**
 * The reveal used to be stored per-device under this localStorage key.
 * That made it possible for two phones to see two different results,
 * which is exactly what the server-backed provider above fixes. Remove
 * any leftover legacy value so a stale local copy can never be mistaken
 * for the shared, authoritative one — everything else the game keeps in
 * localStorage (progress, name, sound, challenges) is left untouched.
 */
function migrateLegacyLocalReveal(): void {
  try {
    window.localStorage.removeItem("grp_sealed_v1");
  } catch {
    // ignore — nothing to migrate if storage is unavailable
  }
}

migrateLegacyLocalReveal();

export type { RevealProvider, SealedRevealResult } from "../types/reveal";
export { ServerRevealProvider } from "./ServerRevealProvider";
