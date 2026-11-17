import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { TourPlayer } from '../../components/demo/TourPlayer';
import { Modal } from '../../components/Modal';
import { api } from '../../lib/api';
import { EMPTY_TEXT, useLocalized } from '../../lib/localized';
import {
  type Cadre,
  CADRES,
  type Demo,
  type Etape,
  type EtapeInput,
  type LocalizedText,
  type Media,
  type Zone,
} from '../../lib/types';
import { ADMIN } from '../api';
import {
  BilingualField,
  MoveButtons,
  PageHeader,
  QueryState,
  SelectField,
} from '../components/form';
import { MediaBrowser } from '../components/MediaPicker';
import { ZoneEditor } from '../components/ZoneEditor';
import { moveItem, useAdminMutation, useAdminQuery } from '../hooks';

interface StepFormProps {
  etape: Etape;
  position: number;
  onSave: (input: EtapeInput) => void;
  onDelete: () => void;
  saving: boolean;
}

/** Réglage d'une étape : zone cliquable, légende FR/EN, capture. */
function StepForm({ etape, position, onSave, onDelete, saving }: StepFormProps) {
  const { t } = useTranslation();
  const [zone, setZone] = useState<Zone | null>(etape.zone);
  const [imageUrl, setImageUrl] = useState(etape.image_url);
  const [pickingImage, setPickingImage] = useState(false);
  const { register, handleSubmit } = useForm<{ legende: LocalizedText }>({
    defaultValues: { legende: etape.legende },
  });

  return (
    <form
      className="card space-y-5 p-5"
      onSubmit={handleSubmit(({ legende }) => onSave({ image_url: imageUrl, zone, legende }))}
    >
      <h2 className="text-lg font-semibold">{t('admin.tour.stepTitle', { position })}</h2>
      <ZoneEditor
        imageUrl={imageUrl}
        alt={t('admin.tour.stepTitle', { position })}
        zone={zone}
        onChange={setZone}
      />
      <BilingualField
        label={t('admin.tour.caption')}
        name="legende"
        register={register}
        multiline
        rows={2}
      />
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {t('admin.tour.saveStep')}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setPickingImage(true)}>
          {t('admin.tour.replaceImage')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDelete}>
          {t('admin.tour.deleteStep')}
        </button>
      </div>
      <Modal
        open={pickingImage}
        onClose={() => setPickingImage(false)}
        title={t('admin.media.library')}
        wide
      >
        <MediaBrowser
          types={['image']}
          onPick={(medias) => {
            if (medias[0]) setImageUrl(medias[0].url);
            setPickingImage(false);
          }}
        />
      </Modal>
    </form>
  );
}

/**
 * Éditeur de visite guidée (section 4.4) : importer les captures dans l'ordre du
 * parcours, tracer la zone cliquable de chacune, écrire les légendes, choisir le
 * cadre, réordonner, prévisualiser.
 */
export default function TourEditor() {
  const { t } = useTranslation();
  const l = useLocalized();
  const { projetId, demoId } = useParams();
  const demosPath = `/projets/${projetId}/demos`;
  const demos = useAdminQuery(demosPath, () => api.get<Demo[]>(`${ADMIN}${demosPath}`));
  const demo = demos.data?.find((item) => item.id === Number(demoId) && item.type === 'visite');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  const stepsUrl = `${ADMIN}/demos/${demoId}/etapes`;
  const addSteps = useAdminMutation(
    async (medias: Media[]) => {
      let last: Etape | undefined;
      for (const media of medias) {
        last = await api.post<Etape>(stepsUrl, {
          image_url: media.url,
          zone: null,
          legende: EMPTY_TEXT,
        });
      }
      return last;
    },
    {
      successKey: 'admin.tour.stepsAdded',
      onSuccess: (last) => {
        if (last) setSelectedId(last.id);
        setImporting(false);
      },
    },
  );
  const saveStep = useAdminMutation(({ id, input }: { id: number; input: EtapeInput }) =>
    api.put<Etape>(`${ADMIN}/etapes/${id}`, input),
  );
  const deleteStep = useAdminMutation((id: number) => api.delete(`${ADMIN}/etapes/${id}`), {
    successKey: 'admin.deleted',
  });
  const reorder = useAdminMutation((ids: number[]) => api.put(`${stepsUrl}/ordre`, { ids }), {
    successKey: 'admin.reordered',
  });
  const setFrame = useAdminMutation((cadre: Cadre) =>
    api.put<Demo>(`${ADMIN}/demos/${demoId}`, { ...demo, config: { ...demo?.config, cadre } }),
  );

  const etapes = demo?.etapes ?? [];
  const selected = etapes.find((etape) => etape.id === selectedId) ?? etapes[0];

  return (
    <QueryState isLoading={demos.isLoading} error={demos.error}>
      {!demo ? (
        <p role="alert">{t('errors.introuvable')}</p>
      ) : (
        <>
          <PageHeader
            title={t('admin.tour.title')}
            description={t('admin.tour.description')}
            actions={
              <>
                <Link className="btn btn-ghost" to={`/admin/projets/${projetId}?onglet=demos`}>
                  {t('admin.tour.backToProject')}
                </Link>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPreviewing(true)}
                  disabled={etapes.length === 0}
                >
                  {t('admin.preview')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setImporting(true)}
                >
                  {t('admin.tour.importScreens')}
                </button>
              </>
            }
          />

          <div className="mb-6 max-w-xs">
            <SelectField
              label={t('admin.tour.frame')}
              value={demo.config.cadre}
              onChange={(event) => setFrame.mutate(event.target.value as Cadre)}
            >
              {CADRES.map((cadre) => (
                <option key={cadre} value={cadre}>
                  {t(`enums.cadre.${cadre}`)}
                </option>
              ))}
            </SelectField>
          </div>

          {etapes.length === 0 ? (
            <p className="card text-muted p-6">{t('admin.tour.noSteps')}</p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
              <ol className="space-y-2" aria-label={t('admin.tour.steps')}>
                {etapes.map((etape, index) => {
                  const isSelected = etape.id === selected?.id;
                  const name = t('admin.tour.stepTitle', { position: index + 1 });
                  return (
                    <li
                      key={etape.id}
                      className={`card flex items-center gap-2 p-2 ${isSelected ? 'border-accent' : ''}`}
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        onClick={() => setSelectedId(etape.id)}
                        aria-current={isSelected ? 'step' : undefined}
                      >
                        <img
                          src={etape.image_url}
                          alt=""
                          className="border-border h-12 w-16 rounded border object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">{name}</span>
                          <span className="text-muted block truncate text-xs">
                            {l(etape.legende) ||
                              t(etape.zone ? 'admin.tour.noCaption' : 'admin.tour.noZone')}
                          </span>
                        </span>
                      </button>
                      <MoveButtons
                        index={index}
                        count={etapes.length}
                        itemLabel={name}
                        onMove={(from, to) =>
                          reorder.mutate(moveItem(etapes, from, to).map((item) => item.id))
                        }
                      />
                    </li>
                  );
                })}
              </ol>
              {selected && (
                <StepForm
                  key={selected.id}
                  etape={selected}
                  position={etapes.indexOf(selected) + 1}
                  saving={saveStep.isPending}
                  onSave={(input) => saveStep.mutate({ id: selected.id, input })}
                  onDelete={() => {
                    if (window.confirm(t('admin.confirmDelete'))) deleteStep.mutate(selected.id);
                  }}
                />
              )}
            </div>
          )}

          <Modal
            open={importing}
            onClose={() => setImporting(false)}
            title={t('admin.tour.importScreens')}
            wide
          >
            <p className="text-muted mb-4 text-sm">{t('admin.tour.importHint')}</p>
            <MediaBrowser types={['image']} multiple onPick={(medias) => addSteps.mutate(medias)} />
          </Modal>
          <Modal
            open={previewing}
            onClose={() => setPreviewing(false)}
            title={t('admin.preview')}
            wide
          >
            <TourPlayer etapes={etapes} cadre={demo.config.cadre} />
          </Modal>
        </>
      )}
    </QueryState>
  );
}
