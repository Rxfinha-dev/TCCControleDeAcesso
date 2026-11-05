import { useTheme } from '../theme';
import { MoonIcon, SunIcon } from './Icons';

/** Alterna entre o tema claro e o escuro (a escolha fica salva no navegador). */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
  return (
    <button type="button" className={`icon-button theme-toggle ${className ?? ''}`} aria-label={label} title={label} onClick={toggle}>
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
