import type { PokemonId } from "../types/gameState";

/**
 * Original, simple geometric monster icons — NOT reproductions of any
 * copyrighted character design. Each is just a rounded body + dot eyes
 * + one themed accessory, in a flat color tied to the Pokémon's
 * classic elemental theme (not to gender).
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
      shapeRendering="crispEdges"
    >
      <rect x="10" y="22" width="44" height="30" rx="8" fill={body} stroke="#111" strokeWidth="2" />
      <circle cx="24" cy="36" r="3.5" fill="#111" />
      <circle cx="40" cy="36" r="3.5" fill="#111" />
      <rect x="20" y="46" width="24" height="4" rx="2" fill={accent} />
      {id === "bulbasaur" && (
        <g className={animated ? "grp-icon-bob" : undefined}>
          <ellipse cx="32" cy="16" rx="10" ry="8" fill={accent} stroke="#111" strokeWidth="2" />
          <path d="M32 8 L36 16 L28 16 Z" fill="#3f9c5f" />
        </g>
      )}
      {id === "charmander" && (
        <g className={animated ? "grp-icon-flicker" : undefined}>
          <path d="M46 14 C50 20 48 26 44 26 C46 20 42 18 44 12 Z" fill="#ffb84d" stroke="#111" strokeWidth="1.5" />
        </g>
      )}
      {id === "squirtle" && <path d="M14 22 Q32 10 50 22" fill="none" stroke={accent} strokeWidth="4" />}
      {id === "pikachu" && (
        <g>
          <path d="M16 22 L10 8 L22 18 Z" fill={accent} stroke="#111" strokeWidth="1.5" />
          <path d="M48 22 L54 8 L42 18 Z" fill={accent} stroke="#111" strokeWidth="1.5" />
        </g>
      )}
    </svg>
  );
}
