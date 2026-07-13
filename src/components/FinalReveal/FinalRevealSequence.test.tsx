import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import FinalRevealSequence from "./FinalRevealSequence";

/** Chained setTimeout -> setState -> re-render -> new setTimeout sequences
 * (like the countdown) need the fake-timer clock nudged forward in small
 * steps rather than one big jump, so each link in the chain gets a chance
 * to schedule the next one. */
async function advanceUntil(matcher: () => boolean, stepMs = 60, maxSteps = 200) {
  for (let i = 0; i < maxSteps; i++) {
    if (matcher()) return;
    await vi.advanceTimersByTimeAsync(stepMs);
  }
  throw new Error("advanceUntil: condition never became true");
}

describe("FinalRevealSequence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("advances clues -> countdown -> two paths -> shaking -> flash -> result without crashing", async () => {
    render(<FinalRevealSequence resultWord="boy" reducedMotion onReturnToTitle={() => {}} onReplayAdventure={() => {}} />);

    expect(screen.getByText(/gather around the pedestal/i)).toBeInTheDocument();

    await advanceUntil(() => screen.queryByText(/one path has been chosen/i) !== null);
    expect(screen.getByText(/one path has been chosen/i)).toBeInTheDocument();

    await advanceUntil(() => screen.queryByLabelText(/the glowing egg/i) !== null);
    expect(screen.getByLabelText(/the glowing egg/i)).toBeInTheDocument();

    await advanceUntil(() => screen.queryByText(/it's a boy/i) !== null);
    expect(screen.getByText(/it's a boy/i)).toBeInTheDocument();
  });

  it("tints the surviving path to match the result (boy = path A, girl = path B)", async () => {
    const { container, rerender } = render(
      <FinalRevealSequence resultWord="boy" reducedMotion onReturnToTitle={() => {}} onReplayAdventure={() => {}} />,
    );
    await advanceUntil(() => container.querySelector(".grp-reveal-paths") !== null);
    expect(container.querySelector(".grp-path-chosen.grp-path-a")).not.toBeNull();
    expect(container.querySelector(".grp-path-chosen.grp-path-b")).toBeNull();

    // Still on the "paths" stage (its own timeout hasn't fired yet) — the
    // chosen path should flip immediately to match the new prop.
    rerender(<FinalRevealSequence resultWord="girl" reducedMotion onReturnToTitle={() => {}} onReplayAdventure={() => {}} />);
    expect(container.querySelector(".grp-path-chosen.grp-path-b")).not.toBeNull();
    expect(container.querySelector(".grp-path-chosen.grp-path-a")).toBeNull();
  });
});
