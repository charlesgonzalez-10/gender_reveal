import { beforeEach, describe, expect, it } from "vitest";
import { hasSavedProgress, loadProgress, resetProgress, saveProgress } from "./progressStore";
import { createDefaultProgress } from "../types/gameState";

describe("progressStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns sane defaults when nothing is saved", () => {
    const progress = loadProgress();
    expect(progress.completedChallenges).toEqual([]);
    expect(progress.collectedClues).toEqual([]);
    expect(progress.hasStartedIntro).toBe(false);
  });

  it("round-trips saved progress", () => {
    const progress = createDefaultProgress("Ash");
    progress.collectedClues = ["leaf", "flame"];
    progress.hasStartedIntro = true;
    saveProgress(progress);

    const loaded = loadProgress();
    expect(loaded.trainerName).toBe("Ash");
    expect(loaded.collectedClues).toEqual(["leaf", "flame"]);
    expect(loaded.hasStartedIntro).toBe(true);
  });

  it("falls back to defaults on corrupted saved progress instead of throwing", () => {
    window.localStorage.setItem("grp_progress_v1", "{not valid json");
    expect(() => loadProgress()).not.toThrow();
    const progress = loadProgress();
    expect(progress.collectedClues).toEqual([]);
  });

  it("hasSavedProgress reflects whether the intro has been started", () => {
    expect(hasSavedProgress()).toBe(false);
    const progress = createDefaultProgress("Ash");
    progress.hasStartedIntro = true;
    saveProgress(progress);
    expect(hasSavedProgress()).toBe(true);
  });

  it("resetting normal progress does not touch the sealed reveal key", () => {
    window.localStorage.setItem("grp_sealed_v1", "optionA");
    const progress = createDefaultProgress("Ash");
    progress.hasStartedIntro = true;
    saveProgress(progress);

    resetProgress();

    expect(window.localStorage.getItem("grp_progress_v1")).toBeNull();
    expect(window.localStorage.getItem("grp_sealed_v1")).toBe("optionA");
  });
});
