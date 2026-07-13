import { useRef } from "react";
import { useGbcScope } from "../game/systems/useGbcScope";
import "../styles/controlsTutorial.css";

interface ControlsTutorialOverlayProps {
  onClose: () => void;
}

const CONTROLS = [
  { key: "D-pad", desc: "Walk around, and move the highlight in any menu" },
  { key: "A", desc: "Talk, confirm, and select" },
  { key: "B", desc: "Back or cancel" },
  { key: "Start", desc: "Open the pause menu" },
  { key: "Select", desc: "Open the clue tracker" },
];

/** Shown automatically the first time the game starts, and reachable again
 * anytime from the Select quick-access screen. Only ever teaches which
 * button does what — no game content, story, or puzzle solutions — so it
 * never spoils anything for someone who'd rather explore on their own. */
export default function ControlsTutorialOverlay({ onClose }: ControlsTutorialOverlayProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useGbcScope(rootRef, { onBack: onClose });

  return (
    <div className="grp-tutorial-overlay" role="dialog" aria-label="How to play" data-gbc-scope="controls-tutorial">
      <div className="grp-tutorial-panel grp-pixel-panel" ref={rootRef}>
        <h2>How to Play</h2>
        <ul className="grp-tutorial-list">
          {CONTROLS.map(({ key, desc }) => (
            <li key={key} className="grp-tutorial-row">
              <span className="grp-tutorial-key">{key}</span>
              <span className="grp-tutorial-desc">{desc}</span>
            </li>
          ))}
        </ul>
        <div className="grp-minigame-actions">
          <button type="button" className="grp-btn grp-btn--primary" onClick={onClose} data-gbc-default>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
