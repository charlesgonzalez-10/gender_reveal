import { useEffect, useMemo, useState } from "react";
import MinigameOverlay from "./MinigameOverlay";
import GameSymbol, { type SymbolType } from "./GameSymbol";
import { soundManager } from "../../state/audio";

interface MemoryMatchGameProps {
  onComplete: () => void;
  onExit: () => void;
  reducedMotion?: boolean;
}

const SYMBOLS: SymbolType[] = ["leaf", "flower", "sprout"];

interface Card {
  id: number;
  symbol: SymbolType;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildDeck(): Card[] {
  const pairs = [...SYMBOLS, ...SYMBOLS];
  return shuffle(pairs).map((symbol, id) => ({ id, symbol }));
}

type Phase = "instructions" | "playing" | "won";

export default function MemoryMatchGame({ onComplete, onExit, reducedMotion = false }: MemoryMatchGameProps) {
  const [phase, setPhase] = useState<Phase>("instructions");
  const [deck, setDeck] = useState<Card[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const allMatched = matched.size === deck.length;

  useEffect(() => {
    if (allMatched && deck.length > 0) {
      setPhase("won");
      soundManager.playSfx("clue");
    }
  }, [allMatched, deck.length]);

  function retry() {
    setDeck(buildDeck());
    setFlipped([]);
    setMatched(new Set());
    setBusy(false);
    setPhase("playing");
  }

  function flipCard(index: number) {
    if (busy || flipped.includes(index) || matched.has(index)) return;
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length === 2) {
      setBusy(true);
      const [a, b] = next;
      const isMatch = deck[a].symbol === deck[b].symbol;
      window.setTimeout(
        () => {
          if (isMatch) {
            setMatched((m) => new Set([...m, a, b]));
            soundManager.playSfx("confirm");
          }
          setFlipped([]);
          setBusy(false);
        },
        isMatch ? 320 : reducedMotion ? 250 : 650,
      );
    }
  }

  const cardsMemo = useMemo(() => deck, [deck]);

  return (
    <MinigameOverlay title="Bulbasaur's Memory Garden" onExit={onExit}>
      {phase === "instructions" && (
        <div className="grp-minigame-instructions">
          <p>Flip the cards and find all three matching pairs of nature symbols.</p>
          <p>Tap two cards at a time. Matching symbols stay face up!</p>
          <div className="grp-minigame-actions">
            <button type="button" className="grp-btn grp-btn--primary" onClick={retry}>
              Start
            </button>
          </div>
        </div>
      )}

      {phase === "playing" && (
        <>
          <p className="grp-minigame-progress">Matched: {matched.size / 2} / 3</p>
          <div className="grp-memory-grid" role="group" aria-label="Memory match cards">
            {cardsMemo.map((card, index) => {
              const isFaceUp = flipped.includes(index) || matched.has(index);
              return (
                <button
                  key={card.id}
                  type="button"
                  className={`grp-memory-card ${matched.has(index) ? "grp-matched" : ""}`}
                  onClick={() => flipCard(index)}
                  aria-label={isFaceUp ? `Card showing ${card.symbol}` : "Face-down card"}
                  disabled={matched.has(index)}
                >
                  {isFaceUp ? <GameSymbol type={card.symbol} size={28} /> : <span aria-hidden="true">?</span>}
                </button>
              );
            })}
          </div>
          <div className="grp-minigame-actions">
            <button type="button" className="grp-btn" onClick={retry}>
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
          <p>Bulbasaur trusts you with the Leaf Clue!</p>
          <button type="button" className="grp-btn grp-btn--primary" onClick={onComplete}>
            Continue
          </button>
        </div>
      )}
    </MinigameOverlay>
  );
}
