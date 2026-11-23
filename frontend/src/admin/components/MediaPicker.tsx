import { type ChangeEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import type { Media, TypeMedia } from '../../lib/types';
import { ACCEPTED_FILES, ADMIN, uploadMedias } from '../api';
import { useAdminMutation, useAdminQuery } from '../hooks';

export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function MediaThumbnail({ media }: { media: Media }) {
  const { t } = useTranslation();
  if (media.type === 'image') {
    return (
      <img src={media.url} alt="" loading="lazy" className="aspect-video w-full object-cover" />
    );
  }
  return (
    <span className="bg-surface-2 text-muted flex aspect-video w-full items-center justify-center text-sm font-semibold uppercase">
      {t(`enums.type_media.${media.type}`)}
    </span>
  );
}

interface MediaBrowserProps {
  types: TypeMedia[];
  onPick: (medias: Media[]) => void;
  /** Autorise l'import de plusieurs fichiers d'un coup (captures d'une visite). */
  multiple?: boolean;
}

/** Bibliothèque filtrée par type : choisir un fichier existant ou en importer un. */
export function MediaBrowser({ types, onPick, multiple = false }: MediaBrowserProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const medias = useAdminQuery('/medias', () => api.get<Media[]>(`${ADMIN}/medias`));
  const upload = useAdminMutation((files: File[]) => uploadMedias(files), {
    successKey: 'admin.media.uploaded',
    onSuccess: onPick,
  });
  const matching = (medias.data ?? []).filter((media) => types.includes(media.type));

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) upload.mutate(files);
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={inputId} className="field-label">
          {t(multiple ? 'admin.media.uploadMany' : 'admin.media.uploadOne')}
        </label>
        <input
          id={inputId}
          type="file"
          className="field"
          accept={types.map((type) => ACCEPTED_FILES[type]).join(',')}
          multiple={multiple}
          onChange={onFiles}
          disabled={upload.isPending}
        />
        {upload.isPending && (
          <p className="text-muted mt-1 text-sm">{t('admin.media.uploading')}</p>
        )}
      </div>
      {matching.length === 0 ? (
        <p className="text-muted">{t('admin.media.empty')}</p>
      ) : (
        <ul className="grid max-h-[50vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {matching.map((media) => (
            <li key={media.id}>
              <button
                type="button"
                className="card hover:border-accent block w-full overflow-hidden text-left"
                onClick={() => onPick([media])}
              >
                <MediaThumbnail media={media} />
                <span className="block truncate p-2 text-sm">{media.nom}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface MediaPickerProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  types: TypeMedia[];
  hint?: string;
}

/** Champ « adresse d'un fichier » : saisie libre (lien externe) ou choix dans la bibliothèque. */
export function MediaPicker({ label, value, onChange, types, hint }: MediaPickerProps) {
  const { t } = useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={id}
          className="field min-w-0 flex-1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://… / /uploads/…"
        />
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
          {t('admin.media.choose')}
        </button>
      </div>
      {hint && <p className="text-muted mt-1 text-sm">{hint}</p>}
      <Modal open={open} onClose={() => setOpen(false)} title={t('admin.media.library')} wide>
        <MediaBrowser
          types={types}
          onPick={(medias) => {
            const first = medias[0];
            if (first) onChange(first.url);
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
