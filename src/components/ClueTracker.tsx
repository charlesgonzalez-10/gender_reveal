import { useEffect, useRef, useState } from "react";
import type { ClueId } from "../types/gameState";
import ClueIcon from "./ClueIcon";
import "../styles/hud.css";

const ALL_CLUES: ClueId[] = ["leaf", "flame", "water", "lightning"];

interface ClueTrackerProps {
  collectedClues: ClueId[];
}

export default function ClueTracker({ collectedClues }: ClueTrackerProps) {
  const [justCollected, setJustCollected] = useState<ClueId | null>(null);
  const prevCount = useRef(collectedClues.length);

  useEffect(() => {
    if (collectedClues.length > prevCount.current) {
      const newest = collectedClues[collectedClues.length - 1];
      setJustCollected(newest);
      const t = window.setTimeout(() => setJustCollected(null), 900);
      prevCount.current = collectedClues.length;
      return () => window.clearTimeout(t);
    }
    prevCount.current = collectedClues.length;
  }, [collectedClues]);

  return (
    <div className="grp-clue-tracker grp-pixel-panel" role="status" aria-label="Clue progress">
      <div className="grp-clue-tracker-count">
        Clues: {collectedClues.length} / 4
      </div>
      <div className="grp-clue-tracker-icons">
        {ALL_CLUES.map((clue) => (
          <div key={clue} className={`grp-clue-slot ${justCollected === clue ? "grp-clue-slot-pop" : ""}`}>
            <ClueIcon id={clue} size={22} collected={collectedClues.includes(clue)} />
          </div>
        ))}
      </div>
    </div>
  );
}
