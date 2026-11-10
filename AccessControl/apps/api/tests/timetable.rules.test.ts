import { findOverlaps, findTeacherConflicts } from '../src/modules/class-groups/timetable.rules';

const block = (weekday: number, start: number, end: number) => ({ weekday, startMinute: start, endMinute: end });

describe('Regras da grade', () => {
  describe('findOverlaps', () => {
    it('acha sobreposição parcial', () => {
      expect(findOverlaps([block(1, 450, 500), block(1, 480, 530)])).toEqual([[0, 1]]);
    });

    it('acha bloco contido em outro', () => {
      expect(findOverlaps([block(2, 450, 600), block(2, 480, 500)])).toEqual([[0, 1]]);
    });

    it('blocos encostados (fim = início) não se sobrepõem', () => {
      expect(findOverlaps([block(1, 450, 500), block(1, 500, 550)])).toEqual([]);
    });

    it('mesmo horário em dias diferentes não se sobrepõe', () => {
      expect(findOverlaps([block(1, 450, 500), block(2, 450, 500)])).toEqual([]);
    });

    it('devolve todos os pares sobrepostos', () => {
      expect(findOverlaps([block(1, 450, 600), block(1, 460, 470), block(1, 590, 620)])).toEqual([
        [0, 1],
        [0, 2],
      ]);
    });
  });

  describe('findTeacherConflicts', () => {
    const mine = [{ teacherId: 8, teacherName: 'Ana Prado', ...block(1, 450, 500) }];

    it('avisa quando o mesmo professor está em outra turma no mesmo horário', () => {
      const others = [{ teacherId: 8, teacherName: 'Ana Prado', classGroupName: '2º DS B', ...block(1, 480, 530) }];
      expect(findTeacherConflicts(mine, others)).toEqual([
        { weekday: 1, startMinute: 450, endMinute: 500, teacherName: 'Ana Prado', classGroupName: '2º DS B' },
      ]);
    });

    it('ignora outro professor no mesmo horário', () => {
      const others = [{ teacherId: 9, teacherName: 'Caio', classGroupName: '2º DS B', ...block(1, 450, 500) }];
      expect(findTeacherConflicts(mine, others)).toEqual([]);
    });

    it('ignora o mesmo professor em outro dia ou horário encostado', () => {
      const others = [
        { teacherId: 8, teacherName: 'Ana Prado', classGroupName: '2º DS B', ...block(2, 450, 500) },
        { teacherId: 8, teacherName: 'Ana Prado', classGroupName: '2º DS B', ...block(1, 500, 550) },
      ];
      expect(findTeacherConflicts(mine, others)).toEqual([]);
    });
  });
});
