/**
 * Client-side admin PIN check for the /setup screen.
 *
 * IMPORTANT SECURITY LIMITATION: This PIN is bundled into the client
 * JavaScript at build time (via Vite's VITE_ prefixed env vars) and
 * verified in the browser. Anyone who can view the built JS bundle can
 * recover it. This is acceptable for a private family event where the
 * goal is to keep casual guests from stumbling into /setup, but it is
 * NOT real security. See README "Security limitations" for details and
 * how to move PIN verification server-side later.
 */
const DEFAULT_PIN_WARNING = "change-this-pin";

export function getAdminPin(): string {
  const pin = import.meta.env.VITE_ADMIN_PIN;
  if (!pin || pin === DEFAULT_PIN_WARNING) {
    // Still return whatever is configured so the app functions, but
    // callers can use isUsingDefaultPin() to warn the organizer.
    return pin ?? DEFAULT_PIN_WARNING;
  }
  return pin;
}

export function isUsingDefaultPin(): boolean {
  const pin = import.meta.env.VITE_ADMIN_PIN;
  return !pin || pin === DEFAULT_PIN_WARNING;
}

export function checkAdminPin(candidate: string): boolean {
  return candidate.length > 0 && candidate === getAdminPin();
}

const SESSION_KEY = "grp_admin_session_v1";

export function markAdminSessionVerified(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // ignore — session persistence is a convenience, not a requirement
  }
}

export function isAdminSessionVerified(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function clearAdminSession(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
