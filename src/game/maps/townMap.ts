export const TILE_SIZE = 16;
export const MAP_COLS = 32;
export const MAP_ROWS = 24;

export type TileType =
  | "grass"
  | "path"
  | "tallgrass"
  | "water"
  | "sand"
  | "tree"
  | "rock"
  | "flower"
  | "fence"
  | "building"
  | "labfloor"
  | "cavefloor"
  | "meadow"
  | "sign"
  | "gate"
  | "gateopen"
  | "finalfloor";

const SOLID_TILES = new Set<TileType>(["tree", "rock", "fence", "building", "sign", "gate", "water"]);

export function isSolidTile(t: TileType): boolean {
  return SOLID_TILES.has(t);
}

function makeGrid(cols: number, rows: number, fill: TileType): TileType[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => fill));
}

function rect(grid: TileType[][], x: number, y: number, w: number, h: number, tile: TileType) {
  for (let row = y; row < y + h; row++) {
    for (let col = x; col < x + w; col++) {
      if (row >= 0 && row < grid.length && col >= 0 && col < grid[0].length) {
        grid[row][col] = tile;
      }
    }
  }
}

function buildTownGrid(): TileType[][] {
  const grid = makeGrid(MAP_COLS, MAP_ROWS, "grass");

  // Border trees
  rect(grid, 0, 0, MAP_COLS, 1, "tree");
  rect(grid, 0, MAP_ROWS - 1, MAP_COLS, 1, "tree");
  rect(grid, 0, 0, 1, MAP_ROWS, "tree");
  rect(grid, MAP_COLS - 1, 0, 1, MAP_ROWS, "tree");

  // Main paths — central plaza + arms to each zone
  rect(grid, 2, 11, 28, 2, "path"); // horizontal spine
  rect(grid, 9, 2, 2, 20, "path"); // vertical spine

  // Professor's laboratory (top-left)
  rect(grid, 2, 2, 7, 6, "building");
  rect(grid, 4, 7, 3, 1, "labfloor"); // door threshold
  rect(grid, 3, 3, 5, 4, "labfloor"); // interior floor (decorative)

  // Central town plaza garden
  rect(grid, 12, 3, 8, 6, "grass");
  rect(grid, 13, 4, 2, 1, "flower");
  rect(grid, 17, 4, 2, 1, "flower");
  rect(grid, 13, 7, 6, 1, "fence");
  grid[7][15] = "path"; // plaza gate gap
  rect(grid, 14, 5, 4, 1, "path");

  // Garden / tall grass area (Bulbasaur) — top right
  rect(grid, 22, 2, 8, 7, "tallgrass");
  grid[8][22] = "path";
  rect(grid, 22, 8, 8, 1, "path");
  grid[3][24] = "flower";
  grid[5][27] = "flower";
  grid[3][27] = "flower";

  // Rocky cave area (Charmander) — right/middle
  rect(grid, 23, 11, 8, 6, "cavefloor");
  rect(grid, 22, 10, 10, 1, "rock");
  rect(grid, 22, 17, 10, 1, "rock");
  rect(grid, 22, 10, 1, 8, "rock");
  rect(grid, 31, 10, 1, 8, "rock");
  grid[13][22] = "cavefloor"; // entrance gap
  grid[10][26] = "cavefloor"; // entrance gap north

  // Pond / shoreline (Squirtle) — bottom left
  rect(grid, 3, 16, 9, 6, "sand");
  rect(grid, 4, 17, 6, 4, "water");
  grid[13][6] = "path";

  // Thunder Meadow (Pikachu) — bottom middle, its own golden-green ground
  // instead of reusing the generic path tile.
  rect(grid, 14, 17, 7, 5, "meadow");
  grid[17][14] = "rock";
  grid[17][20] = "rock";
  grid[21][14] = "rock";
  grid[21][20] = "rock";
  grid[13][17] = "path";

  // Final reveal location — bottom right, gated
  rect(grid, 23, 18, 7, 4, "finalfloor");
  rect(grid, 23, 17, 7, 1, "fence");
  grid[17][26] = "gate"; // locked gate entrance
  grid[13][27] = "path";

  // Decorative flowers and trees scattered along paths
  grid[10][6] = "flower";
  grid[10][7] = "flower";
  grid[14][10] = "flower";
  grid[14][19] = "flower";
  rect(grid, 5, 12, 1, 1, "flower");
  grid[3][12] = "tree";
  grid[3][30] = "tree";
  grid[20][3] = "tree";
  grid[20][29] = "tree";

  // Signs
  grid[9][12] = "sign";
  grid[16][13] = "sign";

  return grid;
}

export const townTileGrid: TileType[][] = buildTownGrid();

export interface Point {
  x: number;
  y: number;
}

function toWorld(col: number, row: number): Point {
  return { x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2 };
}

export const spawnPoints = {
  player: toWorld(10, 13),
  professor: toWorld(5, 5),
  npcTownsfolk: toWorld(15, 9),
  npcGardener: toWorld(26, 20),
  signPlaza: toWorld(12, 9),
  signClearing: toWorld(13, 16),
  bulbasaur: toWorld(25, 5),
  charmander: toWorld(27, 14),
  squirtle: toWorld(6, 19),
  squirtleFishingSpot: toWorld(6, 21),
  pikachu: toWorld(17, 19),
  finalGate: toWorld(26, 17),
  finalArea: toWorld(26, 20),
};

export const worldWidth = MAP_COLS * TILE_SIZE;
export const worldHeight = MAP_ROWS * TILE_SIZE;
