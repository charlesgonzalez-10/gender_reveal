import type { ClueId } from "../types/gameState";

const CLUE_META: Record<ClueId, { color: string; label: string }> = {
  leaf: { color: "#4caf6d", label: "Leaf Clue" },
  flame: { color: "#ff8a3d", label: "Flame Clue" },
  water: { color: "#4dd0e1", label: "Water Clue" },
  lightning: { color: "#ffd54f", label: "Lightning Clue" },
};

interface ClueIconProps {
  id: ClueId;
  size?: number;
  collected?: boolean;
  className?: string;
}

export default function ClueIcon({ id, size = 32, collected = true, className }: ClueIconProps) {
  const { color, label } = CLUE_META[id];
  const fill = collected ? color : "#3a3a4d";
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={collected ? `${label} — collected` : `${label} — not yet collected`}
    >
      {id === "leaf" && <path d="M16 4 C26 8 26 20 16 28 C6 20 6 8 16 4 Z" fill={fill} stroke="#111" strokeWidth="1.5" />}
      {id === "flame" && (
        <path
          d="M16 4 C20 10 24 12 22 18 C24 18 26 16 26 16 C27 22 22 28 16 28 C10 28 5 23 6 17 C7 20 9 20 9 20 C7 14 10 8 16 4 Z"
          fill={fill}
          stroke="#111"
          strokeWidth="1.5"
        />
      )}
      {id === "water" && <path d="M16 4 C22 14 24 18 24 22 A8 8 0 0 1 8 22 C8 18 10 14 16 4 Z" fill={fill} stroke="#111" strokeWidth="1.5" />}
      {id === "lightning" && <path d="M18 3 L8 18 H14 L12 29 L26 12 H18 Z" fill={fill} stroke="#111" strokeWidth="1.5" />}
      {!collected && <circle cx="16" cy="16" r="14" fill="none" stroke="#555" strokeDasharray="3 3" />}
    </svg>
  );
}
