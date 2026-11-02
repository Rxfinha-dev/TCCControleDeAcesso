import { dayBoundary, firstName, yearLabel } from '../src/utils/format';
import { onlyDigits, validatePasswordPair } from '../src/utils/validation';

describe('Utilitários', () => {
  it('mostra apenas o primeiro nome (menu principal)', () => {
    expect(firstName('  ETEC Joaquim Ferreira ')).toBe('ETEC');
    expect(firstName('')).toBe('');
  });

  it('converte a série para o rótulo exibido', () => {
    expect(yearLabel('FIRST')).toBe('1º Ano');
    expect(yearLabel('THIRD')).toBe('3º Ano');
  });

  it('valida as senhas com a regra do legado', () => {
    expect(validatePasswordPair('abc', 'abd')).toBe('As senhas não coincidem');
    expect(validatePasswordPair('12345678', '12345678')).toMatch(/mínimo 9/);
    expect(validatePasswordPair('123456789', '123456789')).toBeNull();
  });

  it('aceita apenas dígitos no código', () => {
    expect(onlyDigits('12a3-45678')).toBe('123456');
  });

  it('calcula início e fim do dia local', () => {
    expect(dayBoundary('')).toBeUndefined();
    expect(new Date(dayBoundary('2026-03-10')!).getHours()).toBe(0);
    expect(new Date(dayBoundary('2026-03-10', true)!).getHours()).toBe(23);
  });
});
