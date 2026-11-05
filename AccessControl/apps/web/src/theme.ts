import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

/** Mesma chave lida pelo script do index.html, que aplica o tema antes da primeira pintura. */
export const THEME_KEY = 'helpus.theme';

const listeners = new Set<() => void>();
const systemDark = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches;

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#151617' : '#34BCFB');
  listeners.forEach((listener) => listener());
}

export const getTheme = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

/** Aplica o tema e guarda a escolha (deixa de seguir o sistema). */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Sem localStorage (modo privado): o tema vale só nesta aba.
  }
  apply(theme);
}

/** Tema inicial: a escolha salva ou, sem ela, o tema do sistema operacional. */
export function initTheme() {
  apply(storedTheme() ?? (systemDark() ? 'dark' : 'light'));
  if (typeof window.matchMedia !== 'function') return;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!storedTheme()) apply(event.matches ? 'dark' : 'light');
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light' as Theme);
  return { theme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') };
}
