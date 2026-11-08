import { API_URL } from '../app-config';
import { supabase } from '../lib/supabase';

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

/** Token de acesso da sessão do Supabase (renovado automaticamente quando expira). */
async function accessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

let onUnauthorized: (() => void) | null = null;
let onSchoolForbidden: (() => void) | null = null;
/** Escola em uso enviada no cabeçalho X-School-Id (só o super admin define). */
let schoolScope: number | 'all' | null = null;

/** Define a escola enviada em todas as requisições (null = não envia o cabeçalho). */
export function setSchoolScope(value: number | 'all' | null) {
  schoolScope = value;
}

/** Registra o que fazer quando a API recusar a escola enviada (perfil alterado em outra sessão). */
export function setSchoolForbiddenHandler(handler: (() => void) | null) {
  onSchoolForbidden = handler;
}

/** Registra o que fazer quando a API responder 401 (sessão expirada). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Body = Record<string, unknown> | FormData | undefined;

export async function request(path: string, options: { method?: string; body?: Body } = {}): Promise<Response> {
  // Lida antes de qualquer await: trocar de escola durante a renovação do token não muda o destino da requisição.
  const sentSchool = schoolScope;
  const headers = new Headers();
  const token = await accessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (sentSchool !== null) headers.set('X-School-Id', String(sentSchool));

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
    if (response.status === 403 && data.code === 'SCHOOL_FORBIDDEN' && sentSchool !== null) onSchoolForbidden?.();
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
