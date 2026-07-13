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
import QuickAccessOverlay from "../components/QuickAccessOverlay";
import ControlsTutorialOverlay from "../components/ControlsTutorialOverlay";
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

const IDLE_HINT_MS = 20_000;
const IDLE_HINT = "Try walking with the D-pad to explore — the Professor's lab is a good place to start!";

export default function PublicGameRoute() {
  const {
    progress,
    setTrainerName,
    markIntroStarted,
    markControlsTutorialSeen,
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
  const [quickAccessOpen, setQuickAccessOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [gameMountKey, setGameMountKey] = useState(0);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  // Any of these being true means a menu/overlay owns input right now, so
  // the top-level GBC handlers below should defer to that overlay's own
  // useGbcScope instead of falling back to map movement/interaction.
  const anyOverlayOpen = Boolean(
    activeDialogue || activeMinigame || gateScreenOpen || finalRevealActive || paused || quickAccessOpen || tutorialOpen,
  );
  const overlayOpenRef = useRef(anyOverlayOpen);
  overlayOpenRef.current = anyOverlayOpen;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const screenRef = useRef(screen);
  screenRef.current = screen;

  function showNotice(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3200);
  }

  useEffect(() => {
    let cancelled = false;
    revealProvider
      .getStatus()
      .then((result) => {
        if (!cancelled) setRevealStatus(result.locked ? "ready" : "not-set");
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
      showNotice("The ground trembles — the Ancient Temple has awoken!");
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

  // Shows the "How to Play" overlay for returning players (an existing save
  // that already got past the professor's intro) who haven't seen it yet.
  // Brand-new players get it chained after the professor's intro dialogue
  // instead (see handleDialogueClose) so it never races with that Phaser-
  // triggered auto-intro for focus. Never shows again once dismissed
  // (persisted in progress), but stays reachable via Select.
  useEffect(() => {
    if (screen === "game" && progress.hasStartedIntro && !progress.hasSeenControlsTutorial) {
      gameEvents.emit(GameEvent.LockMovement);
      setTutorialOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Gently nudges players who haven't taken any action for a while — the
  // adventure should never leave anyone feeling lost or stuck.
  useEffect(() => {
    if (screen !== "game") return;
    let timeoutId: number;
    function scheduleHint() {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        if (screenRef.current === "game" && !overlayOpenRef.current) {
          showNotice(IDLE_HINT);
        }
        scheduleHint();
      }, IDLE_HINT_MS);
    }
    function onActivity() {
      scheduleHint();
    }
    gameEvents.on(GameEvent.Footstep, onActivity);
    gameEvents.on(GameEvent.Interact, onActivity);
    scheduleHint();
    return () => {
      window.clearTimeout(timeoutId);
      gameEvents.off(GameEvent.Footstep, onActivity);
      gameEvents.off(GameEvent.Interact, onActivity);
    };
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

  // Top-level GBC handling: A/B fall back to map interaction only when no
  // overlay's own useGbcScope is already consuming the press. Start opens
  // or resumes the pause menu; Select opens the quick-access clue tracker.
  // Both are permanent, screen-wide listeners (unlike overlay scopes,
  // which mount/unmount with their overlay).
  useEffect(() => {
    function onConfirm() {
      if (screenRef.current !== "game" || overlayOpenRef.current) return;
      gameEvents.emit(GameEvent.RemoteAction);
    }
    function onCancel() {
      if (screenRef.current !== "game" || overlayOpenRef.current) return;
      // Nothing to back out of on the bare map.
    }
    function onStart() {
      if (screenRef.current !== "game") return;
      if (pausedRef.current) {
        handleClosePause();
      } else if (!overlayOpenRef.current) {
        handleOpenPause();
      }
    }
    function onSelect() {
      if (screenRef.current !== "game") return;
      if (quickAccessOpen) {
        setQuickAccessOpen(false);
      } else if (!overlayOpenRef.current) {
        setQuickAccessOpen(true);
      }
    }
    gameEvents.on(GameEvent.GbcConfirm, onConfirm);
    gameEvents.on(GameEvent.GbcCancel, onCancel);
    gameEvents.on(GameEvent.GbcStart, onStart);
    gameEvents.on(GameEvent.GbcSelect, onSelect);
    return () => {
      gameEvents.off(GameEvent.GbcConfirm, onConfirm);
      gameEvents.off(GameEvent.GbcCancel, onCancel);
      gameEvents.off(GameEvent.GbcStart, onStart);
      gameEvents.off(GameEvent.GbcSelect, onSelect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAccessOpen]);

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

    const wasFirstIntro = payload.kind === "professor" && !progress.hasStartedIntro;
    if (wasFirstIntro) {
      markIntroStarted();
    }

    if (payload.kind === "pokemon" && payload.pokemonId && !isChallengeComplete(payload.pokemonId)) {
      setActiveMinigame(payload.pokemonId);
      return;
    }

    if (wasFirstIntro && !progress.hasSeenControlsTutorial) {
      setTutorialOpen(true);
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
      const sealed = await revealProvider.getRevealValue();
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

  function handleCloseTutorial() {
    markControlsTutorialSeen();
    setTutorialOpen(false);
    gameEvents.emit(GameEvent.UnlockMovement);
  }

  function handleOpenHelpFromQuickAccess() {
    setQuickAccessOpen(false);
    setTutorialOpen(true);
  }

  function handleOpenPause() {
    if (overlayOpenRef.current) return;
    gameEvents.emit(GameEvent.LockMovement);
    setPaused(true);
  }

  function handleClosePause() {
    gameEvents.emit(GameEvent.UnlockMovement);
    setPaused(false);
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

                {quickAccessOpen && !finalRevealActive && (
                  <QuickAccessOverlay
                    collectedClues={progress.collectedClues}
                    soundEnabled={progress.soundEnabled}
                    onToggleSound={() => setSoundEnabled(!progress.soundEnabled)}
                    onClose={() => setQuickAccessOpen(false)}
                    onOpenHelp={handleOpenHelpFromQuickAccess}
                  />
                )}

                {tutorialOpen && !finalRevealActive && <ControlsTutorialOverlay onClose={handleCloseTutorial} />}
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
          onConfirm={() => gameEvents.emit(GameEvent.GbcConfirm)}
          onCancel={() => gameEvents.emit(GameEvent.GbcCancel)}
          onStart={() => gameEvents.emit(GameEvent.GbcStart)}
          onSelect={() => gameEvents.emit(GameEvent.GbcSelect)}
        />
      </div>
    </div>
  );
}
