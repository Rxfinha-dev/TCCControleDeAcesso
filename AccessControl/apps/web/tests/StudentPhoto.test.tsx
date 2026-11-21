import { render, screen } from '@testing-library/react';
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
});
