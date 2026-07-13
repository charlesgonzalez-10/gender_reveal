import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getStore } from "../_lib/kv";
import { verifyAdminToken } from "../_lib/adminAuth";

function bearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  if (!verifyAdminToken(bearerToken(req))) {
    res.status(401).json({ ok: false, error: "Admin session expired. Please re-enter the PIN." });
    return;
  }

  try {
    await getStore().reset();
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: "Reveal storage is not available yet." });
  }
}
