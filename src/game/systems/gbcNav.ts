/**
 * Generic, DOM-geometry-based focus navigation. Every dialogue box,
 * minigame, menu, and confirmation screen in this app is already built out
 * of plain semantic <button> elements, so a single direction-aware
 * "nearest neighbor" search over getBoundingClientRect() covers all of
 * them without any bespoke per-screen keyboard-nav code. Consumers mark a
 * container as a nav scope and call these helpers from useGbcScope.
 */
export type NavDirection = "up" | "down" | "left" | "right";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[data-gbc-focusable]",
].join(", ");

function isVisible(el: HTMLElement): boolean {
  if (el.hasAttribute("data-gbc-ignore")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden";
}

export function getFocusableElements(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

export function focusDefault(root: ParentNode): void {
  const explicit = root.querySelector<HTMLElement>("[data-gbc-default]");
  if (explicit && isVisible(explicit)) {
    explicit.focus();
    return;
  }
  getFocusableElements(root)[0]?.focus();
}

/**
 * Moves focus from the currently-focused element (if it's inside root) to
 * the nearest neighbor in the given direction, using each button's center
 * point. Falls back to cycling through the list in DOM order for up/down
 * when nothing lies strictly in that direction, so simple vertical button
 * stacks always wrap sensibly.
 */
export function moveFocus(root: ParentNode, direction: NavDirection): void {
  const all = getFocusableElements(root);
  if (all.length === 0) return;

  const active = document.activeElement as HTMLElement | null;
  const current = active && all.includes(active) ? active : null;
  if (!current) {
    all[0].focus();
    return;
  }

  const currentRect = current.getBoundingClientRect();
  const cx = currentRect.left + currentRect.width / 2;
  const cy = currentRect.top + currentRect.height / 2;

  let best: HTMLElement | null = null;
  let bestScore = Infinity;

  for (const el of all) {
    if (el === current) continue;
    const rect = el.getBoundingClientRect();
    const ex = rect.left + rect.width / 2;
    const ey = rect.top + rect.height / 2;
    const dx = ex - cx;
    const dy = ey - cy;

    let primary: number;
    let cross: number;
    if (direction === "up") {
      if (dy >= -1) continue;
      primary = -dy;
      cross = Math.abs(dx);
    } else if (direction === "down") {
      if (dy <= 1) continue;
      primary = dy;
      cross = Math.abs(dx);
    } else if (direction === "left") {
      if (dx >= -1) continue;
      primary = -dx;
      cross = Math.abs(dy);
    } else {
      if (dx <= 1) continue;
      primary = dx;
      cross = Math.abs(dy);
    }

    const score = primary + cross * 2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }

  if (!best) {
    const idx = all.indexOf(current);
    if (direction === "up" || direction === "left") {
      best = all[(idx - 1 + all.length) % all.length];
    } else if (direction === "down" || direction === "right") {
      best = all[(idx + 1) % all.length];
    }
  }

  best?.focus();
}

/** Clicks the currently-focused element, if it belongs to root. Returns
 * whether a click was dispatched, so callers can fall back to other
 * behavior (e.g. map interaction) when no scoped element had focus. */
export function activateFocused(root: ParentNode): boolean {
  const active = document.activeElement as HTMLElement | null;
  if (active && root.contains(active) && typeof active.click === "function") {
    active.click();
    return true;
  }
  return false;
}
