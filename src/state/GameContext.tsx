import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { ClueId, GameProgress, PlayerPosition, PokemonId } from "../types/gameState";
import { POKEMON_CLUE } from "../types/gameState";
import { loadProgress, saveProgress, resetProgress as resetProgressStorage } from "./progressStore";

interface GameContextValue {
  progress: GameProgress;
  setTrainerName: (name: string) => void;
  markIntroStarted: () => void;
  markControlsTutorialSeen: () => void;
  completeChallenge: (pokemon: PokemonId) => ClueId;
  isChallengeComplete: (pokemon: PokemonId) => boolean;
  savePlayerPosition: (position: PlayerPosition) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setReducedMotion: (enabled: boolean) => void;
  markGameCompleted: () => void;
  resetProgress: () => void;
  allCluesCollected: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<GameProgress>(() => loadProgress());
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveProgress(progress);
  }, [progress]);

  const setTrainerName = useCallback((name: string) => {
    setProgress((p) => ({ ...p, trainerName: name.trim().length > 0 ? name.trim() : p.trainerName }));
  }, []);

  const markIntroStarted = useCallback(() => {
    setProgress((p) => (p.hasStartedIntro ? p : { ...p, hasStartedIntro: true }));
  }, []);

  const markControlsTutorialSeen = useCallback(() => {
    setProgress((p) => (p.hasSeenControlsTutorial ? p : { ...p, hasSeenControlsTutorial: true }));
  }, []);

  const isChallengeComplete = useCallback(
    (pokemon: PokemonId) => progress.completedChallenges.includes(pokemon),
    [progress.completedChallenges],
  );

  const completeChallenge = useCallback((pokemon: PokemonId): ClueId => {
    const clue = POKEMON_CLUE[pokemon];
    setProgress((p) => {
      if (p.completedChallenges.includes(pokemon)) return p;
      return {
        ...p,
        completedChallenges: [...p.completedChallenges, pokemon],
        collectedClues: p.collectedClues.includes(clue) ? p.collectedClues : [...p.collectedClues, clue],
      };
    });
    return clue;
  }, []);

  const savePlayerPosition = useCallback((position: PlayerPosition) => {
    setProgress((p) => ({ ...p, playerPosition: position }));
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setProgress((p) => ({ ...p, soundEnabled: enabled }));
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    setProgress((p) => ({ ...p, musicVolume: volume }));
  }, []);

  const setSfxVolume = useCallback((volume: number) => {
    setProgress((p) => ({ ...p, sfxVolume: volume }));
  }, []);

  const setReducedMotion = useCallback((enabled: boolean) => {
    setProgress((p) => ({ ...p, reducedMotion: enabled }));
  }, []);

  const markGameCompleted = useCallback(() => {
    setProgress((p) => (p.gameCompleted ? p : { ...p, gameCompleted: true }));
  }, []);

  const resetProgress = useCallback(() => {
    resetProgressStorage();
    setProgress(loadProgress());
  }, []);

  const allCluesCollected = progress.collectedClues.length >= 4;

  return (
    <GameContext.Provider
      value={{
        progress,
        setTrainerName,
        markIntroStarted,
        markControlsTutorialSeen,
        completeChallenge,
        isChallengeComplete,
        savePlayerPosition,
        setSoundEnabled,
        setMusicVolume,
        setSfxVolume,
        setReducedMotion,
        markGameCompleted,
        resetProgress,
        allCluesCollected,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
