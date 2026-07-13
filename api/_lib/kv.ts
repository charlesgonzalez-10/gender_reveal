import { Redis } from "@upstash/redis";
import { RevealStore } from "./store.js";

/**
 * Supports both the historical Vercel KV env var names and the current
 * Upstash-branded ones, since Vercel Marketplace Redis integrations have
 * used both over time — whichever the connected integration injects,
 * this picks it up with no code changes required.
 */
function readConnectionEnv(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

let store: RevealStore | null = null;

/**
 * Throws a descriptive error (turned into a 503 by callers) if no Redis
 * integration has been connected yet, rather than crashing with an opaque
 * network error from inside the client library.
 */
export function getStore(): RevealStore {
  if (store) return store;
  const conn = readConnectionEnv();
  if (!conn) {
    throw new Error(
      "Reveal storage is not configured: connect a Redis (KV) integration to this Vercel project.",
    );
  }
  const redis = new Redis({ url: conn.url, token: conn.token });
  store = new RevealStore(redis);
  return store;
}
