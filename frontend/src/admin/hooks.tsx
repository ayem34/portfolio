import { type QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError } from '../lib/api';

// --- Messages d'erreur traduits ---

export function useErrorMessage(): (error: unknown) => string {
  const { t } = useTranslation();
  return useCallback(
    (error) => {
      const code = error instanceof ApiError ? error.code : 'erreur_inconnue';
      return t(`errors.${code}`, { defaultValue: t('errors.erreur_inconnue') });
    },
    [t],
  );
}

// --- Notifications (zone aria-live) ---

interface Toast {
  id: number;
  kind: 'success' | 'error';
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const TOAST_DURATION_MS = 5000;
const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const push = useCallback((kind: Toast['kind'], message: string) => {
    const id = nextId.current++;
    // Trois messages au plus à l'écran : les plus anciens laissent la place.
    setToasts((current) => [...current, { id, kind, message }].slice(-MAX_TOASTS));
    setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      TOAST_DURATION_MS,
    );
  }, []);

  const value = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 bottom-4 z-50 flex max-w-sm flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className={`bg-surface-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${toast.kind === 'error' ? 'border-danger text-danger' : 'border-success text-fg'}`}
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return context;
}

// --- Données de l'admin ---

export const SESSION_KEY: QueryKey = ['session'];
export const ADMIN_KEY = 'admin';

/** Lecture d'une ressource de l'admin. Une session expirée renvoie à la connexion. */
export function useAdminQuery<T>(path: string, fetcher: () => Promise<T>, enabled = true) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [ADMIN_KEY, path],
    enabled,
    queryFn: async () => {
      try {
        return await fetcher();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
        }
        throw error;
      }
    },
  });
}

interface MutationOptions<TOutput> {
  /** Clé de traduction du message de réussite. */
  successKey?: string;
  onSuccess?: (output: TOutput) => void;
}

/**
 * Écriture dans l'admin : affiche le résultat et rafraîchit toutes les listes de l'admin
 * (elles sont petites ; c'est plus sûr que de cibler chaque liste à la main).
 */
export function useAdminMutation<TInput, TOutput>(
  mutationFn: (input: TInput) => Promise<TOutput>,
  { successKey = 'admin.saved', onSuccess }: MutationOptions<TOutput> = {},
) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  return useMutation({
    mutationFn,
    onSuccess: async (output) => {
      await queryClient.invalidateQueries({ queryKey: [ADMIN_KEY] });
      toast.success(t(successKey));
      onSuccess?.(output);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      }
      toast.error(errorMessage(error));
    },
  });
}

/** Déplace un élément d'une liste (boutons monter / descendre). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const result = [...items];
  const [moved] = result.splice(from, 1);
  if (moved === undefined || to < 0 || to >= items.length) return [...items];
  result.splice(to, 0, moved);
  return result;
}
