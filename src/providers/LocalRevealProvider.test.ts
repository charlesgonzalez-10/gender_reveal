import { beforeEach, describe, expect, it } from "vitest";
import { LocalRevealProvider } from "./LocalRevealProvider";

describe("LocalRevealProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reports unset when nothing has been saved", async () => {
    const provider = new LocalRevealProvider();
    expect(await provider.hasRevealBeenSet()).toBe(false);
    expect(await provider.getReveal()).toBeNull();
  });

  it("saves and retrieves only the neutral encoded token", async () => {
    const provider = new LocalRevealProvider();
    await provider.saveReveal("optionB");

    expect(await provider.hasRevealBeenSet()).toBe(true);
    expect(await provider.getReveal()).toBe("optionB");

    // The raw stored value must never be the plaintext word.
    const rawValues = Object.values(window.localStorage).concat(
      Object.keys(window.localStorage).map((k) => window.localStorage.getItem(k) ?? ""),
    );
    for (const raw of rawValues) {
      expect(raw.toLowerCase()).not.toMatch(/\bboy\b/);
      expect(raw.toLowerCase()).not.toMatch(/\bgirl\b/);
    }
  });

  it("resets cleanly back to unset", async () => {
    const provider = new LocalRevealProvider();
    await provider.saveReveal("optionA");
    expect(await provider.hasRevealBeenSet()).toBe(true);

    await provider.resetReveal();
    expect(await provider.hasRevealBeenSet()).toBe(false);
    expect(await provider.getReveal()).toBeNull();
  });

  it("treats corrupted storage values as unset rather than throwing", async () => {
    window.localStorage.setItem("grp_sealed_v1", "not-a-valid-token");
    const provider = new LocalRevealProvider();
    expect(await provider.hasRevealBeenSet()).toBe(false);
    expect(await provider.getReveal()).toBeNull();
  });
});
