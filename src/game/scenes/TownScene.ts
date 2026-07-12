import Phaser from "phaser";
import {
  MAP_COLS,
  MAP_ROWS,
  TILE_SIZE,
  spawnPoints,
  townTileGrid,
  worldHeight,
  worldWidth,
  type TileType,
} from "../maps/townMap";
import { tileTextureKey } from "../systems/textures";
import { Player } from "../entities/Player";
import { gameEvents, GameEvent, type InteractionPayload } from "../sceneEvents";
import type { GameProgress, PokemonId } from "../../types/gameState";

interface PokemonEntity {
  id: PokemonId;
  sprite: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  x: number;
  y: number;
}

const POKEMON_GREETING: Record<PokemonId, string[]> = {
  bulbasaur: ["A wild Bulbasaur is resting in the garden.", "It seems to be guarding something... a memory challenge!"],
  charmander: ["Charmander flickers its tail flame at you.", "It wants to test your timing!"],
  squirtle: ["You cast a line into the pond and feel a tug!", "You reel in a Squirtle — it challenges you to repeat its water pattern!"],
  pikachu: ["Pikachu's cheeks spark with electricity!", "It wants to see your reflexes in a quick circuit challenge!"],
};

const POKEMON_DONE: Record<PokemonId, string[]> = {
  bulbasaur: ["Bulbasaur waves happily. You already have the Leaf Clue!"],
  charmander: ["Charmander's tail flame flickers warmly. You already have the Flame Clue!"],
  squirtle: ["You cast a line into the pond, but Squirtle just blows a bubble. You already have the Water Clue!"],
  pikachu: ["Pikachu gives a friendly spark-wave. You already have the Lightning Clue!"],
};

const PROFESSOR_INTRO = [
  "Welcome! A very special adventure is about to begin.",
  "Four Pokémon are guarding clues to our greatest mystery yet.",
  "Find Bulbasaur, Charmander, Squirtle, and Pikachu.",
  "Complete their challenges and collect all four clues.",
  "When the clues are gathered, the final secret will be revealed!",
];

const PROFESSOR_REMINDER = ["Find Bulbasaur, Charmander, Squirtle, and Pikachu!", "Their challenges are scattered around town."];

const PROFESSOR_ALL_CLUES_FOUND = [
  "You found all four clues! Incredible work, trainer!",
  "The sealed path has opened. Head to the gate to reveal the secret!",
];

const NPC_LINES: Record<string, string[]> = {
  npcTownsfolk: ["Today feels like the start of a great adventure!"],
  npcGardener: ["The four clues will lead you to a wonderful surprise."],
};

const SIGN_LINES: Record<string, string[]> = {
  signPlaza: ["Every great trainer begins with one small step."],
  signClearing: ["Something exciting is waiting at the end of the path!"],
};

export interface TownSceneInitData {
  progress: GameProgress;
}

export class TownScene extends Phaser.Scene {
  private player!: Player;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private liveGrid: TileType[][] = [];
  private tileSprites: Phaser.GameObjects.Image[][] = [];
  private waterTiles: Phaser.GameObjects.Image[] = [];
  private waterFrame: 0 | 1 = 0;
  private waterTimer = 0;
  private pokemonEntities: PokemonEntity[] = [];
  private completedChallenges = new Set<PokemonId>();
  private cluesCollected = 0;
  private finalUnlocked = false;
  private hasStartedIntro = false;
  private remoteInput = { up: false, down: false, left: false, right: false };
  private dialogueOpen = false;

  constructor() {
    super("Town");
  }

  init(data: TownSceneInitData) {
    this.completedChallenges = new Set(data.progress.completedChallenges);
    this.cluesCollected = data.progress.collectedClues.length;
    this.finalUnlocked = this.cluesCollected >= 4;
    this.hasStartedIntro = data.progress.hasStartedIntro;
    this.liveGrid = townTileGrid.map((row) => [...row]);
    if (this.finalUnlocked) {
      this.forEachGateTile((col, row) => {
        this.liveGrid[row][col] = "finalfloor";
      });
    }
  }

  private forEachGateTile(fn: (col: number, row: number) => void) {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (townTileGrid[row][col] === "gate") fn(col, row);
      }
    }
  }

  create(data: TownSceneInitData) {
    this.cameras.main.setBackgroundColor("#3f9a4a");
    this.buildTileLayer();
    this.buildDecorations();

    const startPos = data.progress.playerPosition ?? spawnPoints.player;
    this.player = new Player(this, startPos.x, startPos.y, (px, py) => this.tileAt(px, py));

    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.cameras.main.setZoom(1);

    this.setupInput();
    this.setupEvents();

    gameEvents.emit(GameEvent.SceneReady);

    if (!this.hasStartedIntro) {
      this.time.delayedCall(400, () => {
        this.emitInteraction({ kind: "professor", id: "professor", lines: PROFESSOR_INTRO });
      });
    }
  }

  private buildTileLayer() {
    this.tileSprites = [];
    for (let row = 0; row < MAP_ROWS; row++) {
      const spriteRow: Phaser.GameObjects.Image[] = [];
      for (let col = 0; col < MAP_COLS; col++) {
        const tile = this.liveGrid[row][col];
        const img = this.add.image(col * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2, tileTextureKey(tile));
        img.setDepth(0);
        if (tile === "water") this.waterTiles.push(img);
        spriteRow.push(img);
      }
      this.tileSprites.push(spriteRow);
    }
  }

  private buildDecorations() {
    this.add.image(spawnPoints.professor.x, spawnPoints.professor.y, "professor").setOrigin(0.5, 0.85).setDepth(5);
    this.add.image(spawnPoints.npcTownsfolk.x, spawnPoints.npcTownsfolk.y, "npc-townsfolk").setOrigin(0.5, 0.85).setDepth(5);
    this.add.image(spawnPoints.npcGardener.x, spawnPoints.npcGardener.y, "npc-gardener").setOrigin(0.5, 0.85).setDepth(5);

    const ids: PokemonId[] = ["bulbasaur", "charmander", "squirtle", "pikachu"];
    for (const id of ids) {
      const pos = spawnPoints[id];
      // Squirtle stays visible out in the pond; the actual interaction is
      // triggered from the shoreline "fishing spot" since the pond tiles
      // themselves are solid and unreachable.
      const interactPos = id === "squirtle" ? spawnPoints.squirtleFishingSpot : pos;
      const sprite = this.add.image(pos.x, pos.y, `pokemon-${id}`).setDepth(5);
      const label = this.add
        .text(pos.x, pos.y - 18, id.charAt(0).toUpperCase() + id.slice(1), {
          fontFamily: "monospace",
          fontSize: "8px",
          color: "#ffffff",
          backgroundColor: "#000000aa",
          padding: { x: 2, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(6);
      this.pokemonEntities.push({ id, sprite, label, x: interactPos.x, y: interactPos.y });
      if (this.completedChallenges.has(id)) {
        sprite.setAlpha(0.85);
      }
    }
  }

  private tileAt(px: number, py: number): TileType {
    const col = Math.floor(px / TILE_SIZE);
    const row = Math.floor(py / TILE_SIZE);
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return "tree";
    return this.liveGrid[row][col];
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,E,ENTER,SPACE") as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture([
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.W,
      Phaser.Input.Keyboard.KeyCodes.A,
      Phaser.Input.Keyboard.KeyCodes.S,
      Phaser.Input.Keyboard.KeyCodes.D,
      Phaser.Input.Keyboard.KeyCodes.E,
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    ]);
  }

  private setupEvents() {
    gameEvents.on(GameEvent.DialogueClosed, this.onDialogueClosed, this);
    gameEvents.on(GameEvent.ChallengeComplete, this.onChallengeComplete, this);
    gameEvents.on(GameEvent.RemoteMove, this.onRemoteMove, this);
    gameEvents.on(GameEvent.RemoteAction, this.tryInteract, this);
    gameEvents.on(GameEvent.LockMovement, this.lockPlayer, this);
    gameEvents.on(GameEvent.UnlockMovement, this.unlockPlayer, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameEvents.off(GameEvent.DialogueClosed, this.onDialogueClosed, this);
      gameEvents.off(GameEvent.ChallengeComplete, this.onChallengeComplete, this);
      gameEvents.off(GameEvent.RemoteMove, this.onRemoteMove, this);
      gameEvents.off(GameEvent.RemoteAction, this.tryInteract, this);
      gameEvents.off(GameEvent.LockMovement, this.lockPlayer, this);
      gameEvents.off(GameEvent.UnlockMovement, this.unlockPlayer, this);
    });
  }

  private lockPlayer() {
    this.player.locked = true;
    this.dialogueOpen = true;
  }

  private unlockPlayer() {
    this.player.locked = false;
    this.dialogueOpen = false;
  }

  private onRemoteMove(dir: { up: boolean; down: boolean; left: boolean; right: boolean }) {
    this.remoteInput = dir;
  }

  private onDialogueClosed(payload: InteractionPayload) {
    if (payload.kind === "professor") {
      // handled by React marking intro started
    }
  }

  private onChallengeComplete(pokemonId: PokemonId) {
    this.completedChallenges.add(pokemonId);
    this.cluesCollected += 1;
    const entity = this.pokemonEntities.find((p) => p.id === pokemonId);
    if (entity) entity.sprite.setAlpha(0.85);
    if (this.cluesCollected >= 4 && !this.finalUnlocked) {
      this.unlockFinalArea();
    }
  }

  private unlockFinalArea() {
    this.finalUnlocked = true;
    this.forEachGateTile((col, row) => {
      this.liveGrid[row][col] = "finalfloor";
      this.tileSprites[row][col].setTexture(tileTextureKey("finalfloor"));
    });
    gameEvents.emit(GameEvent.FinalAreaUnlocked);
  }

  private emitInteraction(payload: InteractionPayload) {
    this.lockPlayer();
    gameEvents.emit(GameEvent.Interact, payload);
  }

  private tryInteract() {
    if (this.dialogueOpen) return;
    const px = this.player.worldX;
    const py = this.player.worldY;
    const RANGE = 26;

    for (const entity of this.pokemonEntities) {
      if (Phaser.Math.Distance.Between(px, py, entity.x, entity.y) <= RANGE) {
        const done = this.completedChallenges.has(entity.id);
        this.emitInteraction({
          kind: "pokemon",
          id: entity.id,
          pokemonId: entity.id,
          lines: done ? POKEMON_DONE[entity.id] : POKEMON_GREETING[entity.id],
        });
        return;
      }
    }

    if (Phaser.Math.Distance.Between(px, py, spawnPoints.professor.x, spawnPoints.professor.y) <= RANGE) {
      let lines = PROFESSOR_INTRO;
      if (this.finalUnlocked) {
        lines = PROFESSOR_ALL_CLUES_FOUND;
      } else if (this.hasStartedIntro) {
        lines = PROFESSOR_REMINDER;
      }
      this.emitInteraction({ kind: "professor", id: "professor", lines });
      return;
    }

    if (Phaser.Math.Distance.Between(px, py, spawnPoints.npcTownsfolk.x, spawnPoints.npcTownsfolk.y) <= RANGE) {
      this.emitInteraction({ kind: "npc", id: "npcTownsfolk", lines: NPC_LINES.npcTownsfolk });
      return;
    }
    if (Phaser.Math.Distance.Between(px, py, spawnPoints.npcGardener.x, spawnPoints.npcGardener.y) <= RANGE) {
      this.emitInteraction({ kind: "npc", id: "npcGardener", lines: NPC_LINES.npcGardener });
      return;
    }
    if (Phaser.Math.Distance.Between(px, py, spawnPoints.signPlaza.x, spawnPoints.signPlaza.y) <= RANGE) {
      this.emitInteraction({ kind: "sign", id: "signPlaza", lines: SIGN_LINES.signPlaza });
      return;
    }
    if (Phaser.Math.Distance.Between(px, py, spawnPoints.signClearing.x, spawnPoints.signClearing.y) <= RANGE) {
      this.emitInteraction({ kind: "sign", id: "signClearing", lines: SIGN_LINES.signClearing });
      return;
    }
    if (Phaser.Math.Distance.Between(px, py, spawnPoints.finalGate.x, spawnPoints.finalGate.y) <= RANGE + 6) {
      if (this.finalUnlocked) {
        this.lockPlayer();
        gameEvents.emit(GameEvent.EnterFinalGate);
      } else {
        this.emitInteraction({
          kind: "final-gate",
          id: "finalGate",
          lines: [`This path is sealed. Clues: ${this.cluesCollected} / 4.`, "Find all four Pokémon clues first!"],
        });
      }
      return;
    }
  }

  update(_time: number, delta: number) {
    const kb = this.keys;
    const input = {
      up: this.cursors.up.isDown || kb.W.isDown || this.remoteInput.up,
      down: this.cursors.down.isDown || kb.S.isDown || this.remoteInput.down,
      left: this.cursors.left.isDown || kb.A.isDown || this.remoteInput.left,
      right: this.cursors.right.isDown || kb.D.isDown || this.remoteInput.right,
    };
    this.player.update(delta, input);

    if (Phaser.Input.Keyboard.JustDown(kb.E) || Phaser.Input.Keyboard.JustDown(kb.ENTER) || Phaser.Input.Keyboard.JustDown(kb.SPACE)) {
      this.tryInteract();
    }

    this.waterTimer += delta;
    if (this.waterTimer > 500) {
      this.waterTimer = 0;
      this.waterFrame = this.waterFrame === 0 ? 1 : 0;
      const tex = this.waterFrame === 0 ? tileTextureKey("water") : tileTextureKey("water", 1);
      this.waterTiles.forEach((t) => t.setTexture(tex));
    }
  }

  savePlayerPosition(): { x: number; y: number; direction: Player["direction"] } {
    return { x: this.player.worldX, y: this.player.worldY, direction: this.player.direction };
  }
}
