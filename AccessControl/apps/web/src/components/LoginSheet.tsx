import type { LoginCredentials } from '../api/types';

export interface LoginSheetRow extends LoginCredentials {
  name: string;
  rm?: string;
}

interface LoginSheetProps {
  title: string;
  rows: LoginSheetRow[];
  /** Quem não ganhou login (gerar de novo tenta só esses). */
  failed?: { name: string; reason: string }[];
  onClose: () => void;
}

/**
 * Lista de usuários e senhas iniciais para imprimir e entregar. As senhas só existem nesta tela:
 * depois de fechar, a escola só consegue gerar uma nova.
 */
export function LoginSheet({ title, rows, failed = [], onClose }: LoginSheetProps) {
  const hasRm = rows.some((row) => row.rm);
  return (
    <section className="card print-sheet" aria-label={title}>
      <h2 className="card-title">{title}</h2>
      <p className="hint no-print">
        Anote ou imprima agora: as senhas não aparecem de novo. No primeiro acesso cada um cria a própria senha.
      </p>
      {rows.length > 0 && (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                {hasRm && <th className="numeric">RM</th>}
                <th>Usuário</th>
                <th>Senha inicial</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.username}>
                  <td>{row.name}</td>
                  {hasRm && <td className="numeric">{row.rm}</td>}
                  <td className="mono">{row.username}</td>
                  <td className="mono">{row.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {failed.length > 0 && (
        <div className="banner" role="alert">
          <p>Não foi possível criar o login de {failed.length === 1 ? '1 aluno' : `${failed.length} alunos`}. Gere de novo para tentar só esses:</p>
          <ul>
            {failed.map((item) => (
              <li key={item.name}>
                {item.name}: {item.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="hint print-only">Acesse o HelpUs com o usuário e a senha acima. No primeiro acesso, crie a sua senha.</p>
      <div className="form-actions no-print">
        {rows.length > 0 && (
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Imprimir lista
          </button>
        )}
        <button type="button" className="btn btn-outline" onClick={onClose}>
          Fechar
        </button>
      </div>
    </section>
  );
}
