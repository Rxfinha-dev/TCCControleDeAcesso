import { render, screen } from '@testing-library/react';
import { SkeletonRows } from '../src/components/Skeleton';

describe('SkeletonRows', () => {
  it('gera linhas x colunas de blocos ocultos e um aviso para leitores de tela', () => {
    const { container } = render(
      <table>
        <tbody>
          <SkeletonRows rows={3} cols={4} />
        </tbody>
      </table>,
    );
    expect(container.querySelectorAll('tr')).toHaveLength(3);
    const blocks = container.querySelectorAll('.skeleton');
    expect(blocks).toHaveLength(12);
    blocks.forEach((b) => expect(b).toHaveAttribute('aria-hidden', 'true'));
    expect(screen.getAllByText('Carregando…')).toHaveLength(1);
  });
});
