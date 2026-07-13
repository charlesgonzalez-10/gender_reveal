import { useEffect, useRef, type RefObject } from "react";
import { gameEvents, GameEvent } from "../sceneEvents";
import { activateFocused, focusDefault, moveFocus } from "./gbcNav";

interface GbcScopeOptions {
  /** B — required for every overlay/menu; called when the player backs out. */
  onBack?: () => void;
  /** Start — defaults to "click the focused element", matching the spec's
   * "Start may also confirm" on menus/confirmation screens. Override only
   * when Start should do something other than confirm in this scope. */
  onStart?: () => void;
  /** Set to false to mount the hook without it being the active input scope
   * (e.g. a screen that's rendered but currently behind another overlay). */
  active?: boolean;
}

/**
 * Turns any overlay/menu's root element into a D-pad + A/B/Start
 * navigable scope: D-pad moves focus between its buttons using DOM
 * geometry, A (GbcConfirm) clicks whatever is focused, B (GbcCancel)
 * calls onBack, and Start (GbcStart) confirms by default. A
 * MutationObserver keeps focus inside the scope as its content changes
 * (e.g. a minigame moving from its instructions to its play phase).
 */
export function useGbcScope(rootRef: RefObject<HTMLElement | null>, options: GbcScopeOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const active = options.active !== false;

  useEffect(() => {
    if (!active) return;
    const root = rootRef.current;
    if (!root) return;

    focusDefault(root);

    const onUp = () => moveFocus(root, "up");
    const onDown = () => moveFocus(root, "down");
    const onLeft = () => moveFocus(root, "left");
    const onRight = () => moveFocus(root, "right");
    const onConfirm = () => activateFocused(root);
    const onCancel = () => optionsRef.current.onBack?.();
    const onStart = () => (optionsRef.current.onStart ?? (() => activateFocused(root)))();

    gameEvents.on(GameEvent.GbcUp, onUp);
    gameEvents.on(GameEvent.GbcDown, onDown);
    gameEvents.on(GameEvent.GbcLeft, onLeft);
    gameEvents.on(GameEvent.GbcRight, onRight);
    gameEvents.on(GameEvent.GbcConfirm, onConfirm);
    gameEvents.on(GameEvent.GbcCancel, onCancel);
    gameEvents.on(GameEvent.GbcStart, onStart);

    const observer = new MutationObserver(() => {
      const activeEl = document.activeElement;
      if (!activeEl || !root.contains(activeEl)) focusDefault(root);
    });
    observer.observe(root, { childList: true, subtree: true });

    return () => {
      gameEvents.off(GameEvent.GbcUp, onUp);
      gameEvents.off(GameEvent.GbcDown, onDown);
      gameEvents.off(GameEvent.GbcLeft, onLeft);
      gameEvents.off(GameEvent.GbcRight, onRight);
      gameEvents.off(GameEvent.GbcConfirm, onConfirm);
      gameEvents.off(GameEvent.GbcCancel, onCancel);
      gameEvents.off(GameEvent.GbcStart, onStart);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootRef, active]);
}
