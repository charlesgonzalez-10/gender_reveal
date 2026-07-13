import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getStore } from "../_lib/kv.js";

/**
 * Public, but only ever called by the client at the moment the final
 * reveal sequence actually begins — never from the public status check.
 * Still only returns the neutral optionA/optionB token; the boy/girl
 * mapping happens client-side in revealMapping.ts.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const sealedValue = await getStore().getSealedValue();
    res.status(200).json({ sealedValue });
  } catch {
    res.status(503).json({ sealedValue: null, error: "Reveal storage is not available yet." });
  }
}
