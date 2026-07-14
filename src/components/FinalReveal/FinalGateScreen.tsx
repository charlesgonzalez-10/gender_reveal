import { useRef } from "react";
import ClueIcon from "../ClueIcon";
import { useGbcScope } from "../../game/systems/useGbcScope";
import "../../styles/finalGate.css";

interface FinalGateScreenProps {
  onBegin: () => void;
  onCancel: () => void;
}

const CLUES = ["leaf", "flame", "water", "lightning"] as const;

export default function FinalGateScreen({ onBegin, onCancel }: FinalGateScreenProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useGbcScope(rootRef, { onBack: onCancel });

  return (
    <div className="grp-final-gate-overlay" role="dialog" aria-label="Final reveal gate" data-gbc-scope="final-gate">
      <div className="grp-final-gate-panel grp-pixel-panel" ref={rootRef}>
        <h2>The Ancient Temple Awakens!</h2>
        <div className="grp-final-gate-clues">
          {CLUES.map((c) => (
            <ClueIcon key={c} id={c} size={20} collected />
          ))}
        </div>
        <p className="grp-final-gate-quote">
          "Two paths were created long ago. Only one has been chosen — no one knows which until the temple awakens."
        </p>
        <p className="grp-final-gate-warning">Gather everyone around before continuing.</p>
        <div className="grp-minigame-actions">
          <button type="button" className="grp-btn grp-btn--primary" onClick={onBegin}>
            Enter the Temple
          </button>
          <button type="button" className="grp-btn" onClick={onCancel} data-gbc-default>
            Not Yet
          </button>
        </div>
      </div>
    </div>
  );
}
