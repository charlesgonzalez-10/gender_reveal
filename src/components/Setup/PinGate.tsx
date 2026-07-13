import { useState, type FormEvent } from "react";
import { verifyAdminPin } from "../../providers/adminAuth";

interface PinGateProps {
  title?: string;
  description?: string;
  onVerified: () => void;
  onCancel?: () => void;
}

export default function PinGate({ title = "Admin PIN Required", description, onVerified, onCancel }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [usingDefaultPin, setUsingDefaultPin] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await verifyAdminPin(pin);
    setSubmitting(false);
    if (result.ok) {
      setUsingDefaultPin(Boolean(result.usingDefaultPin));
      onVerified();
    } else {
      setAttempts((a) => a + 1);
      setError(result.error || "Incorrect PIN. Please try again.");
      setRetryAfterSeconds(result.retryAfterSeconds ?? null);
      setPin("");
    }
  }

  return (
    <div className="grp-setup-card grp-pixel-panel">
      <h2>{title}</h2>
      {description && <p className="grp-setup-copy">{description}</p>}
      <form onSubmit={handleSubmit} className="grp-setup-form">
        <label htmlFor="admin-pin" className="grp-setup-label">
          Enter Admin PIN
        </label>
        <input
          id="admin-pin"
          type="password"
          inputMode="text"
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="grp-setup-input"
          aria-describedby={error ? "pin-error" : undefined}
          aria-invalid={Boolean(error)}
          autoFocus
          disabled={submitting}
        />
        {error && (
          <p id="pin-error" role="alert" className="grp-setup-error">
            {error}
            {retryAfterSeconds ? ` Try again in about ${retryAfterSeconds}s.` : ""}
          </p>
        )}
        {attempts >= 3 && (
          <p className="grp-setup-hint">
            Having trouble? The PIN is set by the event organizer via the server-only <code>ADMIN_PIN</code>{" "}
            environment variable.
          </p>
        )}
        {usingDefaultPin && (
          <p role="alert" className="grp-setup-warning">
            Warning: no custom admin PIN is configured on the server. Set ADMIN_PIN before your event.
          </p>
        )}
        <div className="grp-setup-actions">
          <button type="submit" className="grp-btn grp-btn--primary" disabled={submitting || pin.length === 0}>
            {submitting ? "Checking…" : "Unlock Setup"}
          </button>
          {onCancel && (
            <button type="button" className="grp-btn" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
