import Phaser from "phaser";
import { generateAllTextures } from "../systems/textures";
import type { TownSceneInitData } from "./TownScene";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("Preload");
  }

  create() {
    const { width, height } = this.scale;
    const label = this.add
      .text(width / 2, height / 2, "Loading...", { fontFamily: "monospace", fontSize: "14px", color: "#ffffff" })
      .setOrigin(0.5);

    try {
      generateAllTextures(this);
    } catch (err) {
      label.setText("Asset generation failed.\nPlease reload.");
      console.error("Texture generation failed", err);
      return;
    }

    const initData = this.registry.get("initialProgress") as TownSceneInitData["progress"] | undefined;
    this.scene.start("Town", { progress: initData });
  }
}
