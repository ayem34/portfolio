import type { CSSProperties } from 'react';

/** Trois courbes aux couleurs des métiers ; un point lumineux glisse lentement sur chacune. */
const LINES = [
  {
    d: 'M-40 380 C 260 300, 420 470, 700 360 S 1120 180, 1420 260',
    color: '#ff7a59',
    delay: 0,
    duration: 11,
  },
  {
    d: 'M-40 440 C 300 420, 520 260, 820 300 S 1200 420, 1420 330',
    color: '#4f9df0',
    delay: 0.3,
    duration: 14,
  },
  {
    d: 'M-40 300 C 200 360, 480 220, 760 250 S 1150 120, 1420 160',
    color: '#3fbf7f',
    delay: 0.6,
    duration: 17,
  },
];

interface HeroBackdropProps {
  /** Identifiant unique dans la page (les courbes sont référencées par id). */
  id: string;
  /** Couleur du halo principal (haut droite). */
  glow?: string;
}

/**
 * Décor des zones sombres : courbes qui se tracent puis points qui circulent, et deux halos
 * qui dérivent. Purement décoratif (aria-hidden) ; coupé si le visiteur réduit les animations.
 */
export function HeroBackdrop({ id, glow = '#ff7a59' }: HeroBackdropProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="glow -top-40 -right-16 size-[30rem] opacity-40"
        style={{ '--glow-color': glow } as CSSProperties}
      />
      <div
        className="glow -bottom-48 -left-20 size-[26rem] opacity-25"
        style={{ '--glow-color': '#8a3ffc', animationDelay: '-6s' } as CSSProperties}
      />
      <svg
        viewBox="0 0 1366 520"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {LINES.map((line, index) => (
          <g key={line.color}>
            <path
              id={`${id}-${index}`}
              className="flow-line"
              style={{ '--delay': `${line.delay}s` } as CSSProperties}
              d={line.d}
              fill="none"
              stroke={line.color}
              strokeOpacity={0.28}
              strokeWidth={1.6}
            />
            <circle className="flow-dot" r={3.5} fill={line.color} opacity={0}>
              <animate
                attributeName="opacity"
                from="0"
                to="0.9"
                begin={`${2.6 + line.delay}s`}
                dur="0.6s"
                fill="freeze"
              />
              <animateMotion
                dur={`${line.duration}s`}
                begin={`${2.6 + line.delay}s`}
                repeatCount="indefinite"
              >
                <mpath href={`#${id}-${index}`} />
              </animateMotion>
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
