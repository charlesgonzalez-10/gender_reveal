import Phaser from "phaser";
import { isSolidTile, type TileType } from "../maps/townMap";
import { gameEvents, GameEvent } from "../sceneEvents";

export type Direction = "down" | "up" | "left" | "right";

const SPEED = 96; // pixels per second
const FOOT_W = 10;
const FOOT_H = 8;

export class Player {
  public sprite: Phaser.GameObjects.Image;
  public direction: Direction = "down";
  public locked = false;
  private walkStep: 0 | 1 = 0;
  private walkTimer = 0;
  private footstepTimer = 0;
  private isMoving = false;
  private tileAt: (px: number, py: number) => TileType;

  constructor(scene: Phaser.Scene, x: number, y: number, tileAt: (px: number, py: number) => TileType) {
    this.tileAt = tileAt;
    this.sprite = scene.add.image(x, y, "player-down-0");
    this.sprite.setOrigin(0.5, 0.85);
    this.sprite.setDepth(10);
  }

  get worldX(): number {
    return this.sprite.x;
  }
  get worldY(): number {
    return this.sprite.y;
  }

  private isBlocked(cx: number, cy: number): boolean {
    const halfW = FOOT_W / 2;
    const points: [number, number][] = [
      [cx - halfW, cy - FOOT_H],
      [cx + halfW, cy - FOOT_H],
      [cx - halfW, cy],
      [cx + halfW, cy],
    ];
    return points.some(([px, py]) => isSolidTile(this.tileAt(px, py)));
  }

  update(delta: number, input: { up: boolean; down: boolean; left: boolean; right: boolean }): void {
    if (this.locked) {
      this.isMoving = false;
      this.sprite.setTexture(`player-${this.direction}-0`);
      return;
    }

    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;

    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      if (dx !== 0 && dy !== 0) {
        const norm = Math.SQRT1_2;
        dx *= norm;
        dy *= norm;
      }
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? "right" : "left";
      } else if (dy !== 0) {
        this.direction = dy > 0 ? "down" : "up";
      }

      const step = (SPEED * delta) / 1000;
      const nextX = this.sprite.x + dx * step;
      const nextY = this.sprite.y + dy * step;

      if (!this.isBlocked(nextX, this.sprite.y)) {
        this.sprite.x = nextX;
      }
      if (!this.isBlocked(this.sprite.x, nextY)) {
        this.sprite.y = nextY;
      }

      this.walkTimer += delta;
      if (this.walkTimer > 140) {
        this.walkTimer = 0;
        this.walkStep = this.walkStep === 0 ? 1 : 0;
      }

      this.footstepTimer += delta;
      if (this.footstepTimer > 260) {
        this.footstepTimer = 0;
        gameEvents.emit(GameEvent.Footstep);
      }
    } else {
      this.walkStep = 0;
      this.walkTimer = 0;
    }

    this.isMoving = moving;
    this.sprite.setTexture(`player-${this.direction}-${this.isMoving ? this.walkStep : 0}`);
  }

  facingPoint(distance = 14): { x: number; y: number } {
    let x = this.sprite.x;
    let y = this.sprite.y - 6;
    if (this.direction === "up") y -= distance;
    else if (this.direction === "down") y += distance;
    else if (this.direction === "left") x -= distance;
    else x += distance;
    return { x, y };
  }
}
