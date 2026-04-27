"use client"

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />

      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="net-grid"
            width="64"
            height="64"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(12)"
          >
            <path
              d="M0 0H64 M0 0V64"
              fill="none"
              stroke="oklch(0.533 0.128 252)"
              strokeOpacity="0.24"
              strokeWidth="1"
            />
            <path
              d="M32 0V64 M0 32H64"
              fill="none"
              stroke="oklch(0.433 0.098 250.8)"
              strokeOpacity="0.18"
              strokeWidth="1"
            />
          </pattern>

          <linearGradient id="net-stroke-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.533 0.128 252)" stopOpacity="0.0" />
            <stop offset="35%" stopColor="oklch(0.533 0.128 252)" stopOpacity="0.5" />
            <stop offset="65%" stopColor="oklch(0.6 0.118 240)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.6 0.118 240)" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="net-stroke-2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.433 0.098 250.8)" stopOpacity="0.0" />
            <stop offset="30%" stopColor="oklch(0.433 0.098 250.8)" stopOpacity="0.46" />
            <stop offset="70%" stopColor="oklch(0.533 0.128 252)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="oklch(0.533 0.128 252)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        <g className="net-layer-1">
          <rect width="100%" height="100%" fill="url(#net-grid)" />
        </g>

        <g className="net-layer-2">
          <path
            d="M-200 220 C 120 120, 420 360, 760 260 S 1380 140, 1720 280 S 2240 360, 2600 240"
            fill="none"
            stroke="url(#net-stroke-1)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M-240 520 C 140 420, 520 660, 880 540 S 1520 420, 1880 600 S 2400 700, 2760 520"
            fill="none"
            stroke="url(#net-stroke-2)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M-260 820 C 60 740, 420 960, 780 840 S 1420 700, 1780 880 S 2320 1020, 2700 840"
            fill="none"
            stroke="url(#net-stroke-1)"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>
      </svg>

      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[720px] bg-primary/6 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute -bottom-48 right-0 w-[560px] h-[560px] bg-accent/6 rounded-full blur-3xl animate-pulse-slower" />
    </div>
  )
}
