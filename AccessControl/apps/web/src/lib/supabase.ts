import { createClient } from '@supabase/supabase-js';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '../app-config';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY para habilitar o login.');
}

/** Chave do localStorage onde o Supabase guarda a sessão. */
export const AUTH_STORAGE_KEY = 'helpus.auth';

/** Cliente do Supabase usado apenas para autenticação (a sessão fica no localStorage). */
export const supabase = createClient(SUPABASE_URL || 'http://localhost:54321', SUPABASE_PUBLISHABLE_KEY || 'missing-key', {
  auth: { storageKey: AUTH_STORAGE_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
