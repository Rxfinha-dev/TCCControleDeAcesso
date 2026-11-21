import { render, screen } from '@testing-library/react';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { Drawer } from '../src/components/Drawer';

// Várias instâncias ficam montadas ao mesmo tempo: cada uma precisa anunciar o próprio título.
test('drawers e diálogos montados juntos têm títulos próprios', () => {
  const noop = () => undefined;
  render(
    <>
      <Drawer open title="Nova escola" onClose={noop}>
        x
      </Drawer>
      <Drawer open title="Editar plano" onClose={noop}>
        y
      </Drawer>
      <ConfirmDialog open title="Excluir escola" message="m" onConfirm={noop} onCancel={noop} />
      <ConfirmDialog open title="Rebaixar plano" message="m" onConfirm={noop} onCancel={noop} />
    </>,
  );
  for (const name of ['Nova escola', 'Editar plano', 'Excluir escola', 'Rebaixar plano']) {
    expect(screen.getByRole('dialog', { name, hidden: true })).toBeInTheDocument();
  }
});
