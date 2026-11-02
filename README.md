# HelpUs — TCCControleDeAcesso

Sistema de Controle de Acesso desenvolvido como Trabalho de Conclusão de Curso (TCC) na ETEC Joaquim Ferreira do Amaral.
Gerencia o cadastro de instituições, cursos e alunos e registra as entradas com leitura biométrica (Arduino + sensor de digitais).

## 📁 Estrutura do repositório

| Pasta | Conteúdo |
| --- | --- |
| [`AccessControl/`](AccessControl/README.md) | **Versão atual (web)** — React + Node.js/TypeScript + Prisma + PostgreSQL |
| `TCCControleDeAcesso/` | Versão legada desktop (C# WinForms + MySQL), mantida como referência |
| `.github/` | Workflows de CI/CD, Dependabot e template de PR |
| `render.yaml` | Blueprint de hospedagem da API e do frontend no Render |

## 🛠️ Tecnologias (versão atual)

| Tipo | Tecnologia |
| --- | --- |
| Frontend | React 19, Vite, TypeScript |
| Backend | Node.js, Express 5, TypeScript |
| Banco de dados | PostgreSQL (Supabase) |
| ORM | Prisma |
| Testes | Jest |
| Hardware | Arduino via Web Serial API |
| CI/CD | GitHub Actions |

## ⚙️ Funcionalidades

- ✅ Cadastro da instituição com ativação da conta por código enviado por e-mail
- ✅ Login seguro (bcrypt + JWT) e recuperação de senha por e-mail
- ✅ Cadastro, edição e exclusão de cursos e alunos (com foto)
- ✅ Cadastro da digital do aluno no sensor biométrico
- ✅ Verificação por digital com registro de entrada (data/hora) e entrada manual por RM
- ✅ Relatório de entradas com filtros e exportação CSV

## 🚀 Como executar e publicar

- Desenvolvimento local: [AccessControl/README.md](AccessControl/README.md)
- Publicação (Supabase + Render + GitHub Actions): [AccessControl/DEPLOY.md](AccessControl/DEPLOY.md)

## 🤝 Contribuição

1. Crie uma branch a partir de `develop`: `git checkout -b feature/minha-feature`
2. Faça commits e abra um Pull Request para `develop` — o CI roda lint, testes e build automaticamente.
3. Releases vão de `develop` para `main`; o merge em `main` publica em produção.

## 👥 Autores

- Bruno Freitas — GitHub: [BrunoFreitas09](https://github.com/BrunoFreitas09)
- Rafael Oliveira — GitHub: [Rxfinha-dev](https://github.com/Rxfinha-dev)
- Leonidas Pelegrini — GitHub: [oleopelegrini](https://github.com/oleopelegrini)
- Diego Natan — GitHub: [dnatanno](https://github.com/dnatanno)

💡 Projeto desenvolvido para o TCC do curso técnico da ETEC Joaquim Ferreira do Amaral.
