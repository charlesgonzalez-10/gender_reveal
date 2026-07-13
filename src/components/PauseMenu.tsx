import { useRef, useState } from "react";
import { useGbcScope } from "../game/systems/useGbcScope";
import "../styles/pauseMenu.css";

interface PauseMenuProps {
  soundEnabled: boolean;
  reducedMotion: boolean;
  onToggleSound: () => void;
  onToggleReducedMotion: () => void;
  onResume: () => void;
  onResetProgress: () => void;
  onReturnToTitle: () => void;
  onFullscreen: () => void;
}

export default function PauseMenu({
  soundEnabled,
  reducedMotion,
  onToggleSound,
  onToggleReducedMotion,
  onResume,
  onResetProgress,
  onReturnToTitle,
  onFullscreen,
}: PauseMenuProps) {
  const [confirmingReset, setConfirmingReset] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // B backs out of the reset confirmation first if it's open, otherwise
  // resumes play — mirrors the "cancel/back" and "resume" roles for B/Start
  // from the control spec.
  useGbcScope(rootRef, { onBack: () => (confirmingReset ? setConfirmingReset(false) : onResume()) });

  return (
    <div className="grp-pause-overlay" role="dialog" aria-label="Pause menu" data-gbc-scope="pause">
      <div className="grp-pause-panel grp-pixel-panel" ref={rootRef}>
        <h2>Paused</h2>
        <div className="grp-pause-actions">
          <button type="button" className="grp-btn grp-btn--primary" onClick={onResume} data-gbc-default>
            Resume
          </button>
          <button type="button" className="grp-btn" onClick={onToggleSound} aria-pressed={soundEnabled}>
            {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
          </button>
          <button type="button" className="grp-btn" onClick={onToggleReducedMotion} aria-pressed={reducedMotion}>
            {reducedMotion ? "Motion: Reduced" : "Motion: Normal"}
          </button>
          <button type="button" className="grp-btn" onClick={onFullscreen}>
            ⛶ Fullscreen
          </button>

          {!confirmingReset ? (
            <button type="button" className="grp-btn grp-btn--danger" onClick={() => setConfirmingReset(true)}>
              Reset Progress
            </button>
          ) : (
            <div className="grp-pause-confirm">
              <p>Reset all game progress? Clues and challenge completion will be lost.</p>
              <div className="grp-pause-actions">
                <button
                  type="button"
                  className="grp-btn grp-btn--danger"
                  onClick={() => {
                    onResetProgress();
                    setConfirmingReset(false);
                  }}
                >
                  Confirm Reset
                </button>
                <button type="button" className="grp-btn" onClick={() => setConfirmingReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button type="button" className="grp-btn" onClick={onReturnToTitle}>
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
}
