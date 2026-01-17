"use client"

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />

      <svg
        className="absolute inset-0 w-full h-full opacity-30"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.533 0.128 252)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="oklch(0.6 0.118 240)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="oklch(0.533 0.128 252)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="wave-gradient-2" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.433 0.098 250.8)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="oklch(0.533 0.128 252)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="oklch(0.433 0.098 250.8)" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="wave-gradient-3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.6 0.118 240)" stopOpacity="0.15" />
            <stop offset="50%" stopColor="oklch(0.533 0.128 260)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="oklch(0.6 0.118 240)" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <path
          className="wave-path-1"
          d="M0,100 Q250,80 500,100 T1000,100 T1500,100 T2000,100 V200 H0 Z"
          fill="url(#wave-gradient-1)"
        />

        <path
          className="wave-path-2"
          d="M0,150 Q300,130 600,150 T1200,150 T1800,150 T2400,150 V250 H0 Z"
          fill="url(#wave-gradient-2)"
        />

        <path
          className="wave-path-3"
          d="M0,200 Q200,170 400,200 T800,200 T1200,200 T1600,200 V300 H0 Z"
          fill="url(#wave-gradient-3)"
        />
      </svg>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-pulse-slower" />
    </div>
  )
}
