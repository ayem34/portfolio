import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'info' | 'danger';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border-border text-muted',
  accent: 'border-accent/60 text-accent',
  success: 'border-success/60 text-success',
  warning: 'border-warning/60 text-warning',
  info: 'border-info/60 text-info',
  danger: 'border-danger/60 text-danger',
};

interface BadgeProps {
  tone?: BadgeTone;
  /** Préfixe discret, ex. « Code » dans « Code · Public ». */
  label?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', label, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {label && <span className="text-muted font-normal">{label}</span>}
      {children}
    </span>
  );
}
