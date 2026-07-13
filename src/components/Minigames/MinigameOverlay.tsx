import { useRef, type ReactNode } from "react";
import { useGbcScope } from "../../game/systems/useGbcScope";
import "../../styles/minigames.css";

interface MinigameOverlayProps {
  title: string;
  children: ReactNode;
  onExit?: () => void;
}

/**
 * Shared shell for all four Pokémon challenges. Wiring the GBC nav scope
 * in here (rather than in each individual minigame) is what makes every
 * challenge's cards/instructions/HIT-button/etc. D-pad + A/B controllable
 * for free — each game only needs to render plain <button> elements,
 * which they already did.
 */
export default function MinigameOverlay({ title, children, onExit }: MinigameOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useGbcScope(rootRef, { onBack: onExit });

  return (
    <div className="grp-minigame-overlay" role="dialog" aria-label={title} data-gbc-scope="minigame">
      <div className="grp-minigame-panel grp-pixel-panel" ref={rootRef}>
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
