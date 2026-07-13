import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getStore } from "../_lib/kv.js";
import { RATE_LIMIT, getClientId, issueAdminToken, isDefaultPin, verifyPin } from "../_lib/adminAuth.js";
import type { RevealStore } from "../_lib/store.js";

/** Rate limiting is a defense-in-depth layer on top of the PIN check, not
 * a prerequisite for it — if Redis is unreachable, the PIN itself (read
 * from ADMIN_PIN, no store needed) should still be checkable. */
function tryGetStore(): RevealStore | null {
  try {
    return getStore();
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const clientId = getClientId(req.headers, req.socket?.remoteAddress || "unknown");
  const store = tryGetStore();

  if (store) {
    try {
      const failCount = await store.getPinFailureCount(clientId);
      if (failCount >= RATE_LIMIT.maxAttempts) {
        const retryAfterSeconds = (await store.getPinFailureRetrySeconds(clientId)) || RATE_LIMIT.windowSeconds;
        res.status(429).json({
          ok: false,
          error: "Too many incorrect attempts. Please wait before trying again.",
          retryAfterSeconds,
        });
        return;
      }
    } catch {
      // If the rate-limit counters themselves are unreachable, don't block
      // legitimate access on that — fall through to the real PIN check.
    }
  }

  const pin = typeof req.body === "object" && req.body ? (req.body as { pin?: unknown }).pin : undefined;

  let valid: boolean;
  try {
    valid = verifyPin(pin);
  } catch {
    res.status(503).json({ ok: false, error: "Admin PIN is not configured on the server." });
    return;
  }

  if (!valid) {
    try {
      await store?.recordPinFailure(clientId, RATE_LIMIT.windowSeconds);
    } catch {
      // Non-fatal — the wrong PIN still gets rejected either way.
    }
    res.status(401).json({ ok: false, error: "Incorrect PIN." });
    return;
  }

  try {
    await store?.clearPinFailures(clientId);
  } catch {
    // Non-fatal.
  }

  res.status(200).json({ ok: true, token: issueAdminToken(), usingDefaultPin: isDefaultPin() });
}
