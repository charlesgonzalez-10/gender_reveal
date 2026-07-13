import { useCallback, useRef } from "react";
import { gameEvents, GameEvent } from "../game/sceneEvents";
import { soundManager } from "../state/audio";
import "../styles/mobileControls.css";

interface MobileControlsProps {
  /** A */
  onConfirm: () => void;
  /** B */
  onCancel: () => void;
  /** Start */
  onStart: () => void;
  /** Select */
  onSelect: () => void;
  vibrationEnabled?: boolean;
}

type DirKey = "up" | "down" | "left" | "right";

const DIR_EVENT: Record<DirKey, string> = {
  up: GameEvent.GbcUp,
  down: GameEvent.GbcDown,
  left: GameEvent.GbcLeft,
  right: GameEvent.GbcRight,
};

export default function MobileControls({ onConfirm, onCancel, onStart, onSelect, vibrationEnabled = true }: MobileControlsProps) {
  const activeDirs = useRef<Record<DirKey, boolean>>({ up: false, down: false, left: false, right: false });

  function pressFeedback() {
    if (vibrationEnabled) {
      try {
        navigator.vibrate?.(10);
      } catch {
        // Vibration API unsupported or blocked — press still registers visually.
      }
    }
    soundManager.playSfx("click");
  }

  const emitMove = useCallback(() => {
    gameEvents.emit(GameEvent.RemoteMove, { ...activeDirs.current });
  }, []);

  function setDir(dir: DirKey, active: boolean) {
    if (active && !activeDirs.current[dir]) {
      pressFeedback();
      // Continuous RemoteMove drives player movement on the map; the
      // one-shot Gbc*direction* event drives focus navigation in whatever
      // menu/overlay is currently open. Both are safe to emit together —
      // nothing is listening for the latter unless a menu is mounted.
      gameEvents.emit(DIR_EVENT[dir]);
    }
    activeDirs.current[dir] = active;
    emitMove();
  }

  function dpadHandlers(dir: DirKey) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setDir(dir, true);
      },
      onPointerUp: (e: React.PointerEvent) => {
        e.preventDefault();
        setDir(dir, false);
      },
      onPointerLeave: () => setDir(dir, false),
      onPointerCancel: () => setDir(dir, false),
    };
  }

  function withFeedback(fn: () => void) {
    return () => {
      pressFeedback();
      fn();
    };
  }

  return (
    <div className="grp-console-deck" aria-label="Console controls">
      <div className="grp-dpad-cross" role="group" aria-label="Directional pad">
        <button type="button" className="grp-dpad-btn grp-dpad-up" aria-label="Up" {...dpadHandlers("up")}>
          <span className="grp-dpad-hit" aria-hidden="true" />▲
        </button>
        <button type="button" className="grp-dpad-btn grp-dpad-left" aria-label="Left" {...dpadHandlers("left")}>
          <span className="grp-dpad-hit" aria-hidden="true" />◀
        </button>
        <span className="grp-dpad-hub" aria-hidden="true" />
        <button type="button" className="grp-dpad-btn grp-dpad-right" aria-label="Right" {...dpadHandlers("right")}>
          <span className="grp-dpad-hit" aria-hidden="true" />▶
        </button>
        <button type="button" className="grp-dpad-btn grp-dpad-down" aria-label="Down" {...dpadHandlers("down")}>
          <span className="grp-dpad-hit" aria-hidden="true" />▼
        </button>
      </div>

      <div className="grp-center-buttons" role="group" aria-label="System buttons">
        <span className="grp-pill-column">
          <button type="button" className="grp-pill-btn" onClick={withFeedback(onSelect)} aria-label="Select" />
          <span className="grp-pill-label" aria-hidden="true">
            SELECT
          </span>
        </span>
        <span className="grp-pill-column">
          <button type="button" className="grp-pill-btn" onClick={withFeedback(onStart)} aria-label="Start" />
          <span className="grp-pill-label" aria-hidden="true">
            START
          </span>
        </span>
      </div>

      <div className="grp-action-cluster" role="group" aria-label="Action buttons">
        <button type="button" className="grp-action-btn grp-action-b" onClick={withFeedback(onCancel)} aria-label="B — back / cancel">
          B
        </button>
        <button
          type="button"
          className="grp-action-btn grp-action-a"
          onClick={withFeedback(onConfirm)}
          aria-label="A — confirm / interact"
        >
          A
        </button>
      </div>

      <div className="grp-speaker" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} className="grp-speaker-dot" />
        ))}
      </div>
    </div>
  );
}
