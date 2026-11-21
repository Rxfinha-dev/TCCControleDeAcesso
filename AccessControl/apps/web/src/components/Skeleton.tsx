/** Bloco cinza pulsante que ocupa o lugar do conteúdo enquanto a API responde. */
export function Skeleton({
  width,
  height,
  className,
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <span
      className={className ? `skeleton ${className}` : 'skeleton'}
      aria-hidden="true"
      style={{ width, height }}
    />
  );
}

/** Cartão de esqueleto para telas cujo conteúdo (cartão) ainda não chegou da API. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <section className="card skeleton-card" aria-busy="true">
      <span className="sr-only">Carregando…</span>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height="1.4em" />
      ))}
    </section>
  );
}

/** Linhas de esqueleto para dentro de um <tbody>; o aviso oculto fica só na primeira. */
export function SkeletonRows({ rows = 5, cols }: { rows?: number; cols: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} className="skeleton-row">
          {Array.from({ length: cols }, (_, c) => (
            <td key={c}>
              {r === 0 && c === 0 && <span className="sr-only">Carregando…</span>}
              <Skeleton />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
