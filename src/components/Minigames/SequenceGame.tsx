import { useEffect, useState } from "react";
import MinigameOverlay from "./MinigameOverlay";
import GameSymbol, { type SymbolType } from "./GameSymbol";
import { soundManager } from "../../state/audio";

interface SequenceGameProps {
  onComplete: () => void;
  onExit: () => void;
  reducedMotion?: boolean;
}

type Phase = "instructions" | "showing" | "input" | "roundWon" | "won" | "miss";

const SYMBOLS: SymbolType[] = ["drop", "wave", "splash", "bubble"];
const ROUND_LENGTHS = [2, 3, 4];

function randomSequence(length: number): SymbolType[] {
  return Array.from({ length }, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
}

export default function SequenceGame({ onComplete, onExit, reducedMotion = false }: SequenceGameProps) {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<SymbolType[]>([]);
  const [playerInput, setPlayerInput] = useState<SymbolType[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  function startRound(roundIndex: number) {
    const seq = randomSequence(ROUND_LENGTHS[roundIndex]);
    setSequence(seq);
    setPlayerInput([]);
    setPhase("showing");
    setActiveIndex(-1);
  }

  function startGame() {
    setRound(0);
    startRound(0);
  }

  useEffect(() => {
    if (phase !== "showing") return;
    const stepMs = reducedMotion ? 260 : 620;
    let i = 0;
    setActiveIndex(0);
    soundManager.playSfx("water");
    const interval = window.setInterval(() => {
      i += 1;
      if (i >= sequence.length) {
        window.clearInterval(interval);
        setActiveIndex(-1);
        window.setTimeout(() => setPhase("input"), 200);
        return;
      }
      setActiveIndex(i);
      soundManager.playSfx("water");
    }, stepMs);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, sequence, reducedMotion]);

  function pressSymbol(sym: SymbolType) {
    if (phase !== "input") return;
    const nextInput = [...playerInput, sym];
    const idx = nextInput.length - 1;
    if (sequence[idx] !== sym) {
      setPhase("miss");
      return;
    }
    setPlayerInput(nextInput);
    if (nextInput.length === sequence.length) {
      if (round + 1 >= ROUND_LENGTHS.length) {
        setPhase("won");
        soundManager.playSfx("clue");
      } else {
        setPhase("roundWon");
      }
    }
  }

  function nextRound() {
    const nextRoundIndex = round + 1;
    setRound(nextRoundIndex);
    startRound(nextRoundIndex);
  }

  return (
    <MinigameOverlay title="Squirtle's Water Pattern" onExit={onExit}>
      {phase === "instructions" && (
        <div className="grp-minigame-instructions">
          <p>Watch the sequence of water symbols light up, then repeat it in the same order.</p>
          <p>Complete 3 short rounds to win.</p>
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

      {(phase === "showing" || phase === "input" || phase === "miss") && (
        <>
          <p className="grp-minigame-progress">
            Round {round + 1} / {ROUND_LENGTHS.length} — {phase === "showing" ? "Watch closely..." : "Your turn!"}
          </p>
          <div className="grp-sequence-row" role="group" aria-label="Water symbol sequence">
            {sequence.map((sym, i) => (
              <div key={i} className={`grp-sequence-btn ${activeIndex === i ? "grp-active" : ""}`} aria-hidden="true">
                <GameSymbol type={sym} size={26} />
              </div>
            ))}
          </div>
          <div className="grp-sequence-row" role="group" aria-label="Choose the symbol">
            {SYMBOLS.map((sym, i) => (
              <button
                key={sym}
                type="button"
                className="grp-sequence-btn"
                onClick={() => pressSymbol(sym)}
                disabled={phase !== "input"}
                data-gbc-default={i === 0 ? true : undefined}
              >
                <GameSymbol type={sym} size={26} />
              </button>
            ))}
          </div>
          {phase === "miss" && (
            <>
              <p role="alert">So close! Let's try that round again.</p>
              <div className="grp-minigame-actions">
                <button type="button" className="grp-btn grp-btn--primary" onClick={() => startRound(round)} data-gbc-default>
                  Retry Round
                </button>
              </div>
            </>
          )}
          <div className="grp-minigame-actions">
            <button type="button" className="grp-btn" onClick={() => setPhase("instructions")}>
              Instructions
            </button>
          </div>
        </>
      )}

      {phase === "roundWon" && (
        <div className="grp-minigame-success">
          <p>Splash! Round {round + 1} complete!</p>
          <button type="button" className="grp-btn grp-btn--primary" onClick={nextRound} data-gbc-default>
            Next Round
          </button>
        </div>
      )}

      {phase === "won" && (
        <div className="grp-minigame-success">
          <p>Squirtle gives you the Water Clue!</p>
          <button type="button" className="grp-btn grp-btn--primary" onClick={onComplete} data-gbc-default>
            Continue
          </button>
        </div>
      )}
    </MinigameOverlay>
  );
}
