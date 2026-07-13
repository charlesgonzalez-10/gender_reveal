export type SealedRevealResult = "optionA" | "optionB";

export interface RevealStatus {
  configured: boolean;
  locked: boolean;
}

/**
 * Minimal surface of a Redis-like client this module actually needs.
 * Letting the store depend on this instead of the concrete Upstash client
 * means the atomic-lock and rate-limit logic can be unit tested against an
 * in-memory fake, with no network involved.
 */
export interface KvClient {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown, opts?: { nx?: boolean }): Promise<unknown>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  ttl(key: string): Promise<number>;
}

const REVEAL_KEY = "reveal:sealedValue";

function isSealed(value: unknown): value is SealedRevealResult {
  return value === "optionA" || value === "optionB";
}

export class RevealStore {
  private readonly client: KvClient;

  constructor(client: KvClient) {
    this.client = client;
  }

  async getSealedValue(): Promise<SealedRevealResult | null> {
    const value = await this.client.get(REVEAL_KEY);
    return isSealed(value) ? value : null;
  }

  async getStatus(): Promise<RevealStatus> {
    const configured = (await this.getSealedValue()) !== null;
    return { configured, locked: configured };
  }

  /**
   * Atomic "first write wins" lock via SET-if-not-exists. Returns false
   * (without changing anything) if a value was already locked in.
   */
  async setIfAbsent(value: SealedRevealResult): Promise<boolean> {
    const result = await this.client.set(REVEAL_KEY, value, { nx: true });
    return result !== null && result !== undefined && result !== false;
  }

  async reset(): Promise<void> {
    await this.client.del(REVEAL_KEY);
  }

  async recordPinFailure(id: string, windowSeconds: number): Promise<number> {
    const key = `reveal:pinfail:${id}`;
    const count = await this.client.incr(key);
    if (count === 1) await this.client.expire(key, windowSeconds);
    return count;
  }

  async getPinFailureCount(id: string): Promise<number> {
    const value = await this.client.get(`reveal:pinfail:${id}`);
    if (typeof value === "number") return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  async getPinFailureRetrySeconds(id: string): Promise<number> {
    const ttl = await this.client.ttl(`reveal:pinfail:${id}`);
    return ttl > 0 ? ttl : 0;
  }

  async clearPinFailures(id: string): Promise<void> {
    await this.client.del(`reveal:pinfail:${id}`);
  }
}
