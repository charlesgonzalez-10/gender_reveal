import { useCallback, useRef } from "react";
import { gameEvents, GameEvent } from "../game/sceneEvents";
import "../styles/mobileControls.css";

interface MobileControlsProps {
  onAction: () => void;
  onBack: () => void;
  onMenu: () => void;
  onMute: () => void;
  muted: boolean;
}

type DirKey = "up" | "down" | "left" | "right";

export default function MobileControls({ onAction, onBack, onMenu, onMute, muted }: MobileControlsProps) {
  const activeDirs = useRef<Record<DirKey, boolean>>({ up: false, down: false, left: false, right: false });

  const emitMove = useCallback(() => {
    gameEvents.emit(GameEvent.RemoteMove, { ...activeDirs.current });
  }, []);

  function setDir(dir: DirKey, active: boolean) {
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

  return (
    <div className="grp-mobile-controls" aria-label="Touch controls">
      <div className="grp-dpad" role="group" aria-label="Directional pad">
        <button type="button" className="grp-dpad-btn grp-dpad-up" aria-label="Move up" {...dpadHandlers("up")}>
          ▲
        </button>
        <button type="button" className="grp-dpad-btn grp-dpad-left" aria-label="Move left" {...dpadHandlers("left")}>
          ◀
        </button>
        <button type="button" className="grp-dpad-btn grp-dpad-right" aria-label="Move right" {...dpadHandlers("right")}>
          ▶
        </button>
        <button type="button" className="grp-dpad-btn grp-dpad-down" aria-label="Move down" {...dpadHandlers("down")}>
          ▼
        </button>
      </div>

      <div className="grp-action-cluster" role="group" aria-label="Action buttons">
        <button type="button" className="grp-action-btn grp-action-menu" onClick={onMenu} aria-label="Menu">
          ☰
        </button>
        <button type="button" className="grp-action-btn grp-action-mute" onClick={onMute} aria-pressed={muted} aria-label="Mute toggle">
          {muted ? "🔇" : "🔊"}
        </button>
        <button type="button" className="grp-action-btn grp-action-a" onClick={onAction} aria-label="Confirm / Interact">
          A
        </button>
        <button type="button" className="grp-action-btn grp-action-b" onClick={onBack} aria-label="Back / Close">
          B
        </button>
      </div>
    </div>
  );
}
