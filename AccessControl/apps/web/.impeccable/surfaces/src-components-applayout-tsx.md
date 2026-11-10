---
version: 1
slug: "src-components-applayout-tsx"
primary_target: "src/components/AppLayout.tsx"
related_targets: ["src/pages/DashboardPage.tsx","src/pages/VerificationPage.tsx","src/styles/global.css"]
---

# Painel HelpUs (app inteiro)

Escopo: redesenho de todas as telas do `apps/web` (login, cadastro, Início, Alunos, Cursos, Verificação, Entradas, Configurações, Escolas, Usuários) e das telas novas do módulo acadêmico. Modo: Operate. Vitrine: Início.

Público e tarefa: secretaria cadastra e acompanha; porteiro deixa a Verificação aberta; super admin troca de escola. Ação principal do Início: ver as leituras de hoje e abrir a Verificação.

Restrições: logo HelpUs intocado; sky `#34bcfb` é a cor principal da marca (ações e navegação ativa); tema claro e escuro com o botão; não pode parecer infantil, escuro hacker, ERP frio nem template.

## Adaptações registradas (revisão final)

- Atraso em tinta vermelha: ainda não há grade nem presença por aula (etapa 2 do módulo acadêmico), então atraso não é calculável. Hoje a exceção em tinta vermelha é a entrada manual pelo RM. Atraso entra quando a presença por aula existir.
- Sky em superfícies grandes (painel do login e faixa "Acesso liberado"): mantido por decisão do usuário ("Cor azul (sky)" intocável, cor principal da marca). Fora disso, sky só em ações e navegação ativa.
- Fontes pelo Google Fonts, sem auto-hospedagem: decisão de escopo (nenhuma rede escolar bloqueando foi observada); fallback de sistema declarado. Revisar se uma escola relatar fonte trocada.

## Direction contract

THESIS: cada leitura da catraca é um carimbo no cartão de ponto do dia. Recusa a fileira de quatro cartões de indicador com gráfico genérico.

OWN-WORLD: fundo de cartolina creme (claro) ou grafite de relógio de ponto (escuro); tinta roxa de carimbo só nos horários; sky só no que se clica e na navegação ativa; vermelho de tinta para atraso e erro. IBM Plex Sans no texto, IBM Plex Mono só em horários, RM e números tabulares. Cantos de 6px, fios finos, sombras suaves com deslocamento.

STORY: a escola entende que a presença vem sozinha da catraca, confia no horário carimbado e só age nas exceções.

FIRST VIEWPORT: menu lateral grafite à esquerda; no Início, o Cartão do dia ocupa a coluna larga: cabeçalho com escola, data e estado do leitor, linhas com aluno, curso e horário carimbado em mono roxo, rodapé com totais do dia. Coluna estreita: digitais pendentes e atalhos. Ação principal "Abrir Verificação" no cabeçalho.

FORM: Cartão de ponto, posição 1 da lista ordenada; seed:d2e44fab08eaf1a3. Movimento assinatura: o carimbo emoldurado entra (escala e leve giro, ease-out) quando uma leitura chega na Verificação; no Cartão do dia, que não atualiza ao vivo, a leitura mais recente leva o mesmo carimbo emoldurado, parado.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
