/** Champs de formulaire partagés par le site public et l'admin : libellé visible, erreur annoncée. */

import {
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
  useId,
} from 'react';

export interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
}

export function FieldShell({
  id,
  label,
  hint,
  error,
  children,
}: FieldShellProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {hint && <p className="text-muted mt-1 text-sm">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  ...input
}: FieldShellProps & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input id={id} className="field" aria-invalid={Boolean(error)} {...input} />
    </FieldShell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  ...textarea
}: FieldShellProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea id={id} className="field" rows={4} aria-invalid={Boolean(error)} {...textarea} />
    </FieldShell>
  );
}

/**
 * Champ piège anti-robot : invisible, hors tabulation et ignoré des lecteurs d'écran,
 * mais rempli par les robots qui complètent tous les champs. Son libellé n'est donc
 * jamais affiché à un visiteur.
 */
export function Honeypot(input: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="absolute -left-[9999px]" aria-hidden="true">
      <label>
        Site web
        <input type="text" tabIndex={-1} autoComplete="off" {...input} />
      </label>
    </div>
  );
}
