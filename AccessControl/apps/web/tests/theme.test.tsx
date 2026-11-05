import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeToggle } from '../src/components/ThemeToggle';
import { initTheme, THEME_KEY } from '../src/theme';

describe('Tema claro/escuro', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('começa no tema claro quando não há escolha salva', () => {
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('restaura a escolha salva', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('alterna o tema e guarda a escolha', async () => {
    initTheme();
    render(<ThemeToggle />);

    await userEvent.click(screen.getByRole('button', { name: 'Ativar tema escuro' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    await userEvent.click(screen.getByRole('button', { name: 'Ativar tema claro' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });
});
