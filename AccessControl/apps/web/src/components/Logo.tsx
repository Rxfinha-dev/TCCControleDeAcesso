interface LogoProps {
  /**
   * "dark" = ícone e texto pretos (sobre o azul); "light" = texto branco (sobre a sidebar escura);
   * "auto" = cor do texto atual (acompanha o tema claro/escuro).
   */
  variant?: 'dark' | 'light' | 'auto';
  className?: string;
}

/** Marca HelpUs: ícone de "compartilhar" + "Help" sólido e "Us" vazado, como na arte original. */
export function Logo({ variant = 'dark', className }: LogoProps) {
  const color = variant === 'dark' ? '#111111' : variant === 'light' ? '#FFFFFF' : 'currentColor';
  return (
    <svg className={className} viewBox="0 0 330 110" role="img" aria-label="HelpUs">
      <g fill={color} stroke={color}>
        <line x1="40" y1="55" x2="92" y2="27" strokeWidth="7" />
        <line x1="40" y1="55" x2="88" y2="88" strokeWidth="7" />
        <circle cx="40" cy="55" r="26" stroke="none" />
        <circle cx="95" cy="24" r="20" stroke="none" />
        <circle cx="90" cy="90" r="16" stroke="none" />
      </g>
      <text x="122" y="76" fontFamily="'Segoe UI', 'Helvetica Neue', Arial, sans-serif" fontSize="58" letterSpacing="-1">
        <tspan fill={color}>Help</tspan>
        <tspan fill="none" stroke={color} strokeWidth="1.6">
          Us
        </tspan>
      </text>
    </svg>
  );
}
