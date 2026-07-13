import Phaser from "phaser";
import { TILE_SIZE, type TileType } from "../maps/townMap";
import type { PokemonId } from "../../types/gameState";

/**
 * All visuals in this game are generated procedurally at runtime with
 * Phaser's Graphics API — original geometric "pixel art" placeholders,
 * not reproductions of any copyrighted artwork. Replace any of these
 * generator functions with real spritesheet loading later without
 * touching gameplay code (every consumer just references a texture key).
 */

function tileKey(t: TileType | "water2"): string {
  return `tile-${t}`;
}

function drawSpeckles(g: Phaser.GameObjects.Graphics, color: number, count: number, size: number) {
  g.fillStyle(color, 1);
  for (let i = 0; i < count; i++) {
    const x = Math.round(Math.random() * (TILE_SIZE - size));
    const y = Math.round(Math.random() * (TILE_SIZE - size));
    g.fillRect(x, y, size, size);
  }
}

function makeTileTexture(scene: Phaser.Scene, key: string, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, TILE_SIZE, TILE_SIZE);
  g.destroy();
}

export function generateTileTextures(scene: Phaser.Scene): void {
  makeTileTexture(scene, tileKey("grass"), (g) => {
    g.fillStyle(0x3f9a4a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    drawSpeckles(g, 0x357f3f, 5, 2);
  });
  makeTileTexture(scene, tileKey("path"), (g) => {
    g.fillStyle(0xd8c48f, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    drawSpeckles(g, 0xc4ac6f, 6, 2);
  });
  makeTileTexture(scene, tileKey("tallgrass"), (g) => {
    g.fillStyle(0x2f7a3d, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x3f9a4a, 1);
    for (let i = 2; i < TILE_SIZE; i += 4) {
      g.fillRect(i, 2, 2, 12);
    }
  });
  makeTileTexture(scene, tileKey("water"), (g) => {
    g.fillStyle(0x3a7bd5, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x5b9be8, 1);
    g.fillRect(0, 6, TILE_SIZE, 2);
  });
  makeTileTexture(scene, tileKey("water2"), (g) => {
    g.fillStyle(0x3a7bd5, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x5b9be8, 1);
    g.fillRect(0, 9, TILE_SIZE, 2);
  });
  makeTileTexture(scene, tileKey("sand"), (g) => {
    g.fillStyle(0xe4cf94, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    drawSpeckles(g, 0xd0b878, 5, 2);
  });
  makeTileTexture(scene, tileKey("tree"), (g) => {
    g.fillStyle(0x3f9a4a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x6b4a2c, 1);
    g.fillRect(6, 10, 4, 6);
    g.fillStyle(0x1f5c2c, 1);
    g.fillCircle(8, 7, 7);
    g.fillStyle(0x2b7538, 1);
    g.fillCircle(6, 5, 4);
  });
  makeTileTexture(scene, tileKey("rock"), (g) => {
    g.fillStyle(0x555b66, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x7c828e, 1);
    g.fillEllipse(8, 9, 12, 10);
    g.fillStyle(0x484d57, 1);
    g.fillEllipse(8, 12, 10, 5);
  });
  makeTileTexture(scene, tileKey("flower"), (g) => {
    g.fillStyle(0x3f9a4a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    const colors = [0xff6f91, 0xffd54f, 0xff8a3d];
    const c = colors[Math.floor(Math.random() * colors.length)];
    g.fillStyle(c, 1);
    g.fillCircle(8, 8, 3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(8, 8, 1);
  });
  makeTileTexture(scene, tileKey("fence"), (g) => {
    g.fillStyle(0x3f9a4a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x8a5a34, 1);
    g.fillRect(1, 2, 3, 12);
    g.fillRect(12, 2, 3, 12);
    g.fillRect(0, 5, TILE_SIZE, 2);
    g.fillRect(0, 10, TILE_SIZE, 2);
  });
  makeTileTexture(scene, tileKey("building"), (g) => {
    g.fillStyle(0x5b4a8a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x796aa8, 1);
    g.fillRect(1, 1, TILE_SIZE - 2, 5);
    g.fillStyle(0xdcd6f0, 1);
    g.fillRect(3, 8, 4, 4);
    g.fillRect(9, 8, 4, 4);
  });
  makeTileTexture(scene, tileKey("labfloor"), (g) => {
    g.fillStyle(0xe8e6f2, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0xd2cee6, 1);
    g.fillRect(0, 0, TILE_SIZE, 1);
    g.fillRect(0, TILE_SIZE - 1, TILE_SIZE, 1);
  });
  makeTileTexture(scene, tileKey("cavefloor"), (g) => {
    g.fillStyle(0x4a4038, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    drawSpeckles(g, 0x3a3129, 6, 2);
  });
  makeTileTexture(scene, tileKey("sign"), (g) => {
    g.fillStyle(0x3f9a4a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0x8a5a34, 1);
    g.fillRect(7, 8, 2, 8);
    g.fillStyle(0xc99a5b, 1);
    g.fillRect(2, 2, 12, 7);
    g.lineStyle(1, 0x6b4423, 1);
    g.strokeRect(2, 2, 12, 7);
  });
  makeTileTexture(scene, tileKey("gate"), (g) => {
    g.fillStyle(0x3f9a4a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0xd23c3c, 1);
    g.fillRect(2, 2, 12, 6);
    g.fillStyle(0xf4f4f4, 1);
    g.fillRect(2, 8, 12, 6);
    g.fillStyle(0x1a1a1a, 1);
    g.fillCircle(8, 8, 3);
    g.fillStyle(0xf4f4f4, 1);
    g.fillCircle(8, 8, 1.4);
  });
  makeTileTexture(scene, tileKey("gateopen"), (g) => {
    g.fillStyle(0x3f9a4a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0xffd54f, 0.35);
    g.fillCircle(8, 8, 7);
    g.fillStyle(0x4caf6d, 1);
    g.fillRect(1, 2, 3, 12);
    g.fillRect(12, 2, 3, 12);
    g.fillStyle(0xffd54f, 1);
    g.fillCircle(8, 8, 2.4);
  });
  makeTileTexture(scene, tileKey("finalfloor"), (g) => {
    g.fillStyle(0x2c2a4a, 1);
    g.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    g.fillStyle(0xffd54f, 0.5);
    g.fillCircle(4, 4, 1);
    g.fillCircle(12, 10, 1);
    g.fillCircle(9, 3, 1);
  });
}

export function tileTextureKey(t: TileType, frame = 0): string {
  if (t === "water" && frame === 1) return tileKey("water2");
  return tileKey(t);
}

const PLAYER_COLORS = {
  jacket: 0x3f8f6f,
  jacketShade: 0x2c6d52,
  jacketHighlight: 0x6fc19c,
  skin: 0xf0c090,
  skinShade: 0xdba873,
  cap: 0x2f5f8f,
  capBrim: 0x1f4569,
  capHighlight: 0x5686bf,
  hair: 0x3a2a1a,
  pants: 0x2c2c3a,
  shoes: 0x4a3423,
};

const HUMAN_CANVAS = { w: 20, h: 26 };

/** Shared "chibi" body plan used by the player, professor, and NPCs — a
 * rounded head, soft-shaded torso with stub arms, and a two-frame walk
 * cycle — so every character in town reads as part of the same original
 * cast rather than a mix of plain rectangles. */
function drawHumanBase(
  g: Phaser.GameObjects.Graphics,
  step: 0 | 1,
  colors: { top: number; topShade: number; topHighlight: number; skin: number; pants: number; shoes: number },
) {
  const cx = HUMAN_CANVAS.w / 2;
  const stride = step === 1 ? 1 : -1;

  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(cx, 24, 11, 3);

  g.fillStyle(colors.pants, 1);
  g.fillRoundedRect(cx - 5, 17, 4, 6 - stride, 1.5);
  g.fillRoundedRect(cx + 1, 17, 4, 6 + stride, 1.5);
  g.fillStyle(colors.shoes, 1);
  g.fillRoundedRect(cx - 5, 20 - stride, 4, 3, 1.5);
  g.fillRoundedRect(cx + 1, 20 + stride, 4, 3, 1.5);

  // stub arms peeking out from behind the torso
  g.fillStyle(colors.topShade, 1);
  g.fillRoundedRect(cx - 8, 10, 3, 7, 1.5);
  g.fillRoundedRect(cx + 5, 10, 3, 7, 1.5);

  // torso with a highlight and a shaded hem for a little dimensionality
  g.fillStyle(colors.top, 1);
  g.fillRoundedRect(cx - 6, 8, 12, 10, 4);
  g.fillStyle(colors.topHighlight, 1);
  g.fillRoundedRect(cx - 4, 9, 5, 3, 2);
  g.fillStyle(colors.topShade, 1);
  g.fillRoundedRect(cx - 6, 14, 12, 4, 3);

  // rounded head
  g.fillStyle(colors.skin, 1);
  g.fillCircle(cx, 6, 5.5);
  g.fillStyle(0xffffff, 0.2);
  g.fillEllipse(cx - 2, 4, 3.5, 2.5);

  return cx;
}

function drawFace(g: Phaser.GameObjects.Graphics, cx: number, dir: "down" | "up" | "left" | "right") {
  if (dir === "up") return;
  g.fillStyle(0x111111, 1);
  if (dir === "down") {
    g.fillCircle(cx - 2, 6, 1);
    g.fillCircle(cx + 2, 6, 1);
    g.fillStyle(0xc96a5a, 0.35);
    g.fillEllipse(cx - 3.5, 8, 1.6, 1);
    g.fillEllipse(cx + 3.5, 8, 1.6, 1);
  } else if (dir === "left") {
    g.fillCircle(cx - 2, 6, 1);
  } else {
    g.fillCircle(cx + 2, 6, 1);
  }
}

function drawCap(g: Phaser.GameObjects.Graphics, cx: number, dir: "down" | "up" | "left" | "right") {
  g.fillStyle(PLAYER_COLORS.hair, 1);
  g.fillRoundedRect(cx - 5.5, 2, 11, 5, 3);
  g.fillStyle(PLAYER_COLORS.cap, 1);
  g.fillRoundedRect(cx - 6, 0, 12, 5, 3);
  g.fillStyle(PLAYER_COLORS.capHighlight, 1);
  g.fillRoundedRect(cx - 4.5, 0.5, 4, 2, 1.5);
  g.fillStyle(PLAYER_COLORS.capBrim, 1);
  if (dir === "down") g.fillRoundedRect(cx - 6, 3.5, 12, 1.5, 1);
  else if (dir === "up") g.fillRoundedRect(cx - 6, 0, 12, 1.5, 1);
  else if (dir === "left") g.fillRoundedRect(cx - 7, 3.5, 6, 1.5, 1);
  else g.fillRoundedRect(cx + 1, 3.5, 6, 1.5, 1);
}

function drawPlayerFrame(g: Phaser.GameObjects.Graphics, dir: "down" | "up" | "left" | "right", step: 0 | 1) {
  g.clear();
  const cx = drawHumanBase(g, step, {
    top: PLAYER_COLORS.jacket,
    topShade: PLAYER_COLORS.jacketShade,
    topHighlight: PLAYER_COLORS.jacketHighlight,
    skin: PLAYER_COLORS.skin,
    pants: PLAYER_COLORS.pants,
    shoes: PLAYER_COLORS.shoes,
  });
  drawFace(g, cx, dir);
  drawCap(g, cx, dir);
}

export function generatePlayerTextures(scene: Phaser.Scene): void {
  const dirs: Array<"down" | "up" | "left" | "right"> = ["down", "up", "left", "right"];
  for (const dir of dirs) {
    for (const step of [0, 1] as const) {
      const key = `player-${dir}-${step}`;
      if (scene.textures.exists(key)) continue;
      const g = scene.add.graphics();
      drawPlayerFrame(g, dir, step);
      g.generateTexture(key, HUMAN_CANVAS.w, HUMAN_CANVAS.h);
      g.destroy();
    }
  }
}

export function generateProfessorTexture(scene: Phaser.Scene): void {
  const key = "professor";
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const cx = drawHumanBase(g, 0, {
    top: 0xf4f4f4,
    topShade: 0xd6d6de,
    topHighlight: 0xffffff,
    skin: 0xf0c090,
    pants: 0x555a66,
    shoes: 0x3a3a3a,
  });
  // simple grey side-swept hair instead of a cap
  g.fillStyle(0xc9c9d2, 1);
  g.fillRoundedRect(cx - 6, 1, 12, 4.5, 3);
  g.fillStyle(0xdfdfe6, 1);
  g.fillRoundedRect(cx - 5, 1.5, 4, 2, 1.5);
  drawFace(g, cx, "down");
  // small round glasses for an approachable "professor" read
  g.lineStyle(1, 0x2c2c3a, 0.85);
  g.strokeCircle(cx - 2, 6, 1.8);
  g.strokeCircle(cx + 2, 6, 1.8);
  g.lineBetween(cx - 0.2, 6, cx + 0.2, 6);
  g.generateTexture(key, HUMAN_CANVAS.w, HUMAN_CANVAS.h);
  g.destroy();
}

export function generateNpcTexture(scene: Phaser.Scene, key: string, shirtColor: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const shade = Phaser.Display.Color.ValueToColor(shirtColor).darken(20).color;
  const highlight = Phaser.Display.Color.ValueToColor(shirtColor).brighten(20).color;
  const cx = drawHumanBase(g, 0, {
    top: shirtColor,
    topShade: shade,
    topHighlight: highlight,
    skin: 0xf0c090,
    pants: 0x2c2c3a,
    shoes: 0x4a3423,
  });
  g.fillStyle(0x5a3a20, 1);
  g.fillRoundedRect(cx - 5.5, 1.5, 11, 4.5, 3);
  drawFace(g, cx, "down");
  if (key === "npc-gardener") {
    // a small sun hat instead of hair, to fit the garden setting
    g.fillStyle(0xe6c778, 1);
    g.fillEllipse(cx, 2.5, 15, 3.5);
    g.fillRoundedRect(cx - 5, 0, 10, 4, 3);
  }
  g.generateTexture(key, HUMAN_CANVAS.w, HUMAN_CANVAS.h);
  g.destroy();
}

const POKEMON_PALETTE: Record<PokemonId, { body: number; accent: number }> = {
  bulbasaur: { body: 0x5fb87a, accent: 0x2f7a49 },
  charmander: { body: 0xef8a52, accent: 0xc14f21 },
  squirtle: { body: 0x5bb8d6, accent: 0x276d85 },
  pikachu: { body: 0xf6d24c, accent: 0xc98a1c },
};

const POKEMON_CANVAS = { w: 42, h: 34 };

export function generatePokemonTexture(scene: Phaser.Scene, id: PokemonId): void {
  const key = `pokemon-${id}`;
  if (scene.textures.exists(key)) return;
  const { body, accent } = POKEMON_PALETTE[id];
  const g = scene.add.graphics();
  const cx = POKEMON_CANVAS.w / 2;
  const dy = 8; // headroom for ears/bulb/flame accessories above the body

  // soft ground shadow
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, 26 + dy - 6, 16, 4);

  // stub feet, planted slightly wider than the body for a friendly stance
  g.fillStyle(accent, 1);
  g.fillRoundedRect(cx - 9, 20 + dy - 6, 5, 5, 2);
  g.fillRoundedRect(cx + 4, 20 + dy - 6, 5, 5, 2);

  // cream belly patch drawn first so the body silhouette overlaps its edges
  g.fillStyle(0xfff2d6, 1);
  g.fillEllipse(cx, 17 + dy - 6, 9, 6);

  // rounded body silhouette
  g.fillStyle(body, 1);
  g.fillRoundedRect(cx - 11, dy, 22, 16, 8);

  // soft top-left highlight for a little dimensionality
  g.fillStyle(0xffffff, 0.22);
  g.fillEllipse(cx - 5, dy + 5, 8, 5);

  // big friendly eyes with a catch-light sparkle
  g.fillStyle(0x111111, 1);
  g.fillCircle(cx - 5, dy + 9, 2.1);
  g.fillCircle(cx + 5, dy + 9, 2.1);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - 5.6, dy + 8.3, 0.7);
  g.fillCircle(cx + 4.4, dy + 8.3, 0.7);

  // small blush marks (soft, not the bold circular cheek trademark look)
  g.fillStyle(accent, 0.35);
  g.fillEllipse(cx - 8, dy + 12, 2.6, 1.6);
  g.fillEllipse(cx + 8, dy + 12, 2.6, 1.6);

  g.fillStyle(accent, 1);
  g.fillRoundedRect(cx - 4, dy + 13, 8, 2, 1);

  if (id === "bulbasaur") {
    // a rounded bulb with a small leafy sprout, sitting on the back
    g.fillStyle(accent, 1);
    g.fillEllipse(cx, dy - 1, 11, 6);
    g.fillStyle(0x3f9c5f, 1);
    g.fillEllipse(cx - 2, dy - 4, 3, 3.5);
    g.fillEllipse(cx + 2, dy - 4, 3, 3.5);
  } else if (id === "charmander") {
    // a curved flame tail with a warm two-tone core
    g.fillStyle(0xffb84d, 1);
    g.beginPath();
    g.moveTo(cx + 10, dy + 10);
    g.lineTo(cx + 18, dy + 4);
    g.lineTo(cx + 15, dy - 2);
    g.lineTo(cx + 20, dy + 2);
    g.lineTo(cx + 14, dy + 12);
    g.closePath();
    g.fillPath();
    g.fillStyle(0xffe08a, 0.85);
    g.fillEllipse(cx + 16, dy + 3, 3.5, 4.5);
    // two small head bumps
    g.fillStyle(body, 1);
    g.fillCircle(cx - 6, dy, 2.4);
    g.fillCircle(cx + 6, dy, 2.4);
  } else if (id === "squirtle") {
    // a domed shell on the back with soft panel lines
    g.fillStyle(accent, 1);
    g.fillEllipse(cx, dy - 1, 13, 5.5);
    g.lineStyle(1, 0x1a4a58, 0.6);
    g.beginPath();
    g.moveTo(cx - 4, dy - 3);
    g.lineTo(cx - 4, dy + 1);
    g.moveTo(cx + 4, dy - 3);
    g.lineTo(cx + 4, dy + 1);
    g.strokePath();
  } else if (id === "pikachu") {
    // short, rounded ears (deliberately not the long pointed silhouette)
    // with dark tips, and a small curved tail — original proportions
    g.fillStyle(body, 1);
    g.fillRoundedRect(cx - 9, dy - 7, 5, 9, 2.5);
    g.fillRoundedRect(cx + 4, dy - 7, 5, 9, 2.5);
    g.fillStyle(accent, 1);
    g.fillRoundedRect(cx - 9, dy - 7, 5, 3, 2);
    g.fillRoundedRect(cx + 4, dy - 7, 5, 3, 2);
    g.fillStyle(body, 1);
    g.beginPath();
    g.moveTo(cx + 11, dy + 8);
    g.lineTo(cx + 17, dy + 4);
    g.lineTo(cx + 15, dy + 12);
    g.closePath();
    g.fillPath();
  }

  g.generateTexture(key, POKEMON_CANVAS.w, POKEMON_CANVAS.h);
  g.destroy();
}

/** Small decorative effect sprites used purely for ambience (butterflies,
 * drifting leaves, campfire glow, chimney smoke) — none of these affect
 * gameplay, so they're kept intentionally tiny and simple. */
export function generateAmbientTextures(scene: Phaser.Scene): void {
  const butterflyColors: [string, number][] = [
    ["fx-butterfly-a", 0xff9fd0],
    ["fx-butterfly-b", 0xffe08a],
  ];
  for (const [key, color] of butterflyColors) {
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    g.fillStyle(color, 0.9);
    g.fillEllipse(2, 4, 3, 4);
    g.fillEllipse(6, 4, 3, 4);
    g.fillStyle(0x2c2c3a, 0.8);
    g.fillRect(3.5, 2, 1, 6);
    g.generateTexture(key, 8, 8);
    g.destroy();
  }

  if (!scene.textures.exists("fx-leaf")) {
    const g = scene.add.graphics();
    g.fillStyle(0x6fbf7a, 0.85);
    g.fillEllipse(3, 3, 4, 3);
    g.generateTexture("fx-leaf", 6, 6);
    g.destroy();
  }

  if (!scene.textures.exists("fx-smoke")) {
    const g = scene.add.graphics();
    g.fillStyle(0xd8d8e0, 0.55);
    g.fillCircle(4, 4, 4);
    g.generateTexture("fx-smoke", 8, 8);
    g.destroy();
  }

  if (!scene.textures.exists("fx-glow")) {
    const g = scene.add.graphics();
    g.fillStyle(0xffb84d, 0.9);
    g.fillCircle(5, 5, 3);
    g.fillStyle(0xffe08a, 0.9);
    g.fillCircle(5, 4, 1.6);
    g.generateTexture("fx-glow", 10, 10);
    g.destroy();
  }

  if (!scene.textures.exists("fx-sparkle")) {
    const g = scene.add.graphics();
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(2, 0, 1, 5);
    g.fillRect(0, 2, 5, 1);
    g.generateTexture("fx-sparkle", 5, 5);
    g.destroy();
  }
}

export function generateAllTextures(scene: Phaser.Scene): void {
  generateTileTextures(scene);
  generatePlayerTextures(scene);
  generateProfessorTexture(scene);
  generateNpcTexture(scene, "npc-townsfolk", 0xd77b4a);
  generateNpcTexture(scene, "npc-gardener", 0x6ab04c);
  (["bulbasaur", "charmander", "squirtle", "pikachu"] as PokemonId[]).forEach((id) => generatePokemonTexture(scene, id));
  generateAmbientTextures(scene);
}
