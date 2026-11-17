import { type ChangeEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '../../lib/api';
import type { Media, TypeMedia } from '../../lib/types';
import { ADMIN, ALL_ACCEPTED_FILES, uploadMedias } from '../api';
import { PageHeader, QueryState, SelectField, TextField } from '../components/form';
import { formatSize, MediaThumbnail } from '../components/MediaPicker';
import { useAdminMutation, useAdminQuery, useToast } from '../hooks';

const TYPES: TypeMedia[] = ['image', 'video', 'pdf', 'notebook', 'sous_titres'];

export default function MediaLibrary() {
  const { t } = useTranslation();
  const toast = useToast();
  const inputId = useId();
  const [type, setType] = useState<TypeMedia | ''>('');
  const [search, setSearch] = useState('');
  const medias = useAdminQuery('/medias', () => api.get<Media[]>(`${ADMIN}/medias`));
  const upload = useAdminMutation((files: File[]) => uploadMedias(files), {
    successKey: 'admin.media.uploaded',
  });
  const remove = useAdminMutation((id: number) => api.delete(`${ADMIN}/medias/${id}`), {
    successKey: 'admin.deleted',
  });

  const shown = (medias.data ?? []).filter(
    (media) =>
      (type === '' || media.type === type) &&
      media.nom.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) upload.mutate(files);
    event.target.value = '';
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('admin.media.copied'));
    } catch {
      toast.error(text);
    }
  };

  return (
    <>
      <PageHeader title={t('admin.nav.media')} description={t('admin.media.description')} />
      <div className="card mb-6 grid gap-4 p-5 md:grid-cols-3">
        <div>
          <label htmlFor={inputId} className="field-label">
            {t('admin.media.uploadMany')}
          </label>
          <input
            id={inputId}
            type="file"
            className="field"
            accept={ALL_ACCEPTED_FILES}
            multiple
            onChange={onFiles}
            disabled={upload.isPending}
          />
          <p className="text-muted mt-1 text-sm">{t('admin.media.limits')}</p>
        </div>
        <SelectField
          label={t('admin.media.filterType')}
          value={type}
          onChange={(event) => setType(event.target.value as TypeMedia | '')}
        >
          <option value="">{t('admin.media.allTypes')}</option>
          {TYPES.map((item) => (
            <option key={item} value={item}>
              {t(`enums.type_media.${item}`)}
            </option>
          ))}
        </SelectField>
        <TextField
          label={t('admin.media.search')}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <QueryState isLoading={medias.isLoading} error={medias.error}>
        {shown.length === 0 ? (
          <p className="text-muted">{t('admin.media.empty')}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.map((media) => (
              <li key={media.id} className="card overflow-hidden">
                <a href={media.url} target="_blank" rel="noopener noreferrer">
                  <MediaThumbnail media={media} />
                </a>
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-semibold" title={media.nom}>
                    {media.nom}
                  </p>
                  <p className="text-muted text-xs">
                    {t(`enums.type_media.${media.type}`)} · {formatSize(media.taille)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => void copy(media.url)}
                    >
                      {t('admin.media.copyUrl')}
                    </button>
                    {media.type === 'image' && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => void copy(`![${media.nom}](${media.url})`)}
                      >
                        {t('admin.media.copyMarkdown')}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        if (window.confirm(t('admin.confirmDelete'))) remove.mutate(media.id);
                      }}
                    >
                      {t('admin.delete')}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryState>
    </>
  );
}
