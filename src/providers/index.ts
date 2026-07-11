import { LocalRevealProvider } from "./LocalRevealProvider";
import type { RevealProvider } from "../types/reveal";

/**
 * Single source of truth for which RevealProvider implementation the app
 * uses. Swap this to a server-backed provider later without touching any
 * consumer code — everything depends on the RevealProvider interface.
 */
export const revealProvider: RevealProvider = new LocalRevealProvider();

export type { RevealProvider, SealedRevealResult } from "../types/reveal";
export { LocalRevealProvider } from "./LocalRevealProvider";
