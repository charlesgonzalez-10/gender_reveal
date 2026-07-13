import { useEffect, useRef, useState } from "react";
import { soundManager } from "../state/audio";
import { useGbcScope } from "../game/systems/useGbcScope";
import "../styles/dialogue.css";

interface DialogueBoxProps {
  lines: string[];
  speakerName?: string;
  reducedMotion?: boolean;
  onClose: () => void;
}

const CHAR_INTERVAL_MS = 22;

export default function DialogueBox({ lines, speakerName, reducedMotion = false, onClose }: DialogueBoxProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(reducedMotion ? lines[0]?.length ?? 0 : 0);
  const intervalRef = useRef<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLine = lines[lineIndex] ?? "";
  const isLineComplete = visibleChars >= currentLine.length;
  const isLastLine = lineIndex >= lines.length - 1;

  useEffect(() => {
    setVisibleChars(reducedMotion ? currentLine.length : 0);
    if (reducedMotion) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setVisibleChars((c) => {
        if (c >= currentLine.length) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          return c;
        }
        return c + 1;
      });
    }, CHAR_INTERVAL_MS);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineIndex, reducedMotion]);

  function advance() {
    soundManager.playSfx("dialogue");
    if (!isLineComplete) {
      setVisibleChars(currentLine.length);
      return;
    }
    if (isLastLine) {
      onClose();
    } else {
      setLineIndex((i) => i + 1);
    }
  }

  function skipAll() {
    onClose();
  }

  // A (GbcConfirm) advances/completes the current line by clicking the
  // "▼ Next"/"Close" button below, which is focused by default; B
  // (GbcCancel) skips the whole dialogue, matching "skip-or-speed-up
  // dialogue" from the control spec.
  useGbcScope(rootRef, { onBack: skipAll });

  return (
    <div className="grp-dialogue-overlay" data-gbc-scope="dialogue">
      <div className="grp-dialogue-box grp-pixel-panel" role="dialog" aria-live="polite" aria-label="Dialogue" ref={rootRef}>
        {speakerName && <div className="grp-dialogue-speaker">{speakerName}</div>}
        <p className="grp-dialogue-text">{currentLine.slice(0, visibleChars)}</p>
        <div className="grp-dialogue-footer">
          <button type="button" className="grp-btn grp-dialogue-skip" onClick={skipAll}>
            Skip
          </button>
          <button type="button" className="grp-btn grp-btn--primary grp-dialogue-advance" onClick={advance} data-gbc-default>
            {isLineComplete && isLastLine ? "Close" : "▼ Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
