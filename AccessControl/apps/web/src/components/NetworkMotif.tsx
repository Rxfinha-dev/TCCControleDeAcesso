/** Rede de nós inspirada no ícone da logo HelpUs, usada como fundo decorativo. */
export function NetworkMotif({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden focusable="false">
      <g stroke="currentColor" strokeWidth="2.5" fill="none">
        <line x1="90" y1="120" x2="230" y2="70" />
        <line x1="90" y1="120" x2="170" y2="260" />
        <line x1="230" y1="70" x2="330" y2="180" />
        <line x1="170" y1="260" x2="330" y2="180" />
        <line x1="170" y1="260" x2="250" y2="350" />
      </g>
      <g fill="currentColor">
        <circle cx="90" cy="120" r="26" />
        <circle cx="230" cy="70" r="14" />
        <circle cx="330" cy="180" r="20" />
        <circle cx="170" cy="260" r="34" />
        <circle cx="250" cy="350" r="10" />
      </g>
    </svg>
  );
}
