import { describe, expect, it } from "vitest";
import { RevealStore, type KvClient } from "./store";

function createFakeKv(): KvClient & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  const expiries = new Map<string, number>();
  return {
    data,
    async get(key) {
      return data.has(key) ? data.get(key) : null;
    },
    async set(key, value, opts) {
      if (opts?.nx && data.has(key)) return null;
      data.set(key, value);
      return "OK";
    },
    async del(key) {
      data.delete(key);
      expiries.delete(key);
      return 1;
    },
    async incr(key) {
      const next = (Number(data.get(key)) || 0) + 1;
      data.set(key, next);
      return next;
    },
    async expire(key, seconds) {
      expiries.set(key, seconds);
      return 1;
    },
    async ttl(key) {
      return expiries.get(key) ?? -1;
    },
  };
}

describe("RevealStore", () => {
  it("reports not configured/locked when nothing has been set", async () => {
    const store = new RevealStore(createFakeKv());
    expect(await store.getSealedValue()).toBeNull();
    expect(await store.getStatus()).toEqual({ configured: false, locked: false });
  });

  it("locks atomically: first setIfAbsent wins, second is rejected", async () => {
    const store = new RevealStore(createFakeKv());
    expect(await store.setIfAbsent("optionA")).toBe(true);
    expect(await store.setIfAbsent("optionB")).toBe(false);
    expect(await store.getSealedValue()).toBe("optionA");
    expect(await store.getStatus()).toEqual({ configured: true, locked: true });
  });

  it("reset clears the sealed value so a new one can be set", async () => {
    const store = new RevealStore(createFakeKv());
    await store.setIfAbsent("optionA");
    await store.reset();
    expect(await store.getSealedValue()).toBeNull();
    expect(await store.setIfAbsent("optionB")).toBe(true);
    expect(await store.getSealedValue()).toBe("optionB");
  });

  it("ignores a corrupted/unexpected stored value rather than trusting it", async () => {
    const kv = createFakeKv();
    kv.data.set("reveal:sealedValue", "not-a-real-token");
    const store = new RevealStore(kv);
    expect(await store.getSealedValue()).toBeNull();
  });

  it("tracks PIN failure counts per id and resets on clear", async () => {
    const store = new RevealStore(createFakeKv());
    expect(await store.getPinFailureCount("1.2.3.4")).toBe(0);
    expect(await store.recordPinFailure("1.2.3.4", 60)).toBe(1);
    expect(await store.recordPinFailure("1.2.3.4", 60)).toBe(2);
    expect(await store.getPinFailureCount("1.2.3.4")).toBe(2);
    expect(await store.getPinFailureRetrySeconds("1.2.3.4")).toBe(60);
    await store.clearPinFailures("1.2.3.4");
    expect(await store.getPinFailureCount("1.2.3.4")).toBe(0);
  });

  it("keeps PIN failure counters independent per id", async () => {
    const store = new RevealStore(createFakeKv());
    await store.recordPinFailure("device-a", 60);
    await store.recordPinFailure("device-a", 60);
    await store.recordPinFailure("device-b", 60);
    expect(await store.getPinFailureCount("device-a")).toBe(2);
    expect(await store.getPinFailureCount("device-b")).toBe(1);
  });
});
