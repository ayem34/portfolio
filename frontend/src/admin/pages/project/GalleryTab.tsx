import { type ChangeEvent, useId } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { api } from '../../../lib/api';
import type { LocalizedText, Media } from '../../../lib/types';
import { ACCEPTED_FILES, ADMIN, uploadMedias } from '../../api';
import { BilingualField, MoveButtons, QueryState } from '../../components/form';
import { moveItem, useAdminMutation, useAdminQuery } from '../../hooks';

function GalleryItem({ media, moveButtons }: { media: Media; moveButtons: React.ReactNode }) {
  const { t } = useTranslation();
  const { register, handleSubmit } = useForm<{ legende: LocalizedText }>({
    defaultValues: { legende: media.legende },
  });
  const save = useAdminMutation((legende: LocalizedText) =>
    api.put<Media>(`${ADMIN}/medias/${media.id}`, { legende, projet_id: media.projet_id }),
  );
  const detach = useAdminMutation(
    () =>
      api.put<Media>(`${ADMIN}/medias/${media.id}`, { legende: media.legende, projet_id: null }),
    { successKey: 'admin.gallery.removed' },
  );

  return (
    <li className="card grid gap-4 p-4 md:grid-cols-[12rem_1fr]">
      <img
        src={media.url}
        alt={media.nom}
        className="border-border aspect-video w-full rounded border object-cover"
      />
      <form className="space-y-3" onSubmit={handleSubmit(({ legende }) => save.mutate(legende))}>
        <BilingualField label={t('admin.gallery.caption')} name="legende" register={register} />
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-secondary" disabled={save.isPending}>
            {t('admin.gallery.saveCaption')}
          </button>
          {moveButtons}
          <button type="button" className="btn btn-ghost" onClick={() => detach.mutate(undefined)}>
            {t('admin.gallery.remove')}
          </button>
        </div>
      </form>
    </li>
  );
}

/** Galerie du projet : captures annotées et graphiques, dans l'ordre d'affichage. */
export function GalleryTab({ projetId }: { projetId: number }) {
  const { t } = useTranslation();
  const inputId = useId();
  const path = `/medias?projet_id=${projetId}&type=image`;
  const gallery = useAdminQuery(path, () => api.get<Media[]>(`${ADMIN}${path}`));
  const upload = useAdminMutation((files: File[]) => uploadMedias(files, projetId), {
    successKey: 'admin.media.uploaded',
  });
  const reorder = useAdminMutation(
    (ids: number[]) => api.put(`${ADMIN}/medias/ordre?projet_id=${projetId}`, { ids }),
    { successKey: 'admin.reordered' },
  );
  // L'ordre porte sur tous les médias du projet ; la galerie n'en montre que les images.
  const allMedias = useAdminQuery(`/medias?projet_id=${projetId}`, () =>
    api.get<Media[]>(`${ADMIN}/medias?projet_id=${projetId}`),
  );
  const images = gallery.data ?? [];

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length > 0) upload.mutate(files);
    event.target.value = '';
  };

  const move = (from: number, to: number) => {
    const reordered = moveItem(images, from, to).map((media) => media.id);
    const others = (allMedias.data ?? [])
      .filter((media) => media.type !== 'image')
      .map((media) => media.id);
    reorder.mutate([...reordered, ...others]);
  };

  return (
    <QueryState isLoading={gallery.isLoading} error={gallery.error}>
      <div className="card mb-6 p-5">
        <label htmlFor={inputId} className="field-label">
          {t('admin.gallery.add')}
        </label>
        <input
          id={inputId}
          type="file"
          className="field"
          accept={ACCEPTED_FILES.image}
          multiple
          onChange={onFiles}
          disabled={upload.isPending}
        />
        <p className="text-muted mt-1 text-sm">{t('admin.gallery.hint')}</p>
      </div>
      {images.length === 0 ? (
        <p className="text-muted">{t('admin.gallery.empty')}</p>
      ) : (
        <ol className="space-y-3">
          {images.map((media, index) => (
            <GalleryItem
              key={media.id}
              media={media}
              moveButtons={
                <MoveButtons
                  index={index}
                  count={images.length}
                  itemLabel={media.nom}
                  onMove={move}
                />
              }
            />
          ))}
        </ol>
      )}
    </QueryState>
  );
}
