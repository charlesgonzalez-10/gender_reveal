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
  skin: 0xf0c090,
  cap: 0x2f5f8f,
  capBrim: 0x1f4569,
  pants: 0x2c2c3a,
  shoes: 0x4a3423,
};

function drawPlayerFrame(g: Phaser.GameObjects.Graphics, dir: "down" | "up" | "left" | "right", step: 0 | 1) {
  g.clear();
  const strideLeft = step === 1 ? 1 : -1;

  // legs (simple alternating stride)
  g.fillStyle(PLAYER_COLORS.pants, 1);
  g.fillRect(4, 15, 3, 4 - strideLeft);
  g.fillRect(9, 15, 3, 4 + strideLeft);
  g.fillStyle(PLAYER_COLORS.shoes, 1);
  g.fillRect(4, 18 - strideLeft, 3, 2);
  g.fillRect(9, 18 + strideLeft, 3, 2);

  // torso with a small shaded panel for depth
  g.fillStyle(PLAYER_COLORS.jacket, 1);
  g.fillRect(3, 7, 10, 9);
  g.fillStyle(PLAYER_COLORS.jacketShade, 1);
  g.fillRect(3, 12, 10, 4);

  // head
  g.fillStyle(PLAYER_COLORS.skin, 1);
  g.fillRect(4, 2, 8, 6);

  // cap (original two-tone design, deliberately not red/white to avoid
  // resembling any copyrighted trainer character)
  g.fillStyle(PLAYER_COLORS.cap, 1);
  g.fillRect(3, 0, 10, 3);
  g.fillStyle(PLAYER_COLORS.capBrim, 1);
  if (dir === "down") g.fillRect(3, 3, 10, 1);
  else if (dir === "up") g.fillRect(3, 0, 10, 1);
  else if (dir === "left") g.fillRect(2, 3, 5, 1);
  else g.fillRect(9, 3, 5, 1);

  g.fillStyle(0x111111, 1);
  if (dir === "down") {
    g.fillRect(5, 5, 2, 2);
    g.fillRect(9, 5, 2, 2);
  } else if (dir === "up") {
    g.fillStyle(PLAYER_COLORS.cap, 1);
    g.fillRect(3, 2, 10, 5);
  } else if (dir === "left") {
    g.fillRect(5, 5, 2, 2);
  } else {
    g.fillRect(9, 5, 2, 2);
  }
}

export function generatePlayerTextures(scene: Phaser.Scene): void {
  const dirs: Array<"down" | "up" | "left" | "right"> = ["down", "up", "left", "right"];
  for (const dir of dirs) {
    for (const step of [0, 1] as const) {
      const key = `player-${dir}-${step}`;
      if (scene.textures.exists(key)) continue;
      const g = scene.add.graphics();
      drawPlayerFrame(g, dir, step);
      g.generateTexture(key, 16, 20);
      g.destroy();
    }
  }
}

export function generateProfessorTexture(scene: Phaser.Scene): void {
  const key = "professor";
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(0xf4f4f4, 1);
  g.fillRect(3, 7, 11, 11);
  g.fillStyle(0xf0c090, 1);
  g.fillRect(4, 1, 8, 7);
  g.fillStyle(0xd8d8d8, 1);
  g.fillRect(3, 0, 10, 3);
  g.fillStyle(0x111111, 1);
  g.fillRect(5, 4, 2, 2);
  g.fillRect(9, 4, 2, 2);
  g.fillStyle(0x2c2c3a, 1);
  g.fillRect(3, 15, 4, 5);
  g.fillRect(10, 15, 4, 5);
  g.generateTexture(key, 17, 20);
  g.destroy();
}

export function generateNpcTexture(scene: Phaser.Scene, key: string, shirtColor: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  g.fillStyle(shirtColor, 1);
  g.fillRect(3, 7, 10, 9);
  g.fillStyle(0xf0c090, 1);
  g.fillRect(4, 1, 8, 7);
  g.fillStyle(0x5a3a20, 1);
  g.fillRect(3, 0, 10, 3);
  g.fillStyle(0x111111, 1);
  g.fillRect(5, 4, 2, 2);
  g.fillRect(9, 4, 2, 2);
  g.fillStyle(0x2c2c3a, 1);
  g.fillRect(4, 15, 3, 5);
  g.fillRect(9, 15, 3, 5);
  g.generateTexture(key, 16, 20);
  g.destroy();
}

const POKEMON_PALETTE: Record<PokemonId, { body: number; accent: number }> = {
  bulbasaur: { body: 0x5fb87a, accent: 0x2f7a49 },
  charmander: { body: 0xef8a52, accent: 0xc14f21 },
  squirtle: { body: 0x5bb8d6, accent: 0x276d85 },
  pikachu: { body: 0xf6d24c, accent: 0xc98a1c },
};

export function generatePokemonTexture(scene: Phaser.Scene, id: PokemonId): void {
  const key = `pokemon-${id}`;
  if (scene.textures.exists(key)) return;
  const { body, accent } = POKEMON_PALETTE[id];
  const g = scene.add.graphics();

  // feet stubs
  g.fillStyle(accent, 1);
  g.fillRoundedRect(3, 18, 4, 4, 2);
  g.fillRoundedRect(15, 18, 4, 4, 2);

  // main body with a soft highlight for a bit of dimensionality
  g.fillStyle(body, 1);
  g.fillRoundedRect(1, 6, 20, 14, 6);
  g.fillStyle(0xffffff, 0.18);
  g.fillRoundedRect(3, 7, 8, 5, 3);

  // face
  g.fillStyle(0x111111, 1);
  g.fillCircle(8, 13, 1.6);
  g.fillCircle(15, 13, 1.6);
  g.fillStyle(accent, 1);
  g.fillRect(6, 18, 11, 2);

  if (id === "bulbasaur") {
    g.fillStyle(accent, 1);
    g.fillEllipse(11, 3, 9, 6);
    g.fillStyle(0x3f9c5f, 1);
    g.fillEllipse(11, 2, 5, 3);
  } else if (id === "charmander") {
    g.fillStyle(0xffb84d, 1);
    g.fillTriangle(18, 2, 22, 8, 16, 8);
    g.fillStyle(0xffe08a, 0.8);
    g.fillTriangle(19, 3, 21, 7, 17, 7);
  } else if (id === "squirtle") {
    g.lineStyle(2, accent, 1);
    g.strokeEllipse(11, 4, 12, 5);
  } else if (id === "pikachu") {
    g.fillStyle(accent, 1);
    g.fillTriangle(3, 6, 0, -2, 8, 4);
    g.fillTriangle(19, 6, 22, -2, 14, 4);
  }

  g.generateTexture(key, 22, 22);
  g.destroy();
}

export function generateAllTextures(scene: Phaser.Scene): void {
  generateTileTextures(scene);
  generatePlayerTextures(scene);
  generateProfessorTexture(scene);
  generateNpcTexture(scene, "npc-townsfolk", 0xd77b4a);
  generateNpcTexture(scene, "npc-gardener", 0x6ab04c);
  (["bulbasaur", "charmander", "squirtle", "pikachu"] as PokemonId[]).forEach((id) => generatePokemonTexture(scene, id));
}
