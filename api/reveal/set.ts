import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getStore } from "../_lib/kv.js";
import { verifyAdminToken } from "../_lib/adminAuth.js";

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

  const value = typeof req.body === "object" && req.body ? (req.body as { value?: unknown }).value : undefined;
  if (value !== "optionA" && value !== "optionB") {
    res.status(400).json({ ok: false, error: "Invalid reveal value." });
    return;
  }

  try {
    const wasSet = await getStore().setIfAbsent(value);
    if (!wasSet) {
      res.status(409).json({ ok: false, error: "The reveal has already been locked." });
      return;
    }
    res.status(200).json({ ok: true });
  } catch {
    res.status(503).json({ ok: false, error: "Reveal storage is not available yet." });
  }
}
