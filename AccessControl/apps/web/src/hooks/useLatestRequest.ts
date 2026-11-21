import { useCallback, useRef } from 'react';

/**
 * Para cargas que podem se sobrepor (troca de turma, de ano, busca): cada chamada de `begin()` marca uma nova carga
 * e devolve `isCurrent()`, que só continua verdadeiro enquanto nenhuma carga mais nova começou.
 * Resposta atrasada de uma carga antiga é ignorada em vez de sobrescrever a tela.
 */
export function useLatestRequest() {
  const counter = useRef(0);
  return useCallback(() => {
    const id = ++counter.current;
    return () => id === counter.current;
  }, []);
}
