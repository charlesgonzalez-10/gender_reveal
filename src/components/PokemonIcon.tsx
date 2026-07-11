import type { PokemonId } from "../types/gameState";

/**
 * Original, simple geometric monster icons — NOT reproductions of any
 * copyrighted character design. Each is a rounded body + sparkly eyes +
 * one themed accessory, in a flat color tied to the Pokémon's classic
 * elemental theme (not to gender). Mirrors the style of the in-game
 * Phaser sprites in src/game/systems/textures.ts.
 */
const PALETTE: Record<PokemonId, { body: string; accent: string }> = {
  bulbasaur: { body: "#5fb87a", accent: "#2f7a49" },
  charmander: { body: "#ef8a52", accent: "#c14f21" },
  squirtle: { body: "#5bb8d6", accent: "#276d85" },
  pikachu: { body: "#f6d24c", accent: "#c98a1c" },
};

interface PokemonIconProps {
  id: PokemonId;
  size?: number;
  className?: string;
  animated?: boolean;
}

export default function PokemonIcon({ id, size = 64, className, animated = false }: PokemonIconProps) {
  const { body, accent } = PALETTE[id];
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`${id.charAt(0).toUpperCase()}${id.slice(1)} — original placeholder icon`}
    >
      <ellipse cx="32" cy="56" rx="16" ry="4" fill="#000" opacity="0.18" />
      <rect x="9" y="40" width="10" height="10" rx="4" fill={accent} />
      <rect x="45" y="40" width="10" height="10" rx="4" fill={accent} />
      <ellipse cx="32" cy="34" rx="9" ry="6" fill="#fff2d6" />
      <rect x="10" y="20" width="44" height="28" rx="14" fill={body} stroke="#111" strokeWidth="2" />
      <ellipse cx="21" cy="27" rx="7" ry="4" fill="#fff" opacity="0.25" />
      <circle cx="24" cy="34" r="4" fill="#111" />
      <circle cx="40" cy="34" r="4" fill="#111" />
      <circle cx="22.5" cy="32.5" r="1.4" fill="#fff" />
      <circle cx="38.5" cy="32.5" r="1.4" fill="#fff" />
      <ellipse cx="17" cy="38" rx="3" ry="2" fill={accent} opacity="0.4" />
      <ellipse cx="47" cy="38" rx="3" ry="2" fill={accent} opacity="0.4" />
      <rect x="26" y="40" width="12" height="4" rx="2" fill={accent} />

      {id === "bulbasaur" && (
        <g className={animated ? "grp-icon-bob" : undefined}>
          <ellipse cx="32" cy="15" rx="11" ry="8" fill={accent} stroke="#111" strokeWidth="2" />
          <ellipse cx="27" cy="9" rx="3.5" ry="4.5" fill="#3f9c5f" />
          <ellipse cx="37" cy="9" rx="3.5" ry="4.5" fill="#3f9c5f" />
        </g>
      )}
      {id === "charmander" && (
        <g className={animated ? "grp-icon-flicker" : undefined}>
          <circle cx="20" cy="17" r="4" fill={body} stroke="#111" strokeWidth="1.5" />
          <circle cx="44" cy="17" r="4" fill={body} stroke="#111" strokeWidth="1.5" />
          <path
            d="M46 34 C56 26 52 16 44 8 C48 18 40 20 42 28 C38 24 38 18 40 12 C32 20 34 30 46 34 Z"
            fill="#ffb84d"
            stroke="#111"
            strokeWidth="1.5"
          />
          <ellipse cx="46" cy="18" rx="4" ry="6" fill="#ffe08a" opacity="0.85" />
        </g>
      )}
      {id === "squirtle" && (
        <g>
          <ellipse cx="32" cy="14" rx="14" ry="7" fill={accent} stroke="#111" strokeWidth="2" />
          <line x1="26" y1="9" x2="26" y2="19" stroke="#123" strokeWidth="1" opacity="0.5" />
          <line x1="38" y1="9" x2="38" y2="19" stroke="#123" strokeWidth="1" opacity="0.5" />
        </g>
      )}
      {id === "pikachu" && (
        <g>
          <rect x="12" y="4" width="9" height="16" rx="4" fill={body} stroke="#111" strokeWidth="1.5" />
          <rect x="43" y="4" width="9" height="16" rx="4" fill={body} stroke="#111" strokeWidth="1.5" />
          <rect x="12" y="4" width="9" height="6" rx="3.5" fill={accent} />
          <rect x="43" y="4" width="9" height="6" rx="3.5" fill={accent} />
          <path d="M52 30 L62 24 L58 38 Z" fill={body} stroke="#111" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}
