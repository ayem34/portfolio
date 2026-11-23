/** Appels à l'API. Les erreurs portent un code (ex. « slug_deja_utilise ») traduit à l'affichage. */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function errorCode(response: Response): Promise<string> {
  try {
    const data: unknown = await response.json();
    const detail = (data as { detail?: unknown }).detail;
    if (typeof detail === 'string') return detail;
  } catch {
    // Réponse sans JSON : on garde le code générique ci-dessous.
  }
  return response.status === 422 ? 'donnees_invalides' : 'erreur_inconnue';
}

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, credentials: 'same-origin' };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, 'serveur_injoignable');
  }
  if (!response.ok) {
    // 502/503/504 : le relais répond mais l'API dort ou redémarre.
    const asleep = response.status >= 502 && response.status <= 504;
    throw new ApiError(response.status, asleep ? 'serveur_injoignable' : await errorCode(response));
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: (path: string) => request<void>('DELETE', path),
};
