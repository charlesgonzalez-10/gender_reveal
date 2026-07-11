import ClueIcon from "../ClueIcon";
import "../../styles/finalGate.css";

interface FinalGateScreenProps {
  onBegin: () => void;
  onCancel: () => void;
}

const CLUES = ["leaf", "flame", "water", "lightning"] as const;

export default function FinalGateScreen({ onBegin, onCancel }: FinalGateScreenProps) {
  return (
    <div className="grp-final-gate-overlay" role="dialog" aria-label="Final reveal gate">
      <div className="grp-final-gate-panel grp-pixel-panel">
        <h2>All Four Clues Are Complete!</h2>
        <div className="grp-final-gate-clues">
          {CLUES.map((c) => (
            <ClueIcon key={c} id={c} size={26} collected />
          ))}
        </div>
        <p>The final mystery is ready to be revealed.</p>
        <p className="grp-final-gate-warning">Gather everyone around before continuing.</p>
        <div className="grp-minigame-actions">
          <button type="button" className="grp-btn grp-btn--primary" onClick={onBegin}>
            Begin Final Reveal
          </button>
          <button type="button" className="grp-btn" onClick={onCancel}>
            Not Yet
          </button>
        </div>
      </div>
    </div>
  );
}
