---
name: HelpUs
description: Controle de acesso escolar em que cada leitura da catraca é um carimbo no cartão de ponto do dia.
colors:
  sky: "#34bcfb"
  sky-hover: "#1fb0f3"
  sky-ink: "#05638e"
  sky-soft: "#dff1f8"
  sky-line: "#a9dcf3"
  on-sky: "#10202b"
  stamp: "#5b3f8c"
  stamp-soft: "#ebe3f3"
  graphite: "#24262a"
  graphite-raised: "#32353a"
  paper: "#efe7d2"
  surface: "#fbf8ef"
  ink: "#22252a"
  text: "#3b3a36"
  muted: "#625c4f"
  line: "#ddd3bb"
  input-hover: "#c6b997"
  placeholder: "#8a826f"
  dashed: "#cfc3a5"
  neutral-soft: "#e8e0cc"
  neutral-text: "#545045"
  success: "#276b3c"
  success-soft: "#e1eedb"
  success-line: "#a9cca0"
  warning: "#8a5300"
  warning-soft: "#f7e7c6"
  danger: "#9e2219"
  danger-soft: "#f6e0d9"
  danger-line: "#e2b3a8"
typography:
  display:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, Segoe UI Variable, system-ui, -apple-system, Roboto, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "IBM Plex Sans, Segoe UI, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.06em"
  stamp:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "1.05rem"
    fontWeight: 600
    fontFeature: "tnum"
  stamp-total:
    fontFamily: "IBM Plex Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "1.6rem"
    fontWeight: 600
    fontFeature: "tnum"
rounded:
  tag: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  gutter: "22px"
  lg: "24px"
  row: "26px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.on-sky}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.sky-hover}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.sky-soft}"
  button-danger:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.danger-soft}"
  button-small:
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "36px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "44px"
  nav-item:
    textColor: "#b9bfc5"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "44px"
  nav-item-hover:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "#ffffff"
  nav-item-active:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.on-sky}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "24px"
  timecard:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
  badge-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.tag}"
    padding: "3px 10px"
  badge-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.warning}"
    rounded: "{rounded.tag}"
    padding: "3px 10px"
  badge-primary:
    backgroundColor: "{colors.sky-soft}"
    textColor: "{colors.sky-ink}"
    rounded: "{rounded.tag}"
    padding: "3px 10px"
  badge-muted:
    backgroundColor: "{colors.neutral-soft}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.tag}"
    padding: "3px 10px"
  stamp-box:
    textColor: "{colors.stamp}"
    typography: "{typography.stamp}"
    rounded: "{rounded.sm}"
    padding: "1px 8px"
---

# Design System: HelpUs

## Overview

**Creative North Star: "O Cartão de Ponto"**

Cada leitura da catraca é um carimbo no cartão de ponto do dia. O sistema inteiro é um cartão de ponto de escola: cartolina creme no tema claro, grafite de relógio de ponto no tema escuro, horários batidos em tinta roxa de carimbo e um azul de marca reservado ao que se clica. A presença vem sozinha da catraca; a interface existe para que a escola confie no horário carimbado e só aja nas exceções.

A densidade é de ferramenta de trabalho, não de vitrine: tabelas com fios finos, linhas de 11 a 14px de respiro, cabeçalhos de coluna em versalete pequeno, um menu lateral grafite fixo. O Início não é uma fileira de cartões de indicador com gráfico genérico; é o Cartão do dia, uma tabela de leituras com cabeçalho, linhas e rodapé de totais.

Os tokens valem para os dois temas: os nomes são os mesmos e o tema escuro redefine os valores em `:root[data-theme='dark']` (valores escuros no sidecar). Rejeições confirmadas pelo produto: nada infantil, nada de escuro "hacker" (preto com neon), nada de ERP frio, nada de painel genérico de template.

**Key Characteristics:**
- Cartolina creme (claro) e grafite (escuro) como chão; superfícies de papel mais claro por cima.
- Tinta roxa de carimbo exclusiva dos horários, em IBM Plex Mono com números tabulares.
- Sky (#34bcfb) só em ações, navegação ativa e nas duas superfícies de marca aprovadas.
- Tinta vermelha para exceção e erro.
- Cantos de 6px, fios de 1px, sombras suaves e difusas.
- Um movimento assinatura: o carimbo que entra.

## Colors

Uma paleta de papel e tinta: neutros quentes de cartolina, um azul de marca para agir, um roxo de carimbo para o tempo e as tintas de estado.

### Primary
- **Azul Céu HelpUs** (sky): a cor da marca. Fundo do botão primário, item de navegação ativo, avatar, anel da foto do aluno, scanner ativo da Verificação, borda do painel "Acesso liberado". Texto sobre ele é sempre o **Azul Noite** (on-sky), escuro nos dois temas.
- **Azul Céu Pressionado** (sky-hover): hover do botão primário.
- **Azul Tinta** (sky-ink): links, botões de texto, ícones de apoio e texto de badge primário; é o sky legível sobre papel.
- **Azul Névoa** (sky-soft) e **Fio Azul** (sky-line): fundo e borda de faixas informativas, linha selecionada de tabela, hover de botão contornado, anel de foco dos campos e contorno de foco global.

### Secondary
- **Tinta de Carimbo** (stamp): roxo dos horários carimbados, dos totais do Cartão do dia, dos cabeçalhos de coluna do Cartão e do fio de 2px sob o cabeçalho do Cartão.
- **Carimbo Lavado** (stamp-soft): cor de seleção de texto.

### Tertiary
- **Tinta de Estado**: success / warning / danger, cada uma com `-soft` (fundo) e, quando há moldura, `-line` (borda). Danger é a tinta vermelha: mensagens de erro, botão destrutivo e a etiqueta de exceção (entrada manual pelo RM). Warning conta as digitais pendentes.

### Neutral
- **Cartolina** (paper): fundo da página, campos desabilitados, hover de linha selecionável, painéis embutidos (foto, conexão, cadastro de digital).
- **Papel** (surface): cartões, campos, diálogos, gaveta.
- **Grafite** (graphite) e **Grafite Elevado** (graphite-raised): menu lateral, barra superior do celular, toasts; hover dos itens do menu.
- **Tinta** (ink): títulos e texto de destaque. **Texto** (text): corpo. **Apagado** (muted): apoio e cabeçalhos de tabela comuns.
- **Fio** (line): bordas e divisórias de 1px. **Fio Tracejado** (dashed): área de cadastro de digital aguardando.

### Named Rules
**A Regra da Tinta de Carimbo.** O roxo de carimbo pertence ao tempo: horários, totais do dia e a moldura do Cartão. Nunca vira cor de botão, link ou estado.

**A Regra do Céu que se Clica.** Sky marca o que se clica e onde se está. As únicas superfícies grandes em sky são o painel de marca do login e a faixa "Acesso liberado" da Verificação, por decisão do dono do produto; fora delas, sky em área grande é erro.

**A Regra da Tinta Vermelha.** Vermelho é exceção: erro, ação destrutiva e entrada fora da catraca. Uma exceção recebe etiqueta emoldurada em vermelho, nunca uma cor de linha inteira.

## Typography

**Display Font:** IBM Plex Sans (com Segoe UI, system-ui)
**Body Font:** IBM Plex Sans (com Segoe UI, Segoe UI Variable, system-ui, Roboto, Arial)
**Label/Mono Font:** IBM Plex Mono (com ui-monospace, Cascadia Mono, Consolas)

**Character:** uma sans técnica e calma para tudo o que se lê, e uma mono de relógio de ponto para tudo o que se marca. As duas vêm do Google Fonts (Sans 400/500/600/700, Mono 500/600) com fallback de sistema declarado.

### Hierarchy
- **Display** (600, 1.85rem, 1.2, -0.02em): título de página; cai para 1.6rem abaixo de 860px. O cartão de login usa 1.75rem.
- **Headline** (600, 1.5rem, 1.2): título do Cartão do dia. Títulos de resultado da Verificação escalam com clamp(1.6rem, 2.6vw, 2.2rem).
- **Title** (600, 1.1rem a 1.3rem): títulos de cartão, gaveta e diálogo.
- **Body** (400, 15px, 1.55): texto corrido; dicas em 0.85rem no tom apagado. Rótulos de campo em 600, 0.875rem, cor de tinta.
- **Label** (600, 0.75rem, 0.06em, maiúsculas): cabeçalhos de coluna de tabela. No Cartão do dia ficam em tinta de carimbo; nas demais tabelas, em apagado.
- **Stamp** (Mono 600, números tabulares): horários. 1.05rem nas linhas do Cartão; 1.6rem nos totais e nas digitais pendentes; clamp(2.4rem, 4vw, 3.4rem) no carimbo da Verificação.

### Named Rules
**A Regra da Mono que Marca.** IBM Plex Mono só aparece em horários, RM e colunas numéricas, sempre com números tabulares. Texto corrido em mono é erro.

**A Regra do Carimbo Torto.** Horário curto carimbado gira -1.5deg, como um carimbo de verdade. Data e hora completas em tabela ficam retas: o giro só cabe em horários curtos.

## Layout

Casca de duas colunas: menu lateral grafite fixo de 256px e conteúdo com largura máxima de 1280px, centralizado, com respiro lateral clamp(16px, 3.2vw, 48px), 40px no topo e 64px na base; as seções empilham com 24px. Grades de trabalho usam calha de 22px: o Início é coluna larga (Cartão do dia) e coluna estreita de 260 a 320px (pendentes e atalhos); a Verificação é coluna de 290 a 360px (scanner) e painel de resultado; cadastros usam coluna de 290 a 340px e lista.

Pontos de quebra observados: 1100px (Início vira uma coluna), 960px (cadastro e Verificação viram uma coluna), 860px (o menu vira gaveta de 272px atrás de uma barra grafite de 60px; o login empilha), 640px (o Cartão do dia esconde o curso e aperta o respiro para 16px), 480px (linhas de campos viram uma coluna, cartões caem para 18px de respiro, filtros ocupam a largura toda).

Alvos de toque têm no mínimo 44px (botões, campos, itens de menu); botões pequenos têm 36px.

## Elevation & Depth

Profundidade híbrida e discreta: fios finos de 1px separam conteúdo, e sombras suaves e difusas, com deslocamento para baixo e espalhamento negativo, erguem papéis sobre a cartolina. As sombras são ambientes, nunca estruturais nem duras; no tema escuro ficam mais densas e os cartões ganham um fio claro de 5% no lugar do contraste perdido.

### Shadow Vocabulary
- **Papel** (`box-shadow: 0 1px 1px rgba(60, 48, 20, 0.06), 0 6px 16px -10px rgba(60, 48, 20, 0.22)`): cartões, Cartão do dia, painel de resultado.
- **Papel Erguido** (`box-shadow: 0 2px 4px rgba(60, 48, 20, 0.06), 0 24px 48px -28px rgba(60, 48, 20, 0.34)`): cartão de login e gaveta lateral.
- **Brilho Liberado** (`box-shadow: 0 28px 60px -36px var(--sky-glow)`): só o painel "Acesso liberado".
- **Anel de Foco** (`box-shadow: 0 0 0 3px var(--sky-soft)`): campo em foco.

### Named Rules
**A Regra do Papel Assentado.** Sombra é a de papel sobre mesa: difusa, deslocada para baixo, de tom quente no claro. Sombra dura deslocada ou brilho colorido fora do "Acesso liberado" não pertence a este mundo.

## Shapes

Cantos discretos e consistentes: 6px em botões, campos, itens de menu, faixas e carimbos emoldurados; 8px em cartões, diálogos e o Cartão do dia; 10px no cartão de login, painel de resultado e na borda interna da gaveta. Etiquetas e badges usam 4px. Círculos só para avatar, foto do aluno, ponto de estado, botão de ícone e scanner. Fios: 1px para divisórias e bordas, 1.5px em botões e campos, 2px na moldura do carimbo, no fio de carimbo sob o cabeçalho do Cartão e na borda do resultado liberado. Tracejado só no cadastro de digital aguardando e na separação da entrada manual.

## Components

### Buttons
Firmes e baixos, de leitura imediata.
- **Shape:** cantos discretos (6px), altura mínima de 44px, borda de 1.5px, peso 600, 0.95rem, ícone de 20px com 8px de espaço.
- **Primary:** fundo sky, texto azul noite; hover escurece para sky-hover.
- **Outline:** fundo papel, borda fio, texto tinta; hover troca a borda para sky e o fundo para azul névoa.
- **Danger:** fundo papel, texto e borda em tinta vermelha; hover com fundo vermelho lavado.
- **Estados:** pressionado desce 1px; desabilitado a 50% de opacidade; foco com contorno de 3px em fio azul, afastado 2px.
- **Small:** 36px de altura, 0 14px, 0.85rem. **Botão de texto:** sem fundo, azul tinta, sublinha no hover.

### Chips (badges)
- **Style:** fundo lavado da tinta de estado, texto na tinta cheia, cantos de 4px, 0.78rem 600, com ponto de 6px na cor do texto à esquerda.
- **State:** success, warning, primary (sky) e muted.
- **Etiqueta de tinta:** a exceção (ex.: "Manual") é uma etiqueta emoldurada em vermelho, maiúsculas 0.72rem com 0.06em, borda de 1.5px e cantos de 4px.

### Cards / Containers
- **Corner Style:** 8px.
- **Background:** papel sobre cartolina.
- **Shadow Strategy:** Papel (ver Elevation & Depth).
- **Border:** transparente no claro; fio claro de 5% no escuro.
- **Internal Padding:** 24px (18px abaixo de 480px).
- **Faixa informativa:** azul névoa com fio azul, cantos de 6px, 12px 18px.

### Inputs / Fields
- **Style:** fundo papel, borda de 1.5px em fio, cantos de 6px, 44px de altura, 0 14px.
- **Hover:** borda escurece para input-hover.
- **Focus:** borda sky com anel de 3px em azul névoa.
- **Disabled:** fundo cartolina, texto apagado. **Erro de formulário:** bloco vermelho lavado, texto em tinta vermelha 600.

### Navigation
- **Menu lateral:** grafite fixo, 256px, itens de 44px com ícone e 14px de espaço, texto cinza claro 500. Hover em grafite elevado com texto branco; ativo em sky com texto azul noite 600. Rodapé com estado do leitor (ponto verde ou cinza) e usuário com avatar sky.
- **Celular (≤860px):** barra grafite de 60px com menu, logo e ponto do leitor; o menu desliza da esquerda como gaveta de 272px sobre fundo escurecido.

### Cartão do dia (assinatura)
O cartão de ponto da escola. Papel com fio de 1px, cantos de 8px e sombra Papel. Cabeçalho com título (headline), data e um chip do leitor, fechado por um fio de 2px em tinta de carimbo. Tabela com cabeçalhos de coluna em versalete roxo, linhas com aluno (tinta 500), curso (apagado) e horário alinhado à direita em mono roxo girado. A leitura mais recente leva o carimbo emoldurado (borda de 2px na cor da tinta, cantos de 6px), parado. Rodapé com totais em mono roxo de 1.6rem.

### Carimbo que entra (movimento assinatura)
Quando uma leitura chega na Verificação, o carimbo emoldurado entra de escala 1.35 e giro de -6deg para escala 1 e -1.5deg em 0.32s com `cubic-bezier(0.16, 1, 0.3, 1)`. Em `prefers-reduced-motion: reduce` não há animação. O painel de resultado liberado ganha borda sky de 2px, faixa sky com o título e o Brilho Liberado.

### Scanner da Verificação
Círculo de 150px em azul névoa com dois anéis concêntricos em fio azul. Ativo: fundo sky e anéis em ondulação contínua de 1.8s. Desconectado: neutro lavado com anéis em fio.

## Do's and Don'ts

### Do:
- **Do** usar IBM Plex Mono 600 com números tabulares e tinta de carimbo para todo horário, RM e total do dia.
- **Do** girar -1.5deg só horários curtos; manter retas data e hora completas em tabela.
- **Do** emoldurar o carimbo (borda de 2px, cantos de 6px) apenas na leitura mais recente do Cartão do dia e na leitura da Verificação.
- **Do** marcar exceção com a etiqueta emoldurada em tinta vermelha, ao lado do nome.
- **Do** manter alvos de toque de 44px e o contorno de foco de 3px em fio azul.
- **Do** definir toda cor nova como token nos dois temas (`:root` e `:root[data-theme='dark']`).
- **Do** respeitar `prefers-reduced-motion`: carimbo, ondulação, gaveta e toasts ficam parados.

### Don't:
- **Don't** abrir o Início com uma fileira de cartões de indicador e gráfico genérico; o Início é o Cartão do dia.
- **Don't** usar sky em superfície grande fora do painel de marca do login e da faixa "Acesso liberado".
- **Don't** usar a tinta de carimbo em botões, links ou estados.
- **Don't** usar sombra dura deslocada ou brilho neon; o tema escuro é grafite quente, não preto com neon.
- **Don't** escrever texto corrido em mono.
- **Don't** alterar o logo HelpUs nem trocar o sky por outro azul de marca.
