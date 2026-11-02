import { API_URL } from '../app-config';

const TOKEN_KEY = 'helpus.token';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: (() => void) | null = null;

/** Registra o que fazer quando a API responder 401 (sessão expirada). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Body = Record<string, unknown> | FormData | undefined;

export async function request(path: string, options: { method?: string; body?: Body } = {}): Promise<Response> {
  const headers = new Headers();
  const token = tokenStorage.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { method: options.method ?? 'GET', headers, body });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    if (response.status === 401 && token) onUnauthorized?.();
    throw new ApiError(response.status, data.message ?? 'Erro inesperado. Tente novamente.', data.code);
  }
  return response;
}

export async function requestJson<T>(path: string, options: { method?: string; body?: Body } = {}): Promise<T> {
  const response = await request(path, options);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro inesperado. Tente novamente.';
}
