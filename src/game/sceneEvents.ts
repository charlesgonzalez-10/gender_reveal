import type { PokemonId } from "../types/gameState";

export type InteractionKind = "npc" | "sign" | "pokemon" | "professor" | "final-gate";

export interface InteractionPayload {
  kind: InteractionKind;
  id: string;
  lines: string[];
  pokemonId?: PokemonId;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Listener = (...args: any[]) => void;

interface Subscription {
  listener: Listener;
  context: unknown;
}

/**
 * Bridges the Phaser scene (imperative, canvas-based) and the React UI
 * (declarative overlays: dialogue box, minigames, menus). Deliberately
 * dependency-free (not Phaser's own EventEmitter) — plain UI components
 * like DialogueBox and PauseMenu subscribe to GBC input events through
 * this bus too, and they must be importable in plain DOM environments
 * (including tests) without pulling in Phaser's canvas-dependent module
 * init at all. Supports an optional `context` argument (mirroring
 * Phaser's EventEmitter) so scene code can pass `this` and later remove
 * the same bound method with `off(event, method, this)`.
 */
class GameEventBridge {
  private subscriptions = new Map<string, Subscription[]>();

  on(event: string, listener: Listener, context?: unknown): this {
    const list = this.subscriptions.get(event) ?? [];
    list.push({ listener, context });
    this.subscriptions.set(event, list);
    return this;
  }

  off(event: string, listener: Listener, context?: unknown): this {
    const list = this.subscriptions.get(event);
    if (!list) return this;
    this.subscriptions.set(
      event,
      list.filter((sub) => !(sub.listener === listener && sub.context === context)),
    );
    return this;
  }

  emit(event: string, ...args: unknown[]): void {
    const list = this.subscriptions.get(event);
    if (!list) return;
    for (const { listener, context } of [...list]) listener.apply(context, args);
  }
}

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
  /**
   * Discrete GBC control-deck presses (D-pad/A/B/Start/Select), broadcast
   * once per press so any currently-mounted menu/overlay can move focus or
   * act on it. Distinct from RemoteMove/RemoteAction, which drive
   * continuous player movement and map interaction on the Phaser canvas.
   */
  GbcUp: "gbc-up",
  GbcDown: "gbc-down",
  GbcLeft: "gbc-left",
  GbcRight: "gbc-right",
  GbcConfirm: "gbc-confirm",
  GbcCancel: "gbc-cancel",
  GbcStart: "gbc-start",
  GbcSelect: "gbc-select",
} as const;
