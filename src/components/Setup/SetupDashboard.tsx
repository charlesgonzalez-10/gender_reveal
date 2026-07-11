import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { revealProvider } from "../../providers";
import { sealedTokenFor, type RevealWord } from "../../providers/revealMapping";
import { checkAdminPin } from "../../providers/adminAuth";
import FinalRevealSequence from "../FinalReveal/FinalRevealSequence";

type LockStatus = "loading" | "unlocked" | "locked" | "error";
type SecondaryAction = "change" | "reset" | null;

export default function SetupDashboard() {
  const [status, setStatus] = useState<LockStatus>("loading");
  const [selection, setSelection] = useState<RevealWord | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [secondaryAction, setSecondaryAction] = useState<SecondaryAction>(null);
  const [secondaryPin, setSecondaryPin] = useState("");
  const [secondaryError, setSecondaryError] = useState<string | null>(null);
  const [previewWord, setPreviewWord] = useState<RevealWord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const isSet = await revealProvider.hasRevealBeenSet();
      setStatus(isSet ? "locked" : "unlocked");
    } catch {
      setStatus("error");
      setErrorMessage("Unable to read the stored reveal. Browser storage may be unavailable.");
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  function beginSelection(word: RevealWord) {
    setSelection(word);
    setConfirming(true);
    setSuccessMessage(null);
  }

  function cancelSelection() {
    setSelection(null);
    setConfirming(false);
  }

  async function lockReveal() {
    if (!selection) return;
    try {
      await revealProvider.saveReveal(sealedTokenFor(selection));
      setConfirming(false);
      setSelection(null);
      setSuccessMessage("The reveal has been securely set. The adventure is ready!");
      await refreshStatus();
    } catch {
      setErrorMessage("Something went wrong while saving. Please try again.");
    }
  }

  function requestSecondary(action: SecondaryAction) {
    setSecondaryAction(action);
    setSecondaryPin("");
    setSecondaryError(null);
  }

  async function confirmSecondary() {
    if (!checkAdminPin(secondaryPin)) {
      setSecondaryError("Incorrect PIN.");
      return;
    }
    if (secondaryAction === "reset") {
      await revealProvider.resetReveal();
      setSuccessMessage(null);
      await refreshStatus();
    } else if (secondaryAction === "change") {
      // Allow re-selecting; underlying value stays until a new one is locked.
      setStatus("unlocked");
      setSuccessMessage(null);
    }
    setSecondaryAction(null);
    setSecondaryPin("");
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
          <p className="grp-setup-hint">Once locked, the game will not show this value anywhere until the final reveal sequence.</p>
          <div className="grp-setup-actions">
            <button type="button" className="grp-btn grp-btn--primary" onClick={lockReveal}>
              Lock Reveal
            </button>
            <button type="button" className="grp-btn" onClick={cancelSelection}>
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
          <p>Re-enter the admin PIN to {secondaryAction === "reset" ? "reset" : "change"} the reveal.</p>
          <input
            type="password"
            className="grp-setup-input"
            value={secondaryPin}
            onChange={(e) => setSecondaryPin(e.target.value)}
            autoFocus
            aria-label="Admin PIN"
          />
          {secondaryError && (
            <p role="alert" className="grp-setup-error">
              {secondaryError}
            </p>
          )}
          <div className="grp-setup-actions">
            <button type="button" className="grp-btn grp-btn--primary" onClick={confirmSecondary}>
              Confirm
            </button>
            <button type="button" className="grp-btn" onClick={() => setSecondaryAction(null)}>
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
