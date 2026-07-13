import { useEffect, useRef, useState } from "react";
import MinigameOverlay from "./MinigameOverlay";
import { soundManager } from "../../state/audio";

interface ReactionConnectGameProps {
  onComplete: () => void;
  onExit: () => void;
  reducedMotion?: boolean;
}

type Phase = "instructions" | "playing" | "won";
const REQUIRED_HITS = 3;
const NODE_COUNT = 5;
const LIGHT_WINDOW_MS = 1400;

export default function ReactionConnectGame({ onComplete, onExit, reducedMotion = false }: ReactionConnectGameProps) {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [litNode, setLitNode] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [connected, setConnected] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function lightRandomNode() {
    const idx = Math.floor(Math.random() * NODE_COUNT);
    setLitNode(idx);
    soundManager.playSfx("electric");
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(
      () => {
        setLitNode(null);
        setMessage("So close — watch for the next spark!");
        window.setTimeout(() => {
          setMessage(null);
          lightRandomNode();
        }, 500);
      },
      reducedMotion ? LIGHT_WINDOW_MS * 1.5 : LIGHT_WINDOW_MS,
    );
  }

  function startGame() {
    setHits(0);
    setConnected(new Set());
    setMessage(null);
    setPhase("playing");
    window.setTimeout(lightRandomNode, 400);
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  function pressNode(idx: number) {
    if (phase !== "playing" || litNode === null) return;
    if (idx === litNode) {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      const nextHits = hits + 1;
      setHits(nextHits);
      setConnected((c) => new Set([...c, idx]));
      setLitNode(null);
      soundManager.playSfx("confirm");
      if (nextHits >= REQUIRED_HITS) {
        window.setTimeout(() => {
          setPhase("won");
          soundManager.playSfx("clue");
        }, 300);
      } else {
        window.setTimeout(lightRandomNode, 500);
      }
    }
  }

  return (
    <MinigameOverlay title="Pikachu's Spark Circuit" onExit={onExit}>
      {phase === "instructions" && (
        <div className="grp-minigame-instructions">
          <p>Watch the nodes — one will spark with electricity at a time.</p>
          <p>Tap the glowing node quickly before the spark fades. Connect {REQUIRED_HITS} sparks to win!</p>
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
          <p className="grp-minigame-progress">Connected: {hits} / {REQUIRED_HITS}</p>
          <div className="grp-node-grid" role="group" aria-label="Circuit nodes">
            {Array.from({ length: NODE_COUNT }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`grp-node-btn ${litNode === i ? "grp-node-lit" : ""} ${connected.has(i) ? "grp-node-connected" : ""}`}
                onClick={() => pressNode(i)}
                aria-label={litNode === i ? `Node ${i + 1}, sparking now` : `Node ${i + 1}`}
              >
                {litNode === i ? "⚡" : ""}
              </button>
            ))}
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
