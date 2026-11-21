import { hasModule, modulesOf } from '../src/lib/plans';

describe('modulesOf', () => {
  it('traduz cada plano em seus módulos', () => {
    expect(modulesOf('BASIC')).toEqual(['ACCESS']);
    expect(modulesOf('ACADEMIC')).toEqual(['ACCESS', 'ACADEMIC']);
    expect(modulesOf('ATTENDANCE')).toEqual(['ACCESS', 'ACADEMIC', 'ATTENDANCE']);
    expect(modulesOf('ASSESSMENTS')).toEqual(['ACCESS', 'ACADEMIC', 'ATTENDANCE', 'ASSESSMENTS']);
  });

  it('hasModule responde por plano e módulo', () => {
    expect(hasModule('ATTENDANCE', 'ASSESSMENTS')).toBe(false);
    expect(hasModule('ASSESSMENTS', 'ACCESS')).toBe(true);
  });

  it('falha fechada com plano nulo ou desconhecido', () => {
    expect(modulesOf(null)).toEqual([]);
    expect(modulesOf('X' as never)).toEqual([]);
  });
});
