import { type ReactNode, useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}

/** Fenêtre modale basée sur <dialog> : focus piégé et touche Échap gérés par le navigateur. */
export function Modal({ open, onClose, title, children, wide = false }: ModalProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        // Clic sur le fond (le <dialog> lui-même), pas sur son contenu.
        if (event.target === ref.current) onClose();
      }}
      className={`bg-surface text-fg border-border m-auto w-[calc(100%-2rem)] rounded-2xl border p-0 backdrop:bg-black/75 ${wide ? 'max-w-5xl' : 'max-w-xl'}`}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t('common.close')}
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
