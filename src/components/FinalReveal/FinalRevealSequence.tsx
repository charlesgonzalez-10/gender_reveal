import { useEffect, useMemo, useRef, useState } from "react";
import type { RevealWord } from "../../providers/revealMapping";
import { eventConfig } from "../../config/eventConfig";
import { soundManager } from "../../state/audio";
import { useGbcScope } from "../../game/systems/useGbcScope";
import ClueIcon from "../ClueIcon";
import PokemonIcon from "../PokemonIcon";
import "../../styles/finalReveal.css";

type Stage = "clues" | "countdown" | "paths" | "shaking" | "flash" | "result";

interface FinalRevealSequenceProps {
  resultWord: RevealWord;
  isPreview?: boolean;
  reducedMotion?: boolean;
  onReplayReveal?: () => void;
  onReplayAdventure?: () => void;
  onReturnToTitle?: () => void;
  onExitPreview?: () => void;
}

const CLUE_ORDER = ["leaf", "flame", "water", "lightning"] as const;
const POKEMON_ORDER = ["bulbasaur", "charmander", "squirtle", "pikachu"] as const;

export default function FinalRevealSequence({
  resultWord,
  isPreview = false,
  reducedMotion = false,
  onReplayReveal,
  onReplayAdventure,
  onReturnToTitle,
  onExitPreview,
}: FinalRevealSequenceProps) {
  const [stage, setStage] = useState<Stage>("clues");
  const [count, setCount] = useState(3);
  const [replayKey, setReplayKey] = useState(0);
  const speed = reducedMotion ? 0.25 : 1;

  useEffect(() => {
    setStage("clues");
    setCount(3);
  }, [replayKey]);

  useEffect(() => {
    if (stage !== "clues") return;
    const t = setTimeout(() => setStage("countdown"), 1200 * speed);
    return () => clearTimeout(t);
  }, [stage, speed]);

  useEffect(() => {
    if (stage !== "countdown") return;
    if (count <= 0) {
      setStage("paths");
      return;
    }
    soundManager.playSfx("countdown");
    const t = setTimeout(() => setCount((c) => c - 1), 850 * speed);
    return () => clearTimeout(t);
  }, [stage, count, speed]);

  useEffect(() => {
    if (stage !== "paths") return;
    const t = setTimeout(() => setStage("shaking"), 1600 * speed);
    return () => clearTimeout(t);
  }, [stage, speed]);

  useEffect(() => {
    if (stage !== "shaking") return;
    const t = setTimeout(() => setStage("flash"), 1300 * speed);
    return () => clearTimeout(t);
  }, [stage, speed]);

  useEffect(() => {
    if (stage !== "flash") return;
    const t = setTimeout(() => {
      soundManager.playSfx("celebration");
      setStage("result");
    }, 480 * speed);
    return () => clearTimeout(t);
  }, [stage, speed]);

  const confettiPieces = useMemo(() => {
    if (stage !== "result") return [];
    const palette = resultWord === "boy" ? ["#6fb3ff", "#bfe0ff", "#3f7fce", "#e8f4ff"] : ["#ff9fd0", "#ffd6ec", "#d9508f", "#fff0f8"];
    return Array.from({ length: reducedMotion ? 16 : 56 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.7,
      duration: 2.2 + Math.random() * 1.6,
      color: palette[i % palette.length],
    }));
  }, [stage, resultWord, reducedMotion]);

  const isBoy = resultWord === "boy";
  const themeClass = isBoy ? "grp-reveal-theme-a" : "grp-reveal-theme-b";
  const headline = isBoy ? "IT'S A BOY!" : "IT'S A GIRL!";
  const rootRef = useRef<HTMLDivElement>(null);

  useGbcScope(rootRef, { onBack: onExitPreview, active: stage === "result" });

  return (
    <div
      className={`grp-reveal-overlay ${stage === "result" ? themeClass : ""}`}
      role="dialog"
      aria-label="Final reveal"
      ref={rootRef}
      data-gbc-scope="final-reveal"
    >
      {isPreview && <div className="grp-preview-banner">PREVIEW MODE — not the real result</div>}

      {stage === "clues" && (
        <>
          <p className="grp-visually-hidden">All four clues combine into a glowing egg upon the ancient pedestal.</p>
          <div className="grp-reveal-clue-row">
            {CLUE_ORDER.map((c) => (
              <ClueIcon key={c} id={c} size={40} collected />
            ))}
          </div>
          <p>Bulbasaur, Charmander, Squirtle, and Pikachu gather around the pedestal...</p>
        </>
      )}

      {stage === "countdown" && <div className="grp-reveal-countdown" aria-live="assertive">{count > 0 ? count : "..."}</div>}

      {stage === "paths" && (
        <div className="grp-reveal-paths-wrap">
          <p className="grp-visually-hidden">Two ancient paths stood sealed. One barrier has now disappeared.</p>
          <div className="grp-reveal-paths" aria-hidden="true">
            <div
              className={`grp-reveal-path ${isBoy ? "grp-path-chosen grp-path-a" : "grp-path-sealed"} ${reducedMotion ? "grp-no-shimmer" : ""}`}
            />
            <div
              className={`grp-reveal-path ${!isBoy ? "grp-path-chosen grp-path-b" : "grp-path-sealed"} ${reducedMotion ? "grp-no-shimmer" : ""}`}
            />
          </div>
          <p className={`grp-reveal-paths-caption ${reducedMotion ? "grp-no-shimmer" : ""}`}>One path has been chosen...</p>
        </div>
      )}

      {stage === "shaking" && (
        <div className="grp-reveal-orb-wrap">
          <div className={`grp-reveal-orb ${reducedMotion ? "" : "grp-shake"}`} aria-label="The glowing egg" />
          <p>The egg is glowing brighter...</p>
        </div>
      )}

      {stage === "flash" && <div className="grp-reveal-flash" />}

      {stage === "result" && (
        <>
          {!reducedMotion &&
            confettiPieces.map((p) => (
              <div
                key={p.id}
                className="grp-confetti-piece"
                style={{
                  left: `${p.left}%`,
                  background: p.color,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}
          <div className="grp-reveal-result">
            <h1 className="grp-reveal-headline">{headline}</h1>
            <p className="grp-reveal-subtitle">{eventConfig.revealSubtitle}</p>
            {!isPreview &&
              eventConfig.revealClosingLines.map((line) => (
                <p className="grp-reveal-closing-line" key={line}>
                  {line}
                </p>
              ))}
            <div className="grp-reveal-pokemon-row">
              {POKEMON_ORDER.map((p) => (
                <PokemonIcon key={p} id={p} size={48} animated />
              ))}
            </div>
            <div className="grp-reveal-actions">
              <button
                type="button"
                className="grp-btn"
                onClick={() => {
                  setReplayKey((k) => k + 1);
                  onReplayReveal?.();
                }}
              >
                Replay Reveal
              </button>
              {isPreview ? (
                <button type="button" className="grp-btn grp-btn--primary" onClick={onExitPreview} data-gbc-default>
                  Return to Setup
                </button>
              ) : (
                <>
                  <button type="button" className="grp-btn" onClick={onReplayAdventure}>
                    Replay Adventure
                  </button>
                  <button type="button" className="grp-btn grp-btn--primary" onClick={onReturnToTitle} data-gbc-default>
                    Return to Title
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
