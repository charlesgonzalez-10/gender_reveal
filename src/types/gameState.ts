export type PokemonId = "bulbasaur" | "charmander" | "squirtle" | "pikachu";

export type ClueId = "leaf" | "flame" | "water" | "lightning";

export const POKEMON_CLUE: Record<PokemonId, ClueId> = {
  bulbasaur: "leaf",
  charmander: "flame",
  squirtle: "water",
  pikachu: "lightning",
};

export interface PlayerPosition {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
}

export interface GameProgress {
  trainerName: string;
  completedChallenges: PokemonId[];
  collectedClues: ClueId[];
  playerPosition: PlayerPosition | null;
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  reducedMotion: boolean;
  gameCompleted: boolean;
  hasStartedIntro: boolean;
}

export const DEFAULT_PLAYER_POSITION: PlayerPosition = {
  x: 320,
  y: 420,
  direction: "down",
};

export function createDefaultProgress(trainerName: string): GameProgress {
  return {
    trainerName,
    completedChallenges: [],
    collectedClues: [],
    playerPosition: null,
    soundEnabled: true,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    reducedMotion: false,
    gameCompleted: false,
    hasStartedIntro: false,
  };
}
