import { useRef, useState } from "react";
import { eventConfig } from "../config/eventConfig";
import { useGbcScope } from "../game/systems/useGbcScope";
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

type View = "menu" | "settings" | "name-entry";

const NAME_MAX_LENGTH = 12;
const LETTER_ROWS = ["ABCDEFGHIJKLM", "NOPQRSTUVWXYZ"];

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
  const [view, setView] = useState<View>("menu");
  const [name, setName] = useState(defaultName);
  const rootRef = useRef<HTMLDivElement>(null);

  // The whole screen is one D-pad + A/B navigable scope: every button
  // below is plain, focusable markup, so up/down/left/right movement and
  // A-to-confirm come for free from the shared GBC nav system. Only B's
  // "go back" target changes depending on which page is showing.
  useGbcScope(rootRef, {
    onBack: () => {
      if (view === "menu") return;
      setView("menu");
    },
  });

  function confirmName() {
    onStartNew(name.trim().length > 0 ? name.trim() : defaultName);
  }

  return (
    <div className="grp-title-screen" ref={rootRef}>
      <div className="grp-title-logo-wrap">
        <h1 className="grp-title-logo">{eventConfig.gameTitle}</h1>
        <p className="grp-title-parents">{eventConfig.parentNames}</p>
      </div>

      {view === "menu" && (
        <div className="grp-title-menu" data-gbc-scope="title-menu">
          <p className="grp-title-press-start">— Press Start —</p>
          <div className="grp-title-buttons grp-title-buttons--menu">
            {hasSavedProgress && (
              <button type="button" className="grp-btn grp-btn--primary" onClick={onContinue} data-gbc-default>
                Continue
              </button>
            )}
            <button
              type="button"
              className="grp-btn"
              onClick={() => {
                setName(defaultName);
                setView("name-entry");
              }}
              data-gbc-default={hasSavedProgress ? undefined : true}
            >
              {hasSavedProgress ? "New Game" : "Start Adventure"}
            </button>
            <button type="button" className="grp-btn" onClick={() => setView("settings")}>
              Settings
            </button>
            <button type="button" className="grp-btn" onClick={onFullscreen}>
              Fullscreen
            </button>
          </div>
        </div>
      )}

      {view === "settings" && (
        <div className="grp-title-menu" data-gbc-scope="title-settings">
          <p className="grp-title-press-start">Settings</p>
          <div className="grp-title-buttons">
            <button type="button" className="grp-btn" onClick={onToggleSound} aria-pressed={soundEnabled} data-gbc-default>
              {soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
            </button>
            <button type="button" className="grp-btn" onClick={onToggleReducedMotion} aria-pressed={reducedMotion}>
              {reducedMotion ? "Motion: Reduced" : "Motion: Normal"}
            </button>
            <button type="button" className="grp-btn" onClick={() => setView("menu")}>
              Back
            </button>
          </div>
        </div>
      )}

      {view === "name-entry" && (
        <div className="grp-title-name-entry" data-gbc-scope="title-name-entry">
          <label className="grp-title-name-label" htmlFor="trainer-name-display">
            What's your trainer name?
          </label>
          <p id="trainer-name-display" className="grp-title-name-display" aria-live="polite">
            {name.length > 0 ? name : <span className="grp-title-name-placeholder">{defaultName}</span>}
            <span className="grp-title-name-caret" aria-hidden="true">
              ▌
            </span>
          </p>
          <div className="grp-letter-grid" role="group" aria-label="Letter picker">
            {LETTER_ROWS.map((row) => (
              <div className="grp-letter-row" key={row}>
                {row.split("").map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    className="grp-letter-key"
                    onClick={() => setName((n) => (n.length < NAME_MAX_LENGTH ? n + letter : n))}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ))}
            <div className="grp-letter-row">
              <button type="button" className="grp-letter-key grp-letter-key--wide" onClick={() => setName((n) => (n.length < NAME_MAX_LENGTH ? n + " " : n))}>
                Space
              </button>
              <button type="button" className="grp-letter-key grp-letter-key--wide" onClick={() => setName((n) => n.slice(0, -1))}>
                ⌫ Delete
              </button>
            </div>
          </div>
          <div className="grp-title-buttons">
            <button type="button" className="grp-btn grp-btn--primary" onClick={confirmName} data-gbc-default>
              Let's Go!
            </button>
            <button type="button" className="grp-btn" onClick={() => setView("menu")}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
