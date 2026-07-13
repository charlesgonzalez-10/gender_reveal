import { useRef } from "react";
import type { ClueId } from "../types/gameState";
import ClueIcon from "./ClueIcon";
import { useGbcScope } from "../game/systems/useGbcScope";
import "../styles/quickAccess.css";

interface QuickAccessOverlayProps {
  collectedClues: ClueId[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
}

const ALL_CLUES: { id: ClueId; label: string }[] = [
  { id: "leaf", label: "Flower Garden — Bulbasaur" },
  { id: "flame", label: "Ember Camp — Charmander" },
  { id: "water", label: "Crystal Pond — Squirtle" },
  { id: "lightning", label: "Thunder Meadow — Pikachu" },
];

/** Select's quick-access screen: a bigger clue tracker plus the sound
 * toggle, reachable without ever leaving the map. */
export default function QuickAccessOverlay({ collectedClues, soundEnabled, onToggleSound, onClose }: QuickAccessOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useGbcScope(rootRef, { onBack: onClose });

  return (
    <div className="grp-quick-access-overlay" role="dialog" aria-label="Clue tracker and settings" data-gbc-scope="quick-access">
      <div className="grp-quick-access-panel grp-pixel-panel" ref={rootRef}>
        <h2>Clue Tracker</h2>
        <ul className="grp-quick-access-clue-list">
          {ALL_CLUES.map(({ id, label }) => (
            <li key={id} className="grp-quick-access-clue-row">
              <ClueIcon id={id} size={22} collected={collectedClues.includes(id)} />
              <span>{label}</span>
              <span aria-hidden="true">{collectedClues.includes(id) ? "✓" : ""}</span>
            </li>
          ))}
        </ul>
        <div className="grp-minigame-actions">
          <button type="button" className="grp-btn" onClick={onToggleSound} aria-pressed={soundEnabled}>
            {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
          </button>
          <button type="button" className="grp-btn grp-btn--primary" onClick={onClose} data-gbc-default>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
