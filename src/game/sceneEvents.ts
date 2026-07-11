import Phaser from "phaser";
import type { PokemonId } from "../types/gameState";

export type InteractionKind = "npc" | "sign" | "pokemon" | "professor" | "final-gate";

export interface InteractionPayload {
  kind: InteractionKind;
  id: string;
  lines: string[];
  pokemonId?: PokemonId;
}

/**
 * Bridges the Phaser scene (imperative, canvas-based) and the React UI
 * (declarative overlays: dialogue box, minigames, HUD). Using Phaser's
 * own EventEmitter keeps this dependency-free and works fine without a
 * running game instance.
 */
class GameEventBridge extends Phaser.Events.EventEmitter {}

export const gameEvents = new GameEventBridge();

export const GameEvent = {
  SceneReady: "scene-ready",
  Interact: "interact",
  DialogueClosed: "dialogue-closed",
  StartMinigame: "start-minigame",
  ChallengeComplete: "challenge-complete",
  LockMovement: "lock-movement",
  UnlockMovement: "unlock-movement",
  RemoteMove: "remote-move",
  RemoteAction: "remote-action",
  FinalAreaUnlocked: "final-area-unlocked",
  EnterFinalGate: "enter-final-gate",
  BeginFinalSequence: "begin-final-sequence",
  Footstep: "footstep",
} as const;
