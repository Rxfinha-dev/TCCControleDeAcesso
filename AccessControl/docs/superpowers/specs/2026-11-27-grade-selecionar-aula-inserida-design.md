# Grade: aula inserida já fica selecionada

**Por quê:** inserir aulas arrastando ou clicando é o jeito principal (e deve continuar sendo), mas a posição fica imprecisa. O ajuste exato (campos Início/Fim do "Bloco selecionado") só aparecia depois de um clique extra no bloco.

**Objetivo:** ao inserir uma aula ou intervalo na grade (arrastar ou clicar), o bloco novo já fica selecionado e o foco vai para o campo Início.

**Remoção mais fácil:** além do botão "Remover", (a) com um bloco selecionado, apertar Delete ou Backspace remove o bloco (exceto quando o foco está num campo de texto/hora/select); (b) arrastar um bloco da grade e soltá-lo na coluna de disciplinas (paleta) remove o bloco. "Soltar em qualquer lugar fora da grade" foi descartado: o arrastar nativo não distingue isso de cancelar com Esc.

**Não muda:** posição inicial onde soltou (encaixe de 5 min), duração padrão (aula 50 min, intervalo 20 min), arrastar/redimensionar.

**Fora do escopo:** formulário "Adicionar aula" (tiraria o sentido do arrastar); encaixar a aula nova após a anterior.

## Abordagens

1. **Selecionar o bloco recém-inserido** — escolhida: poucas linhas, mantém o arrastar como fluxo principal.
2. Formulário lateral de adicionar aula — descartada: mais código e um segundo jeito de inserir que compete com o arrastar.

## Decisões do builder

- O editor gera a chave do bloco (`newKey()`) e a passa na ação `place`, para poder selecioná-lo.
- Foco no Início só quando a seleção vem de uma inserção (clicar num bloco existente não move o foco).
