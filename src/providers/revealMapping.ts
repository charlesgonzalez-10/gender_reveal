import type { SealedRevealResult } from "../types/reveal";

/**
 * The ONLY place in the codebase that maps a neutral sealed token to a
 * human-facing reveal word. Import this module only from the final
 * reveal render path (and the setup screen's own selection UI, which
 * needs to show the trusted admin what they're picking). Never log the
 * output of `describeReveal`.
 */
export type RevealWord = "boy" | "girl";

const MAPPING: Record<SealedRevealResult, RevealWord> = {
  optionA: "boy",
  optionB: "girl",
};

export function describeReveal(sealed: SealedRevealResult): RevealWord {
  return MAPPING[sealed];
}

export function sealedTokenFor(word: RevealWord): SealedRevealResult {
  return word === "boy" ? "optionA" : "optionB";
}
