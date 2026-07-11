import { useState } from "react";
import { eventConfig } from "../config/eventConfig";
import "../styles/title.css";

interface TitleScreenProps {
  hasSavedProgress: boolean;
  defaultName: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  onStartNew: (name: string) => void;
  onContinue: () => void;
  onFullscreen: () => void;
}

export default function TitleScreen({
  hasSavedProgress,
  defaultName,
  soundEnabled,
  onToggleSound,
  reducedMotion,
  onToggleReducedMotion,
  onStartNew,
  onContinue,
  onFullscreen,
}: TitleScreenProps) {
  const [showNameEntry, setShowNameEntry] = useState(false);
  const [name, setName] = useState(defaultName);

  return (
    <div className="grp-title-screen">
      <div className="grp-title-logo-wrap">
        <h1 className="grp-title-logo">{eventConfig.gameTitle}</h1>
        <p className="grp-title-parents">{eventConfig.parentNames}</p>
      </div>

      {!showNameEntry && (
        <div className="grp-title-menu">
          <p className="grp-title-press-start">— Press Start —</p>
          <div className="grp-title-buttons">
            {hasSavedProgress && (
              <button type="button" className="grp-btn grp-btn--primary" onClick={onContinue}>
                Continue
              </button>
            )}
            <button type="button" className="grp-btn" onClick={() => setShowNameEntry(true)}>
              {hasSavedProgress ? "New Game" : "Start Adventure"}
            </button>
          </div>
          <p className="grp-title-instructions">
            Use Arrow Keys / WASD to move · Enter, Space, or E to interact · Touch controls appear automatically on
            mobile
          </p>
        </div>
      )}

      {showNameEntry && (
        <form
          className="grp-title-name-form"
          onSubmit={(e) => {
            e.preventDefault();
            onStartNew(name.trim().length > 0 ? name.trim() : defaultName);
          }}
        >
          <label htmlFor="trainer-name" className="grp-title-name-label">
            What's your trainer name?
          </label>
          <input
            id="trainer-name"
            className="grp-setup-input"
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            autoFocus
          />
          <div className="grp-title-buttons">
            <button type="submit" className="grp-btn grp-btn--primary">
              Let's Go!
            </button>
            <button type="button" className="grp-btn" onClick={() => setShowNameEntry(false)}>
              Back
            </button>
          </div>
        </form>
      )}

      <div className="grp-title-toolbar">
        <button type="button" className="grp-btn grp-title-toolbar-btn" onClick={onToggleSound} aria-pressed={soundEnabled}>
          {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
        </button>
        <button type="button" className="grp-btn grp-title-toolbar-btn" onClick={onFullscreen}>
          ⛶ Fullscreen
        </button>
        <button
          type="button"
          className="grp-btn grp-title-toolbar-btn"
          onClick={onToggleReducedMotion}
          aria-pressed={reducedMotion}
        >
          {reducedMotion ? "Motion: Reduced" : "Motion: Normal"}
        </button>
      </div>
    </div>
  );
}
