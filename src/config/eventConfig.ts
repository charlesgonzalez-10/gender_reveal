/**
 * Event configuration.
 *
 * Customize the names, titles, and messaging for your event here.
 * This file must NEVER contain the actual reveal result — the reveal
 * result is only ever entered through the protected /setup screen and
 * stored via the reveal provider (see src/providers).
 */
export const eventConfig = {
  gameTitle: "Pokémon: The Great Gender Reveal",
  parentNames: "Charles & Tiffany",
  babyName: "",
  defaultPlayerName: "Trainer",
  revealSubtitle: "A new little trainer is joining the adventure!",
  requireRevealBeforeStarting: true,
  enableAdminPin: true,
  enableMobileControls: true,
  enableChallenges: true,
  enableSound: true,
  estimatedGameLengthMinutes: 8,
};

export type EventConfig = typeof eventConfig;
