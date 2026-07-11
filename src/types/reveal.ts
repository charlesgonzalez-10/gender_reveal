/**
 * Neutral, encoded reveal values. These names intentionally carry no
 * semantic meaning about "boy" or "girl" so that they are safe to store,
 * log, and pass around the app without spoiling anything. The mapping
 * from optionA/optionB to an actual human-facing reveal word lives in
 * exactly one place: src/providers/revealMapping.ts, and that module is
 * only consulted at the moment the final reveal sequence renders.
 */
export type SealedRevealResult = "optionA" | "optionB";

export interface RevealProvider {
  hasRevealBeenSet(): Promise<boolean>;
  saveReveal(result: SealedRevealResult): Promise<void>;
  getReveal(): Promise<SealedRevealResult | null>;
  resetReveal(): Promise<void>;
}
