import { createDefaultProgress, type GameProgress } from "../types/gameState";
import { eventConfig } from "../config/eventConfig";

const PROGRESS_KEY = "grp_progress_v1";

function isStorageAvailable(): boolean {
  try {
    const test = "__grp_test__";
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function loadProgress(): GameProgress {
  if (!isStorageAvailable()) {
    return createDefaultProgress(eventConfig.defaultPlayerName);
  }
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return createDefaultProgress(eventConfig.defaultPlayerName);
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    const defaults = createDefaultProgress(eventConfig.defaultPlayerName);
    // Merge defensively in case of corrupted/partial saved data.
    return {
      ...defaults,
      ...parsed,
      trainerName:
        typeof parsed.trainerName === "string" && parsed.trainerName.trim().length > 0
          ? parsed.trainerName
          : defaults.trainerName,
      completedChallenges: Array.isArray(parsed.completedChallenges)
        ? parsed.completedChallenges
        : defaults.completedChallenges,
      collectedClues: Array.isArray(parsed.collectedClues) ? parsed.collectedClues : defaults.collectedClues,
    };
  } catch {
    // Corrupted saved progress — fall back to a clean default rather
    // than crashing the app.
    return createDefaultProgress(eventConfig.defaultPlayerName);
  }
}

export function saveProgress(progress: GameProgress): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable — silently no-op rather than crash.
  }
}

export function hasSavedProgress(): boolean {
  if (!isStorageAvailable()) return false;
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Partial<GameProgress>;
    return Boolean(parsed.hasStartedIntro);
  } catch {
    return false;
  }
}

/**
 * Resets normal game progress. This intentionally does NOT touch the
 * sealed reveal result — that lives in a separate storage key managed by
 * the reveal provider and can only be reset from the PIN-protected
 * /setup screen.
 */
export function resetProgress(): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // ignore
  }
}
