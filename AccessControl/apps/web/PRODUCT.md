# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cada perfil tem uma tela pensada para o seu dia a dia, sem um usuário dominante (decisão do dono do produto):

- **Escola (secretaria e equipe de cadastro):** um login compartilhado por escola. Cadastra alunos, cursos, turmas, disciplinas, professores, grade semanal e calendário; acompanha entradas, presença e notas. Trabalha no computador da escola.
- **Operador da catraca (guarda/porteiro):** usa o mesmo login da escola. Coloca o sistema em operação na entrada e deixa a tela de Verificação aberta enquanto os alunos chegam e saem pela mesma catraca.
- **Professor:** login criado pela escola (um por escola em que leciona). Faz a chamada das suas aulas (corrigindo a presença calculada pela catraca), marca provas e trabalhos e lança notas.
- **Aluno:** login criado pela escola. Vê a grade da semana, as próximas avaliações, a frequência e as notas por disciplina, e baixa o boletim em PDF; acesso frequente pelo celular.
- **Super admin:** dono do projeto; age em todas as escolas por um seletor de escola.

## Product Purpose

O HelpUs controla o acesso de alunos à escola por leitor de digital na catraca e transforma essas leituras em presença por aula: a escola monta a grade de cada turma, a catraca diz quando o aluno estava dentro, e o sistema marca presença ou falta em cada aula sozinho. Em volta disso: disciplinas, professores, calendário com feriados, avaliações, notas, médias e boletim.

Sucesso: o aluno abre o sistema e vê, por disciplina, quantas faltas tem e qual a média, sem que ninguém tenha feito chamada à mão; o professor só corrige exceções.

## Positioning

A presença sai da catraca. A digital do aluno na entrada e na saída vira presença ou falta em cada aula automaticamente (presente se ficou dentro da escola por pelo menos metade da aula). Esse é o mecanismo que o design deve deixar evidente.

## Operating Context

- Uma catraca com leitor biométrico (Arduino via Web Serial) por escola, usada para entrada e saída; as leituras alternam entrada/saída ao longo do dia.
- A Verificação fica aberta no computador da portaria durante a chegada; há entrada manual pelo RM como alternativa.
- Cada escola organiza o dia do seu jeito (aulas de duração variável, intervalos, turnos manhã/tarde/noite/integral); a grade é montada arrastando disciplinas numa agenda semanal.
- Escolas técnicas (ETEC, com cursos) e escolas de ensino regular (só turmas) usam o mesmo sistema.
- Projeto de TCC, apresentado a uma banca.

## Capabilities and Constraints

- Monorepo `AccessControl/`: `apps/web` (React 19, react-router 7, Vite) e `apps/api` (Express, Prisma, Postgres no Supabase). Auth pelo Supabase Auth. Deploy no Render.
- Idioma da interface: português do Brasil. Fuso: America/Sao_Paulo.
- Telas existentes: login, cadastro (Sou uma escola / Sou um usuário — em breve), ativação de conta, esqueci a senha, Início, Alunos, Cursos, Verificação, Entradas, Configurações (conexão com o leitor), Escolas e Usuários (super admin).
- Em construção (spec `docs/superpowers/specs/2026-11-08-modulo-academico-design.md`): Turmas, Disciplinas, Professores, grade semanal de arrastar, calendário, presença por aula, avaliações e notas, telas de professor e aluno, boletim em PDF.
- A edição da grade é tarefa de tela larga; no celular a grade é só leitura.
- Tema claro e escuro já existem e devem continuar.

## Brand Commitments

- Nome: **HelpUs** (logo em `apps/web/src/components/Logo.tsx`).

## Evidence on Hand

- Não há depoimentos, clientes, métricas de uso nem imagens reais de escolas; não inventar.

## Product Principles

1. A catraca faz o trabalho: o que pode ser automático não vira tarefa manual; a correção manual é exceção visível e rastreável.
2. Cada perfil vê o que precisa para o seu dia, e nada de outro aluno, turma ou escola.
3. Funciona para qualquer escola: estrutura de horários, cursos e sistema de notas variam por escola.
4. Nada de falta injusta: feriados, aula cancelada, leitura repetida e saída não registrada nunca viram falta silenciosa.

## Accessibility & Inclusion

- A Verificação precisa ser legível de longe e de relance pelo operador da catraca.
- O painel do aluno precisa funcionar bem no celular.
