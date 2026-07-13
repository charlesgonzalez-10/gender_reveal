import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { revealProvider } from "../../providers";
import { sealedTokenFor, type RevealWord } from "../../providers/revealMapping";
import { getAdminToken, verifyAdminPin } from "../../providers/adminAuth";
import FinalRevealSequence from "../FinalReveal/FinalRevealSequence";

type LockStatus = "loading" | "unlocked" | "locked" | "error";
type SecondaryAction = "change" | "reset" | null;

export default function SetupDashboard() {
  const [status, setStatus] = useState<LockStatus>("loading");
  const [selection, setSelection] = useState<RevealWord | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [secondaryAction, setSecondaryAction] = useState<SecondaryAction>(null);
  const [secondaryPin, setSecondaryPin] = useState("");
  const [secondaryError, setSecondaryError] = useState<string | null>(null);
  const [secondaryBusy, setSecondaryBusy] = useState(false);
  const [previewWord, setPreviewWord] = useState<RevealWord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const result = await revealProvider.getStatus();
      setStatus(result.locked ? "locked" : "unlocked");
    } catch {
      setStatus("error");
      setErrorMessage("Unable to reach the shared reveal storage. Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  function beginSelection(word: RevealWord) {
    setSelection(word);
    setConfirming(true);
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  function cancelSelection() {
    setSelection(null);
    setConfirming(false);
  }

  async function lockReveal() {
    if (!selection || saving) return;
    const token = getAdminToken();
    if (!token) {
      setErrorMessage("Your admin session has expired. Please reload and re-enter the PIN.");
      return;
    }
    setSaving(true);
    setErrorMessage(null);
    const result = await revealProvider.setReveal(sealedTokenFor(selection), token);
    setSaving(false);
    if (result.ok) {
      setConfirming(false);
      setSelection(null);
      setSuccessMessage("The reveal has been securely set. The adventure is ready!");
      await refreshStatus();
    } else {
      setErrorMessage(result.error || "Something went wrong while saving. Please try again.");
      // The reveal may have just been locked by another device — reflect that.
      await refreshStatus();
    }
  }

  function requestSecondary(action: SecondaryAction) {
    setSecondaryAction(action);
    setSecondaryPin("");
    setSecondaryError(null);
  }

  async function confirmSecondary() {
    if (secondaryBusy) return;
    setSecondaryBusy(true);
    setSecondaryError(null);
    const verified = await verifyAdminPin(secondaryPin);
    if (!verified.ok) {
      setSecondaryBusy(false);
      setSecondaryError(verified.error || "Incorrect PIN.");
      return;
    }
    const token = getAdminToken();
    if (!token) {
      setSecondaryBusy(false);
      setSecondaryError("Could not verify your session. Please try again.");
      return;
    }
    const result = await revealProvider.resetReveal(token);
    setSecondaryBusy(false);
    if (!result.ok) {
      setSecondaryError(result.error || "Unable to reset the reveal. Please try again.");
      return;
    }
    setSuccessMessage(null);
    setSecondaryAction(null);
    setSecondaryPin("");
    await refreshStatus();
  }

  if (previewWord) {
    return (
      <div className="grp-setup-preview-wrap">
        <FinalRevealSequence resultWord={previewWord} isPreview reducedMotion={false} onExitPreview={() => setPreviewWord(null)} />
      </div>
    );
  }

  return (
    <div className="grp-setup-card grp-pixel-panel grp-setup-dashboard">
      <h2>Reveal Setup</h2>

      {status === "loading" && <p>Checking current status…</p>}

      {status === "error" && <p role="alert" className="grp-setup-error">{errorMessage}</p>}

      {status !== "loading" && (
        <p className="grp-setup-status" aria-live="polite">
          Status:{" "}
          <strong className={status === "locked" ? "grp-status-locked" : "grp-status-unlocked"}>
            {status === "locked" ? "LOCKED — the adventure is ready" : "NOT SET"}
          </strong>
        </p>
      )}

      {status === "unlocked" && (
        <p role="alert" className="grp-setup-warning">
          Warning: no reveal result has been set. The public game will not let anyone start until this is locked.
        </p>
      )}

      {successMessage && (
        <p role="status" className="grp-setup-success">
          {successMessage}
        </p>
      )}

      {errorMessage && status !== "error" && (
        <p role="alert" className="grp-setup-error">
          {errorMessage}
        </p>
      )}

      {status === "unlocked" && !confirming && (
        <div className="grp-setup-selection">
          <p className="grp-setup-copy">Select the result to lock in. This should only be done by a trusted person.</p>
          <div className="grp-setup-actions">
            <button type="button" className="grp-btn" onClick={() => beginSelection("boy")}>
              Boy
            </button>
            <button type="button" className="grp-btn" onClick={() => beginSelection("girl")}>
              Girl
            </button>
          </div>
        </div>
      )}

      {confirming && selection && (
        <div className="grp-setup-confirm" role="alertdialog" aria-label="Confirm reveal selection">
          <p>
            You selected <strong>{selection.toUpperCase()}</strong>. Are you sure you want to lock this reveal?
          </p>
          <p className="grp-setup-hint">
            Once locked, every device will share this exact result — it will not show anywhere until the final reveal
            sequence, and it cannot be changed without the admin PIN.
          </p>
          <div className="grp-setup-actions">
            <button type="button" className="grp-btn grp-btn--primary" onClick={lockReveal} disabled={saving}>
              {saving ? "Locking…" : "Lock Reveal"}
            </button>
            <button type="button" className="grp-btn" onClick={cancelSelection} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {status === "locked" && (
        <div className="grp-setup-actions">
          <button type="button" className="grp-btn" onClick={() => requestSecondary("change")}>
            Change Selection
          </button>
          <button type="button" className="grp-btn grp-btn--danger" onClick={() => requestSecondary("reset")}>
            Reset Reveal
          </button>
        </div>
      )}

      {secondaryAction && (
        <div className="grp-setup-confirm" role="alertdialog" aria-label="Re-enter admin PIN">
          <p>
            Re-enter the admin PIN to {secondaryAction === "reset" ? "reset" : "change"} the reveal.
            {secondaryAction === "change" && " This will clear the locked result so you can pick again."}
          </p>
          <input
            type="password"
            className="grp-setup-input"
            value={secondaryPin}
            onChange={(e) => setSecondaryPin(e.target.value)}
            autoFocus
            aria-label="Admin PIN"
            disabled={secondaryBusy}
          />
          {secondaryError && (
            <p role="alert" className="grp-setup-error">
              {secondaryError}
            </p>
          )}
          <div className="grp-setup-actions">
            <button type="button" className="grp-btn grp-btn--primary" onClick={confirmSecondary} disabled={secondaryBusy}>
              {secondaryBusy ? "Checking…" : "Confirm"}
            </button>
            <button type="button" className="grp-btn" onClick={() => setSecondaryAction(null)} disabled={secondaryBusy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <hr className="grp-setup-divider" />

      <section aria-labelledby="preview-heading">
        <h3 id="preview-heading">Preview Mode</h3>
        <p className="grp-setup-copy">
          Preview either ending's animation and styling without changing or exposing the real saved result.
        </p>
        <div className="grp-setup-actions">
          <button type="button" className="grp-btn" onClick={() => setPreviewWord("boy")}>
            Preview: Boy Ending
          </button>
          <button type="button" className="grp-btn" onClick={() => setPreviewWord("girl")}>
            Preview: Girl Ending
          </button>
        </div>
      </section>

      <hr className="grp-setup-divider" />

      <Link to="/" className="grp-btn grp-btn--primary grp-setup-start-link">
        Start Game
      </Link>
    </div>
  );
}
