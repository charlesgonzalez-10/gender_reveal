/**
 * Neutral, encoded reveal values. These names intentionally carry no
 * semantic meaning about "boy" or "girl" so that they are safe to store,
 * log, and pass around the app without spoiling anything. The mapping
 * from optionA/optionB to an actual human-facing reveal word lives in
 * exactly one place: src/providers/revealMapping.ts, and that module is
 * only consulted at the moment the final reveal sequence renders.
 */
export type SealedRevealResult = "optionA" | "optionB";

export interface RevealStatus {
  configured: boolean;
  locked: boolean;
}

export interface RevealActionResult {
  ok: boolean;
  error?: string;
  /** Only set on a 429 from the server; seconds until another attempt is allowed. */
  retryAfterSeconds?: number;
}

export interface VerifyPinResult {
  ok: boolean;
  error?: string;
  retryAfterSeconds?: number;
  usingDefaultPin?: boolean;
}

/**
 * The reveal is now shared server-side (see api/reveal/*) so every device
 * sees the exact same locked result — this interface no longer has any
 * browser-storage-backed implementation. setReveal/resetReveal require an
 * admin token obtained from verifyPin, which the server issues only after
 * checking the PIN itself (never sent back to the browser).
 */
export interface RevealProvider {
  getStatus(): Promise<RevealStatus>;
  getRevealValue(): Promise<SealedRevealResult | null>;
  verifyPin(pin: string): Promise<VerifyPinResult>;
  setReveal(result: SealedRevealResult, adminToken: string): Promise<RevealActionResult>;
  resetReveal(adminToken: string): Promise<RevealActionResult>;
}
