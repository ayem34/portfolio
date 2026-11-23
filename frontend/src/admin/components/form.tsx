/** Briques de formulaire de l'admin. Tous les champs ont un libellé visible. */

import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useId,
} from 'react';
import type { FieldPath, FieldValues, UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { LANGUAGES } from '../../i18n';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
}

function FieldShell({
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

export function TextField({
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

export function TextAreaField({
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

export function SelectField({
  label,
  hint,
  error,
  children,
  ...select
}: FieldShellProps & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <select id={id} className="field" {...select}>
        {children}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  label,
  ...input
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" className="accent-accent size-5" {...input} />
      <span>{label}</span>
    </label>
  );
}

interface BilingualFieldProps<T extends FieldValues> {
  label: string;
  /** Chemin du texte traduisible dans le formulaire, ex. « contenu.contexte ». */
  name: string;
  register: UseFormRegister<T>;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  /** Erreur du champ français (le seul qui puisse être obligatoire). */
  error?: string;
}

/**
 * Champ traduisible : la version française et la version anglaise côte à côte
 * (l'une sous l'autre sur petit écran).
 */
export function BilingualField<T extends FieldValues>({
  label,
  name,
  register,
  multiline = false,
  rows = 4,
  hint,
  error,
}: BilingualFieldProps<T>) {
  const { t } = useTranslation();
  const baseId = useId();
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="grid gap-3 md:grid-cols-2">
        {LANGUAGES.map((language) => {
          const id = `${baseId}-${language}`;
          const props = {
            id,
            lang: language,
            className: 'field',
            // Le chemin est construit à partir de `name` : TypeScript ne peut pas le vérifier.
            ...register(`${name}.${language}` as FieldPath<T>),
          };
          return (
            <div key={language}>
              <label htmlFor={id} className="text-muted mb-1 block text-xs font-semibold uppercase">
                {t(`language.${language}`)}
              </label>
              {multiline ? <textarea rows={rows} {...props} /> : <input {...props} />}
            </div>
          );
        })}
      </div>
      {hint && <p className="text-muted mt-1 text-sm">{hint}</p>}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="text-muted mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

interface MoveButtonsProps {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  /** Nom de l'élément, pour les lecteurs d'écran. */
  itemLabel: string;
}

/** Réordonnancement accessible au clavier : monter / descendre. */
export function MoveButtons({ index, count, onMove, itemLabel }: MoveButtonsProps) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex gap-1">
      <button
        type="button"
        className="btn btn-ghost"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        aria-label={t('admin.moveUp', { item: itemLabel })}
        title={t('admin.moveUp', { item: itemLabel })}
      >
        ↑
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={index === count - 1}
        onClick={() => onMove(index, index + 1)}
        aria-label={t('admin.moveDown', { item: itemLabel })}
        title={t('admin.moveDown', { item: itemLabel })}
      >
        ↓
      </button>
    </span>
  );
}

export function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  if (isLoading) return <p className="text-muted">{t('common.loading')}</p>;
  if (error)
    return (
      <p role="alert" className="text-danger">
        {t('errors.chargement')}
      </p>
    );
  return <>{children}</>;
}
