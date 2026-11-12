/** Regras puras de notas e médias (sem banco): usadas pelas telas, pelo painel do aluno e pelo boletim. */

export interface Concept {
  label: string;
  value: number;
}

/** Sistema de notas da escola. Em CONCEPT, `concepts` vem do maior para o menor valor. */
export interface Grading {
  kind: 'NUMERIC' | 'CONCEPT';
  max: number;
  decimals: number;
  /** Menor nota (ou valor de conceito) que aprova. */
  passing: number;
  concepts: Concept[];
}

export const DEFAULT_CONCEPTS: Concept[] = [
  { label: 'MB', value: 4 },
  { label: 'B', value: 3 },
  { label: 'R', value: 2 },
  { label: 'I', value: 1 },
];

/** Uma média (ou nota) pronta para exibir. `value: null` = ainda sem nota. */
export interface GradeCell {
  value: number | null;
  label: string | null;
  passed: boolean | null;
}

export interface Averages {
  /** Bimestres 1 a 4. */
  terms: GradeCell[];
  /** Semestres 1 e 2. */
  semesters: GradeCell[];
  annual: GradeCell;
}

const round = (value: number, decimals: number) => Number(value.toFixed(decimals));

/** Conceito de valor mais próximo (no empate, o maior). */
function nearestConcept(value: number, concepts: Concept[]) {
  return concepts.reduce((best, concept) => (Math.abs(concept.value - value) < Math.abs(best.value - value) ? concept : best));
}

/** A nota é aceita pelo sistema de notas? */
export function isValidGrade(value: number, grading: Grading) {
  if (grading.kind === 'CONCEPT') return grading.concepts.some((concept) => concept.value === value);
  return value >= 0 && value <= grading.max && round(value, grading.decimals) === value;
}

/** Exibição de uma nota ou média: número com as casas da escola, ou o conceito mais próximo. */
export function gradeCell(value: number | null, grading: Grading): GradeCell {
  if (value === null) return { value: null, label: null, passed: null };
  if (grading.kind === 'CONCEPT' && grading.concepts.length > 0) {
    const concept = nearestConcept(value, grading.concepts);
    return { value: round(value, 2), label: concept.label, passed: concept.value >= grading.passing };
  }
  const shown = round(value, grading.decimals);
  return { value: shown, label: shown.toFixed(grading.decimals).replace('.', ','), passed: shown >= grading.passing };
}

/** Média ponderada pelos pesos; null sem nenhuma nota. */
export function weightedAverage(items: { value: number; weight: number }[]) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return null;
  return items.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;
}

/** Média simples dos valores que existem; null se nenhum existe. */
export function mean(values: (number | null)[]) {
  const known = values.filter((value): value is number => value !== null);
  return known.length === 0 ? null : known.reduce((sum, value) => sum + value, 0) / known.length;
}

/** Bimestre (1 a 4) em que a data cai, ou null se está fora de todos. Datas em 'YYYY-MM-DD'. */
export function termOf(date: string, terms: { number: number; startDate: string; endDate: string }[]) {
  return terms.find((term) => term.startDate <= date && date <= term.endDate)?.number ?? null;
}

/**
 * Médias de uma disciplina: bimestral = ponderada pelos pesos; semestral e anual = média simples dos
 * bimestres que têm nota. Tudo é calculado com os valores numéricos; só a exibição vira conceito.
 */
export function averages(grades: { term: number; value: number; weight: number }[], grading: Grading): Averages {
  const terms = [1, 2, 3, 4].map((term) => weightedAverage(grades.filter((grade) => grade.term === term)));
  const cell = (value: number | null) => gradeCell(value, grading);
  return {
    terms: terms.map(cell),
    semesters: [cell(mean([terms[0], terms[1]])), cell(mean([terms[2], terms[3]]))],
    annual: cell(mean(terms)),
  };
}
