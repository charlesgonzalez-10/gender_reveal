import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";
import { useGame } from "../state/GameContext";
import { revealProvider } from "../providers";
import { describeReveal, type RevealWord } from "../providers/revealMapping";
import { soundManager } from "../state/audio";
import { hasSavedProgress } from "../state/progressStore";
import { gameEvents, GameEvent, type InteractionPayload } from "../game/sceneEvents";
import type { TownScene } from "../game/scenes/TownScene";
import type { PokemonId } from "../types/gameState";

import PhaserGame from "../game/PhaserGame";
import TitleScreen from "../components/TitleScreen";
import DialogueBox from "../components/DialogueBox";
import ClueTracker from "../components/ClueTracker";
import MobileControls from "../components/MobileControls";
import PauseMenu from "../components/PauseMenu";
import FinalGateScreen from "../components/FinalReveal/FinalGateScreen";
import FinalRevealSequence from "../components/FinalReveal/FinalRevealSequence";
import MemoryMatchGame from "../components/Minigames/MemoryMatchGame";
import TimingBarGame from "../components/Minigames/TimingBarGame";
import SequenceGame from "../components/Minigames/SequenceGame";
import ReactionConnectGame from "../components/Minigames/ReactionConnectGame";

type Screen = "title" | "game";
type RevealStatus = "loading" | "not-set" | "ready" | "error";

const COMPLETION_LINES: Record<PokemonId, string> = {
  bulbasaur: "Bulbasaur trusts you with the Leaf Clue!",
  charmander: "Charmander gives you the Flame Clue!",
  squirtle: "Squirtle gives you the Water Clue!",
  pikachu: "Pikachu gives you the Lightning Clue!",
};

export default function PublicGameRoute() {
  const {
    progress,
    setTrainerName,
    markIntroStarted,
    isChallengeComplete,
    completeChallenge,
    savePlayerPosition,
    setSoundEnabled,
    setReducedMotion,
    resetProgress,
  } = useGame();

  const [revealStatus, setRevealStatus] = useState<RevealStatus>("loading");
  const [screen, setScreen] = useState<Screen>("title");
  const [activeDialogue, setActiveDialogue] = useState<InteractionPayload | null>(null);
  const [activeMinigame, setActiveMinigame] = useState<PokemonId | null>(null);
  const [gateScreenOpen, setGateScreenOpen] = useState(false);
  const [finalRevealActive, setFinalRevealActive] = useState(false);
  const [finalRevealWord, setFinalRevealWord] = useState<RevealWord | null>(null);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [gameMountKey, setGameMountKey] = useState(0);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  function showNotice(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3200);
  }

  useEffect(() => {
    let cancelled = false;
    revealProvider
      .hasRevealBeenSet()
      .then((isSet) => {
        if (!cancelled) setRevealStatus(isSet ? "ready" : "not-set");
      })
      .catch(() => {
        if (!cancelled) setRevealStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    soundManager.setMuted(!progress.soundEnabled);
  }, [progress.soundEnabled]);

  useEffect(() => {
    soundManager.setMusicVolume(progress.musicVolume);
    soundManager.setSfxVolume(progress.sfxVolume);
  }, [progress.musicVolume, progress.sfxVolume]);

  useEffect(() => {
    const resumeAudio = () => soundManager.resume();
    window.addEventListener("pointerdown", resumeAudio, { once: true });
    window.addEventListener("keydown", resumeAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", resumeAudio);
      window.removeEventListener("keydown", resumeAudio);
    };
  }, []);

  useEffect(() => {
    if (revealStatus !== "ready") return;
    if (screen === "title") {
      soundManager.playMusic("title");
    } else if (screen === "game" && !finalRevealActive) {
      soundManager.playMusic(activeMinigame ? "challenge" : "town");
    }
  }, [screen, finalRevealActive, activeMinigame, revealStatus]);

  useEffect(() => {
    function onInteract(payload: InteractionPayload) {
      setActiveDialogue(payload);
    }
    function onFinalUnlocked() {
      showNotice("The glowing gate by the rocky cave has opened!");
    }
    function onEnterGate() {
      setGateScreenOpen(true);
    }
    gameEvents.on(GameEvent.Interact, onInteract);
    gameEvents.on(GameEvent.FinalAreaUnlocked, onFinalUnlocked);
    gameEvents.on(GameEvent.EnterFinalGate, onEnterGate);
    return () => {
      gameEvents.off(GameEvent.Interact, onInteract);
      gameEvents.off(GameEvent.FinalAreaUnlocked, onFinalUnlocked);
      gameEvents.off(GameEvent.EnterFinalGate, onEnterGate);
    };
  }, []);

  useEffect(() => {
    if (screen !== "game") return;
    const interval = window.setInterval(() => {
      const townScene = phaserGameRef.current?.scene.getScene("Town") as TownScene | undefined;
      if (townScene && typeof townScene.savePlayerPosition === "function") {
        try {
          savePlayerPosition(townScene.savePlayerPosition());
        } catch {
          // Scene not ready yet — ignore.
        }
      }
    }, 4000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (screen !== "game") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "Escape") {
        setPaused((p) => {
          gameEvents.emit(p ? GameEvent.UnlockMovement : GameEvent.LockMovement);
          return !p;
        });
      } else if (e.key === "m" || e.key === "M") {
        setSoundEnabled(!progress.soundEnabled);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, progress.soundEnabled]);

  function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => showNotice("Fullscreen isn't available on this device."));
      } else {
        document.exitFullscreen?.().catch(() => undefined);
      }
    } catch {
      showNotice("Fullscreen isn't available on this device.");
    }
  }

  function handleStartNew(name: string) {
    setTrainerName(name);
    setScreen("game");
  }

  function handleContinue() {
    setScreen("game");
  }

  function handleDialogueClose() {
    const payload = activeDialogue;
    setActiveDialogue(null);
    if (!payload) return;
    gameEvents.emit(GameEvent.DialogueClosed, payload);

    if (payload.kind === "professor" && !progress.hasStartedIntro) {
      markIntroStarted();
    }

    if (payload.kind === "pokemon" && payload.pokemonId && !isChallengeComplete(payload.pokemonId)) {
      setActiveMinigame(payload.pokemonId);
      return;
    }

    gameEvents.emit(GameEvent.UnlockMovement);
  }

  function handleMinigameComplete(pokemonId: PokemonId) {
    completeChallenge(pokemonId);
    setActiveMinigame(null);
    gameEvents.emit(GameEvent.ChallengeComplete, pokemonId);
    setActiveDialogue({ kind: "pokemon", id: pokemonId, pokemonId, lines: [COMPLETION_LINES[pokemonId]] });
  }

  function handleMinigameExit() {
    setActiveMinigame(null);
    gameEvents.emit(GameEvent.UnlockMovement);
  }

  async function handleBeginFinalReveal() {
    setGateScreenOpen(false);
    soundManager.stopMusic();
    try {
      const sealed = await revealProvider.getReveal();
      if (!sealed) {
        showNotice("The reveal result could not be found. Please contact the event organizer.");
        gameEvents.emit(GameEvent.UnlockMovement);
        return;
      }
      setFinalRevealWord(describeReveal(sealed));
      setFinalRevealActive(true);
    } catch {
      showNotice("Something went wrong loading the reveal. Please contact the event organizer.");
      gameEvents.emit(GameEvent.UnlockMovement);
    }
  }

  function handleCancelGate() {
    setGateScreenOpen(false);
    gameEvents.emit(GameEvent.UnlockMovement);
  }

  function handleReturnToTitle() {
    setFinalRevealActive(false);
    setFinalRevealWord(null);
    setScreen("title");
    setGameMountKey((k) => k + 1);
  }

  function handleReplayAdventure() {
    setFinalRevealActive(false);
    setFinalRevealWord(null);
  }

  function handleResetProgress() {
    resetProgress();
    setPaused(false);
    setScreen("title");
    setGameMountKey((k) => k + 1);
  }

  function handleOpenPause() {
    gameEvents.emit(GameEvent.LockMovement);
    setPaused(true);
  }

  function handleClosePause() {
    gameEvents.emit(GameEvent.UnlockMovement);
    setPaused(false);
  }

  function handleMobileAction() {
    if (screen !== "game") return;
    if (activeDialogue) {
      handleDialogueClose();
    } else {
      gameEvents.emit(GameEvent.RemoteAction);
    }
  }

  function handleMobileBack() {
    if (screen !== "game") return;
    if (paused) handleClosePause();
    else if (activeMinigame) handleMinigameExit();
    else if (activeDialogue) handleDialogueClose();
    else if (gateScreenOpen) handleCancelGate();
    else handleOpenPause();
  }

  if (revealStatus === "loading") {
    return (
      <div className="grp-app-shell">
        <p className="grp-visually-hidden">Loading…</p>
      </div>
    );
  }

  if (revealStatus === "not-set" || revealStatus === "error") {
    return (
      <div className="grp-app-shell">
        <div className="grp-console grp-console--framed">
          <div className="grp-console-header">
            <span className="grp-console-comm">△ COMM.</span>
          </div>
          <div className="grp-viewport-frame">
            <span className="grp-console-power" aria-hidden="true">
              <span className="grp-console-power-dot" />
              <span className="grp-console-power-waves">)))</span>
              <span className="grp-console-power-label">POWER</span>
            </span>
            <span className="grp-console-screw grp-console-screw--tr" aria-hidden="true" />
            <span className="grp-console-screw grp-console-screw--bl" aria-hidden="true" />
            <span className="grp-console-screw grp-console-screw--br" aria-hidden="true" />
            <div className="grp-viewport">
              <div className="grp-not-ready-screen">
                <p className="grp-not-ready-message">
                  The adventure is not ready yet. Please ask the event organizer for help.
                </p>
              </div>
            </div>
          </div>
          <div className="grp-console-wordmark">
            <span className="grp-console-nintendo">Nintendo</span>
            <span className="grp-console-gbc-logo">
              GAME BOY <span className="grp-gbc-color">COLOR</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grp-app-shell">
      <div className="grp-console grp-console--framed">
        <div className="grp-console-header">
          <span className="grp-console-comm">△ COMM.</span>
        </div>
        <div className="grp-viewport-frame">
          <span className="grp-console-power" aria-hidden="true">
            <span className="grp-console-power-dot" />
            <span className="grp-console-power-waves">)))</span>
            <span className="grp-console-power-label">POWER</span>
          </span>
          <span className="grp-console-screw grp-console-screw--tr" aria-hidden="true" />
          <span className="grp-console-screw grp-console-screw--bl" aria-hidden="true" />
          <span className="grp-console-screw grp-console-screw--br" aria-hidden="true" />
          <div className="grp-viewport">
            {screen === "title" && (
              <TitleScreen
                hasSavedProgress={hasSavedProgress()}
                defaultName={progress.trainerName}
                soundEnabled={progress.soundEnabled}
                onToggleSound={() => setSoundEnabled(!progress.soundEnabled)}
                reducedMotion={progress.reducedMotion}
                onToggleReducedMotion={() => setReducedMotion(!progress.reducedMotion)}
                onStartNew={handleStartNew}
                onContinue={handleContinue}
                onFullscreen={toggleFullscreen}
              />
            )}

            {screen === "game" && (
              <>
                <PhaserGame
                  key={gameMountKey}
                  initialProgress={progress}
                  onReady={(game) => {
                    phaserGameRef.current = game;
                  }}
                />

                <div className="grp-hud-layer">
                  <ClueTracker collectedClues={progress.collectedClues} />
                  <div className="grp-top-bar">
                    <button type="button" className="grp-icon-btn" onClick={handleOpenPause} aria-label="Open menu">
                      ☰
                    </button>
                  </div>
                </div>

                {activeDialogue && (
                  <DialogueBox
                    lines={activeDialogue.lines}
                    reducedMotion={progress.reducedMotion}
                    onClose={handleDialogueClose}
                  />
                )}

                {activeMinigame === "bulbasaur" && (
                  <MemoryMatchGame
                    onComplete={() => handleMinigameComplete("bulbasaur")}
                    onExit={handleMinigameExit}
                    reducedMotion={progress.reducedMotion}
                  />
                )}
                {activeMinigame === "charmander" && (
                  <TimingBarGame
                    onComplete={() => handleMinigameComplete("charmander")}
                    onExit={handleMinigameExit}
                    reducedMotion={progress.reducedMotion}
                  />
                )}
                {activeMinigame === "squirtle" && (
                  <SequenceGame
                    onComplete={() => handleMinigameComplete("squirtle")}
                    onExit={handleMinigameExit}
                    reducedMotion={progress.reducedMotion}
                  />
                )}
                {activeMinigame === "pikachu" && (
                  <ReactionConnectGame
                    onComplete={() => handleMinigameComplete("pikachu")}
                    onExit={handleMinigameExit}
                    reducedMotion={progress.reducedMotion}
                  />
                )}

                {gateScreenOpen && <FinalGateScreen onBegin={handleBeginFinalReveal} onCancel={handleCancelGate} />}

                {finalRevealActive && finalRevealWord && (
                  <FinalRevealSequence
                    resultWord={finalRevealWord}
                    reducedMotion={progress.reducedMotion}
                    onReplayAdventure={handleReplayAdventure}
                    onReturnToTitle={handleReturnToTitle}
                  />
                )}

                {paused && !finalRevealActive && (
                  <PauseMenu
                    soundEnabled={progress.soundEnabled}
                    reducedMotion={progress.reducedMotion}
                    onToggleSound={() => setSoundEnabled(!progress.soundEnabled)}
                    onToggleReducedMotion={() => setReducedMotion(!progress.reducedMotion)}
                    onResume={handleClosePause}
                    onResetProgress={handleResetProgress}
                    onReturnToTitle={handleReturnToTitle}
                    onFullscreen={toggleFullscreen}
                  />
                )}

              </>
            )}

            {notice && (
              <div className="grp-final-gate-banner" role="status">
                {notice}
              </div>
            )}
          </div>
        </div>
        <div className="grp-console-wordmark">
          <span className="grp-console-nintendo">Nintendo</span>
          <span className="grp-console-gbc-logo">
            GAME BOY <span className="grp-gbc-color">COLOR</span>
          </span>
        </div>
        <MobileControls
          onAction={handleMobileAction}
          onBack={handleMobileBack}
          onMenu={handleOpenPause}
          onMute={() => setSoundEnabled(!progress.soundEnabled)}
          muted={!progress.soundEnabled}
        />
      </div>
    </div>
  );
}
