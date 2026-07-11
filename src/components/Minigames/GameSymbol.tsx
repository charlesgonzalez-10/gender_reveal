export type SymbolType = "leaf" | "flower" | "sprout" | "clover" | "acorn" | "mushroom" | "drop" | "wave" | "splash" | "bubble";

const LABELS: Record<SymbolType, string> = {
  leaf: "Leaf symbol",
  flower: "Flower symbol",
  sprout: "Sprout symbol",
  clover: "Clover symbol",
  acorn: "Acorn symbol",
  mushroom: "Mushroom symbol",
  drop: "Water drop symbol",
  wave: "Wave symbol",
  splash: "Splash symbol",
  bubble: "Bubble symbol",
};

interface GameSymbolProps {
  type: SymbolType;
  size?: number;
  className?: string;
}

export default function GameSymbol({ type, size = 32, className }: GameSymbolProps) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} role="img" aria-label={LABELS[type]}>
      {type === "leaf" && <path d="M16 4 C26 8 26 20 16 28 C6 20 6 8 16 4 Z" fill="#4caf6d" stroke="#173" strokeWidth="1.5" />}
      {type === "flower" && (
        <g fill="#ff9fd0" stroke="#a13a70" strokeWidth="1">
          <circle cx="16" cy="10" r="5" />
          <circle cx="16" cy="22" r="5" />
          <circle cx="10" cy="16" r="5" />
          <circle cx="22" cy="16" r="5" />
          <circle cx="16" cy="16" r="4" fill="#ffd54f" stroke="#a17a1c" />
        </g>
      )}
      {type === "sprout" && (
        <g fill="#66bb6a" stroke="#245c28" strokeWidth="1.5">
          <path d="M16 28 V14" stroke="#4a2f1a" />
          <path d="M16 14 C10 14 8 8 8 8 C8 8 12 6 16 12 Z" />
          <path d="M16 14 C22 14 24 8 24 8 C24 8 20 6 16 12 Z" />
        </g>
      )}
      {type === "clover" && (
        <g fill="#4caf6d" stroke="#173" strokeWidth="1">
          <circle cx="12" cy="12" r="5" />
          <circle cx="20" cy="12" r="5" />
          <circle cx="12" cy="20" r="5" />
          <circle cx="20" cy="20" r="5" />
        </g>
      )}
      {type === "acorn" && (
        <g stroke="#5a3a1a" strokeWidth="1.5">
          <ellipse cx="16" cy="20" rx="7" ry="8" fill="#c9973f" />
          <path d="M8 14 Q16 6 24 14 Z" fill="#6b4423" />
        </g>
      )}
      {type === "mushroom" && (
        <g stroke="#5a3a1a" strokeWidth="1.5">
          <path d="M6 14 C6 6 26 6 26 14 Z" fill="#e05a5a" />
          <rect x="12" y="14" width="8" height="10" fill="#f4e6c9" />
        </g>
      )}
      {type === "drop" && <path d="M16 4 C22 14 24 18 24 22 A8 8 0 0 1 8 22 C8 18 10 14 16 4 Z" fill="#4dd0e1" stroke="#0e6e7a" strokeWidth="1.5" />}
      {type === "wave" && (
        <path
          d="M4 18 C8 12 12 22 16 16 C20 10 24 20 28 14"
          fill="none"
          stroke="#4dd0e1"
          strokeWidth="3"
          strokeLinecap="round"
        />
      )}
      {type === "splash" && (
        <g fill="#4dd0e1">
          <circle cx="16" cy="16" r="6" />
          <circle cx="7" cy="10" r="2.5" />
          <circle cx="25" cy="10" r="2.5" />
          <circle cx="7" cy="22" r="2.5" />
          <circle cx="25" cy="22" r="2.5" />
        </g>
      )}
      {type === "bubble" && (
        <g fill="none" stroke="#4dd0e1" strokeWidth="2">
          <circle cx="14" cy="16" r="9" />
          <circle cx="24" cy="8" r="3" />
        </g>
      )}
    </svg>
  );
}
