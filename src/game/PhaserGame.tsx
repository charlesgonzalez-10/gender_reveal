import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { TownScene } from "./scenes/TownScene";
import type { GameProgress } from "../types/gameState";

interface PhaserGameProps {
  initialProgress: GameProgress;
  onReady?: (game: Phaser.Game) => void;
}

export default function PhaserGame({ initialProgress, onReady }: PhaserGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 320,
      height: 240,
      pixelArt: true,
      roundPixels: true,
      backgroundColor: "#000000",
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, PreloadScene, TownScene],
      physics: undefined,
    };

    const game = new Phaser.Game(config);
    game.registry.set("initialProgress", initialProgress);
    gameRef.current = game;
    onReady?.(game);

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="grp-phaser-container" aria-label="Game map" role="application" />;
}
