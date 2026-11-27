import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import type { FigureMetier } from '../../lib/types';

const delay = (seconds: number) => ({ '--delay': `${seconds}s` }) as CSSProperties;

const BARS = [34, 52, 44, 70, 62, 88];

function Chart() {
  const points = BARS.map((height, index) => `${30 + index * 42},${90 - height}`).join(' ');
  return (
    <>
      {BARS.map((height, index) => (
        <rect
          key={index}
          className="fig-bar"
          style={delay(0.1 + index * 0.08)}
          x={18 + index * 42}
          y={100 - height}
          width={24}
          height={height}
          rx={5}
          fill={index === BARS.length - 1 ? 'var(--m)' : 'var(--m-soft)'}
        />
      ))}
      <polyline
        className="fig-draw"
        points={points}
        fill="none"
        stroke="var(--m-2)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {BARS.map((height, index) => (
        <circle
          key={index}
          className="fig-pop"
          style={delay(1 + index * 0.1)}
          cx={30 + index * 42}
          cy={90 - height}
          r={3.5}
          fill="var(--m-2)"
        />
      ))}
      <line x1={8} y1={100.5} x2={272} y2={100.5} stroke="var(--color-border)" />
    </>
  );
}

function Pipeline() {
  const { t } = useTranslation();
  const labels = [t('figure.sources'), t('figure.transform'), t('figure.warehouse')];
  return (
    <>
      <path
        className="fig-draw"
        d="M62 46 H118 M162 46 H218"
        stroke="var(--m-2)"
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <g className="fig-pop" style={delay(0.1)}>
        {[0, 1, 2].map((row) => (
          <rect
            key={row}
            x={24}
            y={30 + row * 11}
            width={32}
            height={8}
            rx={3}
            fill={row === 0 ? 'var(--m)' : 'var(--m-soft)'}
          />
        ))}
      </g>
      <g className="fig-pop" style={delay(0.45)}>
        <circle cx={140} cy={46} r={18} fill="var(--m-soft)" />
        <path d="M132 46 h16 M140 38 v16" stroke="var(--m)" strokeWidth={3} strokeLinecap="round" />
      </g>
      <g className="fig-pop" style={delay(0.8)}>
        <path d="M222 32 v28 a18 6 0 0 0 36 0 v-28" fill="var(--m-soft)" />
        <ellipse cx={240} cy={32} rx={18} ry={6} fill="var(--m)" />
      </g>
      {labels.map((label, index) => (
        <text
          key={label}
          className="fig-in"
          style={delay(0.3 + index * 0.35)}
          x={40 + index * 100}
          y={90}
          textAnchor="middle"
          fontSize={12}
          fontWeight={600}
          fill="var(--color-muted)"
        >
          {label}
        </text>
      ))}
    </>
  );
}

function AppWindow() {
  const blocks = [
    { x: 76, y: 32, w: 186, h: 14 },
    { x: 76, y: 52, w: 88, h: 38 },
    { x: 172, y: 52, w: 90, h: 38 },
  ];
  return (
    <>
      <rect
        x={10}
        y={6}
        width={260}
        height={92}
        rx={9}
        fill="var(--color-surface)"
        stroke="var(--color-border)"
      />
      <path d="M10 24 H270" stroke="var(--color-border)" />
      {[0, 1, 2].map((dot) => (
        <circle
          key={dot}
          cx={22 + dot * 10}
          cy={15}
          r={3}
          fill={dot === 0 ? 'var(--m)' : 'var(--color-border)'}
        />
      ))}
      <rect
        className="fig-in"
        style={delay(0.15)}
        x={18}
        y={32}
        width={50}
        height={58}
        rx={5}
        fill="var(--m-soft)"
      />
      {blocks.map((block, index) => (
        <rect
          key={index}
          className="fig-in"
          style={delay(0.3 + index * 0.15)}
          x={block.x}
          y={block.y}
          width={block.w}
          height={block.h}
          rx={5}
          fill={index === 0 ? 'var(--color-bg)' : 'var(--m-soft)'}
          stroke="var(--color-border)"
        />
      ))}
      <rect
        className="fig-in"
        style={delay(0.8)}
        x={84}
        y={60}
        width={40}
        height={6}
        rx={3}
        fill="var(--m)"
      />
      <path
        className="fig-draw"
        d="M180 84 L198 74 L214 78 L232 62 L252 66"
        fill="none"
        stroke="var(--m)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

const FIGURES = { graphique: Chart, pipeline: Pipeline, application: AppWindow };

/**
 * Petite illustration animée d'un métier (graphique, pipeline ou application).
 * Ses couleurs viennent de la classe metier-* d'un parent ; elle s'anime quand ce
 * parent reçoit `is-shown` (voir Reveal).
 */
export function MetierFigure({ figure }: { figure: FigureMetier }) {
  const Drawing = FIGURES[figure];
  return (
    <div className="border-border bg-bg rounded-xl border p-3 leading-none" aria-hidden="true">
      <svg viewBox="0 0 280 104" className="h-24 w-full" preserveAspectRatio="xMidYMid meet">
        <Drawing />
      </svg>
    </div>
  );
}
