import type { RevealProvider, SealedRevealResult } from "../types/reveal";

/**
 * DOCUMENTED PLACEHOLDER — not wired up, not exported from providers/index.
 *
 * This shows the shape a server-backed RevealProvider could take once
 * you're ready to move off browser storage. Swapping providers requires
 * no changes anywhere else in the app — every consumer talks to the
 * `RevealProvider` interface, not to a concrete class.
 *
 * Suggested backends:
 *
 * 1. Supabase
 *    - Create a single-row table `reveal_state (id, sealed_value, locked_at)`.
 *    - Use a Postgres row-level-security policy so only an authenticated
 *      "admin" role (checked against a server-side secret, not the
 *      client-side PIN) can write.
 *    - saveReveal() -> supabase.from('reveal_state').upsert(...)
 *    - getReveal() -> supabase.from('reveal_state').select().single()
 *
 * 2. Firebase (Firestore)
 *    - Store the sealed value in a single document, e.g.
 *      reveal/state -> { sealedValue: "optionA" | "optionB" }.
 *    - Lock writes down with Firestore security rules keyed off a custom
 *      auth claim set by a trusted admin, not the client PIN.
 *
 * 3. Vercel serverless functions
 *    - POST /api/reveal (protected by a server-only secret header) writes
 *      to a small KV store (e.g. Vercel KV / Upstash Redis).
 *    - GET /api/reveal returns only hasRevealBeenSet()-shaped data to the
 *      public game, and the sealed token to the setup screen only after
 *      re-verifying the admin PIN server-side.
 *
 * 4. Netlify functions
 *    - Same shape as Vercel: a Netlify Function backed by Netlify Blobs
 *      or FaunaDB, with the admin PIN verified server-side instead of in
 *      client JS.
 *
 * In all cases: keep the PIN check on the server for real security. The
 * current client-side PIN (see providers/adminAuth.ts) is only
 * appropriate for a private, low-stakes family event.
 */
export class ServerRevealProvider implements RevealProvider {
  private readonly apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  async hasRevealBeenSet(): Promise<boolean> {
    const res = await fetch(`${this.apiBaseUrl}/reveal/status`);
    if (!res.ok) return false;
    const data = (await res.json()) as { isSet: boolean };
    return data.isSet;
  }

  async saveReveal(result: SealedRevealResult): Promise<void> {
    const res = await fetch(`${this.apiBaseUrl}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sealedValue: result }),
    });
    if (!res.ok) throw new Error("Unable to save the reveal.");
  }

  async getReveal(): Promise<SealedRevealResult | null> {
    const res = await fetch(`${this.apiBaseUrl}/reveal`);
    if (!res.ok) return null;
    const data = (await res.json()) as { sealedValue: SealedRevealResult | null };
    return data.sealedValue;
  }

  async resetReveal(): Promise<void> {
    const res = await fetch(`${this.apiBaseUrl}/reveal`, { method: "DELETE" });
    if (!res.ok) throw new Error("Unable to reset the reveal.");
  }
}
