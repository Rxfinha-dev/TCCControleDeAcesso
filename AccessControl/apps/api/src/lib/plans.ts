import type { SchoolPlan } from '@prisma/client';

export const MODULES = ['ACCESS', 'ACADEMIC', 'ATTENDANCE', 'ASSESSMENTS'] as const;
export type Module = (typeof MODULES)[number];

// Explícito de propósito: não derivar da ordem do enum do banco.
export const PLAN_MODULES: Record<SchoolPlan, readonly Module[]> = {
  BASIC: ['ACCESS'],
  ACADEMIC: ['ACCESS', 'ACADEMIC'],
  ATTENDANCE: ['ACCESS', 'ACADEMIC', 'ATTENDANCE'],
  ASSESSMENTS: ['ACCESS', 'ACADEMIC', 'ATTENDANCE', 'ASSESSMENTS'],
};

/** Falha fechada: plano ausente ou desconhecido não libera nada. */
export function modulesOf(plan: SchoolPlan | null): Module[] {
  return [...(PLAN_MODULES[plan as SchoolPlan] ?? [])];
}

export function hasModule(plan: SchoolPlan | null, module: Module): boolean {
  return modulesOf(plan).includes(module);
}
