import { renderToStaticMarkup } from 'react-dom/server';
import { act, render, screen, waitFor } from '@testing-library/react';
import { studentsApi } from '../src/api';
import { StudentPhoto } from '../src/components/StudentPhoto';

jest.mock('../src/api', () => ({ studentsApi: { photo: jest.fn() } }));

const photo = studentsApi.photo as jest.Mock;

beforeAll(() => {
  let next = 0;
  URL.createObjectURL = jest.fn(() => `blob:foto-${++next}`);
  URL.revokeObjectURL = jest.fn();
});

describe('StudentPhoto', () => {
  it('ao trocar de aluno, não mostra a foto do anterior enquanto a nova carrega', async () => {
    photo.mockResolvedValueOnce(new Blob(['x']));
    const { rerender } = render(<StudentPhoto studentId={1} hasPhoto alt="Foto" />);
    expect(await screen.findByRole('img', { name: 'Foto' })).toHaveAttribute('src', 'blob:foto-1');

    photo.mockReturnValueOnce(new Promise(() => {})); // a foto do aluno 2 ainda não chegou
    rerender(<StudentPhoto studentId={2} hasPhoto alt="Foto" />);

    expect(screen.queryByRole('img', { name: 'Foto' })).not.toBeInTheDocument();
  });

  it('mostra esqueleto enquanto a foto carrega e troca pela imagem', async () => {
    let resolve: (blob: Blob) => void = () => {};
    photo.mockReturnValueOnce(new Promise<Blob>((r) => (resolve = r)));
    const { container } = render(<StudentPhoto studentId={3} hasPhoto alt="Foto" />);
    await waitFor(() => expect(container.querySelector('.student-photo .skeleton')).toBeInTheDocument());
    expect(screen.queryByRole('img', { name: 'Foto' })).not.toBeInTheDocument();
    await act(async () => resolve(new Blob(['x'])));
    expect(await screen.findByRole('img', { name: 'Foto' })).toBeInTheDocument();
    expect(container.querySelector('.skeleton')).not.toBeInTheDocument();
  });

  it('foto pendente: aria-busy e aviso oculto; carregada, sem os dois', async () => {
    let resolve: (blob: Blob) => void = () => {};
    photo.mockReturnValueOnce(new Promise<Blob>((r) => (resolve = r)));
    const { container } = render(<StudentPhoto studentId={6} hasPhoto alt="Foto" />);
    const box = container.querySelector('.student-photo')!;
    await waitFor(() => expect(box).toHaveAttribute('aria-busy', 'true'));
    expect(screen.getByText('Carregando foto…')).toHaveClass('sr-only');
    await act(async () => resolve(new Blob(['x'])));
    await screen.findByRole('img', { name: 'Foto' });
    expect(box).not.toHaveAttribute('aria-busy');
    expect(screen.queryByText('Carregando foto…')).not.toBeInTheDocument();
  });

  it('sem foto mostra o ícone, sem esqueleto', () => {
    const { container } = render(<StudentPhoto studentId={4} hasPhoto={false} alt="Foto" />);
    expect(container.querySelector('.skeleton')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('no primeiro render (antes de qualquer efeito), com a foto pendente, já é esqueleto: sem ícone nem imagem', () => {
    const html = renderToStaticMarkup(<StudentPhoto studentId={5} hasPhoto alt="Foto" />);
    expect(html).toContain('skeleton');
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('<img');
  });
});
