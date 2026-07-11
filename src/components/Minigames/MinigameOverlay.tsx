import type { ReactNode } from "react";
import "../../styles/minigames.css";

interface MinigameOverlayProps {
  title: string;
  children: ReactNode;
  onExit?: () => void;
}

export default function MinigameOverlay({ title, children, onExit }: MinigameOverlayProps) {
  return (
    <div className="grp-minigame-overlay" role="dialog" aria-label={title}>
      <div className="grp-minigame-panel grp-pixel-panel">
        <div className="grp-minigame-header">
          <h2>{title}</h2>
          {onExit && (
            <button type="button" className="grp-btn grp-minigame-exit" onClick={onExit} aria-label="Close challenge">
              ✕
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
