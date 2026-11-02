/** URL base da API. Em produção vem de VITE_API_URL; em desenvolvimento usa o proxy do Vite. */
export const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
