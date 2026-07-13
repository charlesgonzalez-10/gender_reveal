import { useEffect, useRef, useState } from "react";
import MinigameOverlay from "./MinigameOverlay";
import PokemonIcon from "../PokemonIcon";
import { soundManager } from "../../state/audio";

interface ReactionConnectGameProps {
  onComplete: () => void;
  onExit: () => void;
  reducedMotion?: boolean;
}

type Phase = "instructions" | "playing" | "won";
const REQUIRED_HITS = 3;
const SPARK_WINDOW_MS = 1600;

/**
 * A single glowing target instead of a grid of nodes — no need to move
 * focus anywhere to react, so it's just as playable with the D-pad/A
 * controller as it is by touch. Earlier version required navigating to
 * whichever of 5 scattered nodes lit up next within a tight window, which
 * forced players to tap the screen directly to keep up.
 */
export default function ReactionConnectGame({ onComplete, onExit, reducedMotion = false }: ReactionConnectGameProps) {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [lit, setLit] = useState(false);
  const [hits, setHits] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function lightTarget() {
    setLit(true);
    soundManager.playSfx("electric");
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () => {
        setLit(false);
        setMessage("So close — watch for the next spark!");
        window.setTimeout(() => {
          setMessage(null);
          lightTarget();
        }, 500);
      },
      reducedMotion ? SPARK_WINDOW_MS * 1.5 : SPARK_WINDOW_MS,
    );
  }

  function startGame() {
    setHits(0);
    setMessage(null);
    setPhase("playing");
    window.setTimeout(lightTarget, 400);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function pressTarget() {
    if (phase !== "playing" || !lit) return;
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    const nextHits = hits + 1;
    setHits(nextHits);
    setLit(false);
    soundManager.playSfx("confirm");
    if (nextHits >= REQUIRED_HITS) {
      window.setTimeout(() => {
        setPhase("won");
        soundManager.playSfx("clue");
      }, 300);
    } else {
      window.setTimeout(lightTarget, 500);
    }
  }

  return (
    <MinigameOverlay title="Pikachu's Spark Circuit" onExit={onExit}>
      {phase === "instructions" && (
        <div className="grp-minigame-instructions">
          <p>Pikachu is charging up its cheeks!</p>
          <p>Press A the instant it sparks with electricity. Catch {REQUIRED_HITS} sparks to win!</p>
          <div className="grp-minigame-actions">
            <button type="button" className="grp-btn grp-btn--primary" onClick={startGame} data-gbc-default>
              Start
            </button>
            <button type="button" className="grp-btn" onClick={onComplete}>
              Skip Challenge
            </button>
          </div>
        </div>
      )}

      {phase === "playing" && (
        <>
          <p className="grp-minigame-progress">Sparks caught: {hits} / {REQUIRED_HITS}</p>
          <div className="grp-spark-stage">
            <button
              type="button"
              className={`grp-spark-target ${lit ? "grp-spark-lit" : ""}`}
              onClick={pressTarget}
              aria-label={lit ? "Pikachu, sparking now — press A!" : "Pikachu — wait for the spark"}
              data-gbc-default
            >
              <PokemonIcon id="pikachu" size={72} />
            </button>
          </div>
          {message && (
            <p role="status" aria-live="polite">
              {message}
            </p>
          )}
          <div className="grp-minigame-actions">
            <button type="button" className="grp-btn" onClick={startGame}>
              Retry
            </button>
            <button type="button" className="grp-btn" onClick={() => setPhase("instructions")}>
              Instructions
            </button>
          </div>
        </>
      )}

      {phase === "won" && (
        <div className="grp-minigame-success">
          <p>Pikachu gives you the Lightning Clue!</p>
          <button type="button" className="grp-btn grp-btn--primary" onClick={onComplete}>
            Continue
          </button>
        </div>
      )}
    </MinigameOverlay>
  );
}
