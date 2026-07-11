import { describe, expect, it } from "vitest";
import { describeReveal, sealedTokenFor } from "./revealMapping";

describe("revealMapping", () => {
  it("maps optionA to boy and optionB to girl", () => {
    expect(describeReveal("optionA")).toBe("boy");
    expect(describeReveal("optionB")).toBe("girl");
  });

  it("round-trips word -> token -> word", () => {
    expect(describeReveal(sealedTokenFor("boy"))).toBe("boy");
    expect(describeReveal(sealedTokenFor("girl"))).toBe("girl");
  });
});
