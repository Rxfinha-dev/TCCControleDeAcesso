/** URL base da API. Em produção vem de VITE_API_URL; em desenvolvimento usa o proxy do Vite. */
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

/** Projeto do Supabase usado para o login (Supabase Auth). */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
/** Chave publicável (sb_publishable_...) ou "anon" legada. Pode ficar no navegador; nunca use a secret/service_role. */
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
