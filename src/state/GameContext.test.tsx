import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { GameProvider, useGame } from "./GameContext";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => <GameProvider>{children}</GameProvider>;

describe("GameContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("awards the correct clue for each completed challenge", () => {
    const { result } = renderHook(() => useGame(), { wrapper });

    let clue;
    act(() => {
      clue = result.current.completeChallenge("bulbasaur");
    });
    expect(clue).toBe("leaf");
    expect(result.current.progress.collectedClues).toContain("leaf");
    expect(result.current.isChallengeComplete("bulbasaur")).toBe(true);
  });

  it("does not duplicate a clue if a challenge is completed twice", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    act(() => {
      result.current.completeChallenge("pikachu");
    });
    act(() => {
      result.current.completeChallenge("pikachu");
    });
    expect(result.current.progress.collectedClues.filter((c) => c === "lightning")).toHaveLength(1);
  });

  it("reports allCluesCollected only once all four are gathered", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    expect(result.current.allCluesCollected).toBe(false);

    act(() => {
      result.current.completeChallenge("bulbasaur");
      result.current.completeChallenge("charmander");
      result.current.completeChallenge("squirtle");
    });
    expect(result.current.allCluesCollected).toBe(false);

    act(() => {
      result.current.completeChallenge("pikachu");
    });
    expect(result.current.allCluesCollected).toBe(true);
  });

  it("resetProgress clears clues and challenges", () => {
    const { result } = renderHook(() => useGame(), { wrapper });
    act(() => {
      result.current.completeChallenge("squirtle");
    });
    expect(result.current.progress.collectedClues.length).toBe(1);

    act(() => {
      result.current.resetProgress();
    });
    expect(result.current.progress.collectedClues).toEqual([]);
    expect(result.current.progress.completedChallenges).toEqual([]);
  });
});
