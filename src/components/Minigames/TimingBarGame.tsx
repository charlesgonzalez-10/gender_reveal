import { useEffect, useRef, useState } from "react";
import MinigameOverlay from "./MinigameOverlay";
import { soundManager } from "../../state/audio";

interface TimingBarGameProps {
  onComplete: () => void;
  onExit: () => void;
  reducedMotion?: boolean;
}

type Phase = "instructions" | "playing" | "won";
const REQUIRED_HITS = 3;
const TARGET_WIDTH = 22; // percent of bar width

export default function TimingBarGame({ onComplete, onExit, reducedMotion = false }: TimingBarGameProps) {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [markerPos, setMarkerPos] = useState(0);
  const [targetStart, setTargetStart] = useState(39);
  const [hits, setHits] = useState(0);
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const directionRef = useRef(1);
  const posRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== "playing") return;
    let last = performance.now();
    const speed = reducedMotion ? 45 : 65; // percent per second

    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      posRef.current += directionRef.current * speed * dt;
      if (posRef.current >= 100) {
        posRef.current = 100;
        directionRef.current = -1;
      } else if (posRef.current <= 0) {
        posRef.current = 0;
        directionRef.current = 1;
      }
      setMarkerPos(posRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [phase, reducedMotion]);

  function startGame() {
    setHits(0);
    posRef.current = 0;
    directionRef.current = 1;
    setMarkerPos(0);
    setTargetStart(30 + Math.random() * 40);
    setFeedback(null);
    setPhase("playing");
  }

  function attemptHit() {
    if (phase !== "playing") return;
    const pos = posRef.current;
    const inTarget = pos >= targetStart && pos <= targetStart + TARGET_WIDTH;
    if (inTarget) {
      soundManager.playSfx("fire");
      setFeedback("hit");
      const nextHits = hits + 1;
      setHits(nextHits);
      setTargetStart(20 + Math.random() * 55);
      if (nextHits >= REQUIRED_HITS) {
        window.setTimeout(() => {
          setPhase("won");
          soundManager.playSfx("clue");
        }, 250);
      }
    } else {
      setFeedback("miss");
    }
    window.setTimeout(() => setFeedback(null), 300);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase === "playing" && (e.code === "Space" || e.key === "Enter" || e.key === "e" || e.key === "E")) {
        e.preventDefault();
        attemptHit();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, targetStart, hits]);

  return (
    <MinigameOverlay title="Charmander's Timing Trial" onExit={onExit}>
      {phase === "instructions" && (
        <div className="grp-minigame-instructions">
          <p>Watch the marker move across the bar.</p>
          <p>Press the action button (Space / Enter / E, or the HIT button) when it's inside the glowing zone.</p>
          <p>Land {REQUIRED_HITS} successful hits to win!</p>
          <div className="grp-minigame-actions">
            <button type="button" className="grp-btn grp-btn--primary" onClick={startGame}>
              Start
            </button>
          </div>
        </div>
      )}

      {phase === "playing" && (
        <>
          <p className="grp-minigame-progress">Hits: {hits} / {REQUIRED_HITS}</p>
          <div className="grp-timing-bar-track" aria-hidden="true">
            <div className="grp-timing-bar-target" style={{ left: `${targetStart}%`, width: `${TARGET_WIDTH}%` }} />
            <div className="grp-timing-bar-marker" style={{ left: `${markerPos}%` }} />
          </div>
          <div className="grp-hit-dots" aria-label={`${hits} of ${REQUIRED_HITS} hits landed`}>
            {Array.from({ length: REQUIRED_HITS }, (_, i) => (
              <span key={i} className={`grp-hit-dot ${i < hits ? "grp-hit" : ""}`} />
            ))}
          </div>
          {feedback && (
            <p role="status" aria-live="assertive">
              {feedback === "hit" ? "Nice hit!" : "Missed — try again!"}
            </p>
          )}
          <div className="grp-minigame-actions">
            <button type="button" className="grp-btn grp-btn--primary" onClick={attemptHit}>
              HIT!
            </button>
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
          <p>Charmander gives you the Flame Clue!</p>
          <button type="button" className="grp-btn grp-btn--primary" onClick={onComplete}>
            Continue
          </button>
        </div>
      )}
    </MinigameOverlay>
  );
}
