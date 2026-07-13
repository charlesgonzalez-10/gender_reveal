import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getStore } from "../_lib/kv";

/**
 * Public. Never exposes the sealed reveal value — only whether one has
 * been configured/locked. See /api/reveal/value for the actual value,
 * which the client only calls at the moment the final reveal triggers.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const status = await getStore().getStatus();
    res.status(200).json(status);
  } catch {
    res.status(503).json({ configured: false, locked: false, error: "Reveal storage is not available yet." });
  }
}
