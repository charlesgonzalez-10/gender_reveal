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
  bulbasaur: ["A happy Bulbasaur is exploring the Flower Garden!", "Want to play a little memory game together?"],
  charmander: ["Charmander is warming up by Ember Camp's fire.", "It wants to see if you can match its timing!"],
  squirtle: ["You dip a toe in Crystal Pond and feel a splash!", "Squirtle pops up, grinning — care to copy its water dance?"],
  pikachu: ["Pikachu bounds over from Thunder Meadow, sparking with joy!", "It wants to race through a quick spark circuit with you!"],
};

const POKEMON_DONE: Record<PokemonId, string[]> = {
  bulbasaur: ["Bulbasaur waves happily from the flowers. Thanks for the Leaf Clue!"],
  charmander: ["Charmander's tail flame flickers warmly by the fire. You've got the Flame Clue!"],
  squirtle: ["Squirtle blows a friendly bubble from the pond. You've got the Water Clue!"],
  pikachu: ["Pikachu gives a happy spark-wave. You've got the Lightning Clue!"],
};

const PROFESSOR_INTRO = [
  "Welcome! A very special adventure is about to begin.",
  "Four friendly Pokémon are waiting around town: Bulbasaur in the Flower Garden, Charmander at Ember Camp, Squirtle in Crystal Pond, and Pikachu in Thunder Meadow.",
  "Say hello to each of them — they'll share a clue with you.",
  "Bring all four clues back here, and the Ancient Temple will awaken!",
];

const PROFESSOR_ALL_CLUES_FOUND = [
  "You found all four clues! Wonderful work!",
  "The Ancient Temple has awoken — head to its gate to see what's inside!",
];

function professorReminder(cluesCollected: number): string[] {
  return [
    `You've gathered ${cluesCollected} of 4 clues so far — the board is looking brighter already!`,
    "Bulbasaur, Charmander, Squirtle, and Pikachu are waiting around town whenever you're ready.",
  ];
}

const NPC_LINES: Record<string, string[]> = {
  npcTownsfolk: ["What a lovely day for an adventure!"],
  npcGardener: ["The four clues will lead you somewhere wonderful."],
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
  private treeTiles: Phaser.GameObjects.Image[] = [];
  private swayTiles: Phaser.GameObjects.Image[] = [];
  private pokemonEntities: PokemonEntity[] = [];
  private clueBoardPips: Phaser.GameObjects.Arc[] = [];
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
        this.liveGrid[row][col] = "gateopen";
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
    this.setupAmbientLife();

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
        if (tile === "tree") this.treeTiles.push(img);
        if (tile === "flower" || tile === "tallgrass" || tile === "meadow") this.swayTiles.push(img);
        spriteRow.push(img);
      }
      this.tileSprites.push(spriteRow);
    }
  }

  private buildDecorations() {
    this.add.image(spawnPoints.professor.x, spawnPoints.professor.y, "professor").setOrigin(0.5, 0.85).setDepth(5);
    this.add.image(spawnPoints.npcTownsfolk.x, spawnPoints.npcTownsfolk.y, "npc-townsfolk").setOrigin(0.5, 0.85).setDepth(5);
    this.add.image(spawnPoints.npcGardener.x, spawnPoints.npcGardener.y, "npc-gardener").setOrigin(0.5, 0.85).setDepth(5);
    this.buildClueBoard();

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
      this.addPokemonIdleAnimation(id, sprite);
    }

    // A small campfire glow beside Charmander so Ember Camp reads warm even
    // before the player arrives.
    const charmanderPos = spawnPoints.charmander;
    const glow = this.add.image(charmanderPos.x + 14, charmanderPos.y + 4, "fx-glow").setDepth(4).setAlpha(0.75);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.55, to: 0.95 },
      scale: { from: 0.85, to: 1.15 },
      duration: 650,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** A little corkboard beside the Professor with one pip per clue — the
   * emotional center of the return trip after each challenge. Drawn with
   * plain Graphics circles rather than a new procedural texture since it
   * needs to redraw per-clue-collected anyway. */
  private buildClueBoard() {
    const boardX = spawnPoints.professor.x - 20;
    const boardY = spawnPoints.professor.y - 10;
    this.add.rectangle(boardX, boardY, 26, 12, 0x6b4a2c).setStrokeStyle(1, 0x3a2a1a).setDepth(4);
    const clueOrder: PokemonId[] = ["bulbasaur", "charmander", "squirtle", "pikachu"];
    this.clueBoardPips = clueOrder.map((id, i) => {
      const pipX = boardX - 9 + i * 6;
      const filled = this.completedChallenges.has(id);
      return this.add
        .circle(pipX, boardY, 2, filled ? 0xffd54f : 0x2c2c3a, filled ? 1 : 0.6)
        .setStrokeStyle(1, 0x1a1130)
        .setDepth(5);
    });
  }

  private refreshClueBoard() {
    const clueOrder: PokemonId[] = ["bulbasaur", "charmander", "squirtle", "pikachu"];
    clueOrder.forEach((id, i) => {
      const pip = this.clueBoardPips[i];
      if (!pip) return;
      const filled = this.completedChallenges.has(id);
      pip.setFillStyle(filled ? 0xffd54f : 0x2c2c3a, filled ? 1 : 0.6);
      if (filled) {
        this.tweens.add({ targets: pip, scale: { from: 1.8, to: 1 }, duration: 350, ease: "Back.easeOut" });
      }
    });
  }

  /** Gives each Pokémon a small looping idle motion so the world feels
   * alive even before the player walks over — purely cosmetic tweens on
   * top of the existing static sprites, no new textures needed per-frame. */
  private addPokemonIdleAnimation(id: PokemonId, sprite: Phaser.GameObjects.Image) {
    const baseY = sprite.y;
    if (id === "bulbasaur") {
      // Wanders a few pixels side to side among the flowers.
      this.tweens.add({
        targets: sprite,
        x: sprite.x + 10,
        duration: 2200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({
        targets: sprite,
        y: baseY - 1.5,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (id === "squirtle") {
      // Bobs gently as if floating in the pond.
      this.tweens.add({
        targets: sprite,
        y: baseY - 3,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (id === "charmander") {
      // A subtle flicker, like warming itself by the fire.
      this.tweens.add({
        targets: sprite,
        scaleX: 1.04,
        scaleY: 0.97,
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    } else if (id === "pikachu") {
      // A cheerful little hop on a loop, with a pause in between.
      this.tweens.add({
        targets: sprite,
        y: baseY - 6,
        duration: 260,
        yoyo: true,
        repeat: -1,
        repeatDelay: 1400,
        ease: "Quad.easeOut",
      });
    }
  }

  /** Environmental life that has nothing to do with gameplay state: swaying
   * trees/flowers, drifting butterflies and leaves, and rising chimney
   * smoke above the lab. Everything here is a Phaser tween on top of the
   * existing procedurally-generated tiles, cleaned up automatically when
   * the scene shuts down. */
  private setupAmbientLife() {
    for (const tree of this.treeTiles) {
      this.tweens.add({
        targets: tree,
        angle: { from: -1.5, to: 1.5 },
        duration: 2200 + Math.random() * 1000,
        delay: Math.random() * 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    for (const sway of this.swayTiles) {
      this.tweens.add({
        targets: sway,
        scaleX: { from: 0.94, to: 1.06 },
        duration: 1400 + Math.random() * 800,
        delay: Math.random() * 800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    this.spawnButterflies();
    this.spawnLeaves();
    this.spawnChimneySmoke();
    this.spawnMeadowSparks();
  }

  private spawnButterflies() {
    // A couple of butterflies looping lazily over the Flower Garden zone.
    const garden = { x: 22 * TILE_SIZE, y: 2 * TILE_SIZE, w: 8 * TILE_SIZE, h: 7 * TILE_SIZE };
    const keys = ["fx-butterfly-a", "fx-butterfly-b"];
    for (let i = 0; i < 2; i++) {
      const startX = garden.x + garden.w * (0.3 + i * 0.3);
      const startY = garden.y + garden.h * 0.5;
      const butterfly = this.add.image(startX, startY, keys[i % keys.length]).setDepth(7);
      const radius = 14 + i * 6;
      const duration = 3400 + i * 900;
      const orbit = { t: 0 };
      this.tweens.add({
        targets: orbit,
        t: Math.PI * 2,
        duration,
        repeat: -1,
        ease: "Linear",
        onUpdate: () => {
          butterfly.x = startX + Math.cos(orbit.t) * radius;
          butterfly.y = startY + Math.sin(orbit.t * 2) * (radius * 0.5);
        },
      });
    }
  }

  private spawnLeaves() {
    // Occasional leaves drifting down near the garden's tall grass.
    this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        const x = 22 * TILE_SIZE + Math.random() * 8 * TILE_SIZE;
        const y = 2 * TILE_SIZE;
        const leaf = this.add.image(x, y, "fx-leaf").setDepth(7).setAlpha(0.85);
        this.tweens.add({
          targets: leaf,
          y: y + 5 * TILE_SIZE,
          x: x + (Math.random() * 20 - 10),
          angle: 360,
          alpha: 0,
          duration: 4200,
          ease: "Sine.easeIn",
          onComplete: () => leaf.destroy(),
        });
      },
    });
  }

  private spawnChimneySmoke() {
    // Slow rising smoke puffs above the professor's lab roof.
    const chimneyX = 5 * TILE_SIZE;
    const chimneyY = 2 * TILE_SIZE;
    this.time.addEvent({
      delay: 1400,
      loop: true,
      callback: () => {
        const puff = this.add.image(chimneyX, chimneyY, "fx-smoke").setDepth(7).setAlpha(0.5).setScale(0.6);
        this.tweens.add({
          targets: puff,
          y: chimneyY - 22,
          x: chimneyX + (Math.random() * 10 - 5),
          alpha: 0,
          scale: 1.3,
          duration: 2600,
          ease: "Sine.easeOut",
          onComplete: () => puff.destroy(),
        });
      },
    });
  }

  private spawnMeadowSparks() {
    // Little spark motes drifting up out of Thunder Meadow's grass.
    const meadow = { x: 14 * TILE_SIZE, y: 17 * TILE_SIZE, w: 7 * TILE_SIZE, h: 5 * TILE_SIZE };
    this.time.addEvent({
      delay: 900,
      loop: true,
      callback: () => {
        const x = meadow.x + Math.random() * meadow.w;
        const y = meadow.y + meadow.h * 0.6 + Math.random() * meadow.h * 0.4;
        const spark = this.add.image(x, y, "fx-sparkle").setDepth(7).setAlpha(0.9).setScale(0.8 + Math.random() * 0.5);
        this.tweens.add({
          targets: spark,
          y: y - 10 - Math.random() * 6,
          alpha: 0,
          angle: Math.random() * 180,
          duration: 900,
          ease: "Sine.easeOut",
          onComplete: () => spark.destroy(),
        });
      },
    });
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
    this.refreshClueBoard();
    if (this.cluesCollected >= 4 && !this.finalUnlocked) {
      this.unlockFinalArea();
    }
  }

  private unlockFinalArea() {
    this.finalUnlocked = true;
    this.forEachGateTile((col, row) => {
      this.liveGrid[row][col] = "gateopen";
      this.tileSprites[row][col].setTexture(tileTextureKey("gateopen"));
    });
    // "The ground trembles" — a brief camera shake for the Ancient Temple's
    // big story beat.
    this.cameras.main.shake(500, 0.004);
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
        lines = professorReminder(this.cluesCollected);
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
          lines: [
            `The Ancient Temple is still sealed. Clues gathered: ${this.cluesCollected} / 4.`,
            "Visit the four Pokémon around town to gather the rest!",
          ],
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
