import {
  fromTimetable,
  overlappingKeys,
  timetableReducer,
  visibleRange,
  type EditorBlock,
} from '../src/components/timetable/timetableReducer';

const block = (over: Partial<EditorBlock> = {}): EditorBlock => ({
  key: 'a',
  kind: 'LESSON',
  subjectId: 1,
  weekday: 1,
  startMinute: 450,
  endMinute: 500,
  ...over,
});

describe('timetableReducer', () => {
  it('place: aula solta em 07:32 vira 07:30–08:20 (50 min); intervalo tem 20 min', () => {
    const [lesson] = timetableReducer([], { type: 'place', kind: 'LESSON', subjectId: 1, weekday: 2, minute: 452 });
    expect(lesson).toMatchObject({ kind: 'LESSON', subjectId: 1, weekday: 2, startMinute: 450, endMinute: 500 });
    const [pause] = timetableReducer([], { type: 'place', kind: 'BREAK', subjectId: null, weekday: 1, minute: 600 });
    expect(pause).toMatchObject({ kind: 'BREAK', subjectId: null, startMinute: 600, endMinute: 620 });
  });

  it('place perto da meia-noite não passa de 24:00', () => {
    const [lesson] = timetableReducer([], { type: 'place', kind: 'LESSON', subjectId: 1, weekday: 1, minute: 1430 });
    expect(lesson).toMatchObject({ startMinute: 1390, endMinute: 1440 });
  });

  it('resize end para 08:47 encaixa em 08:45', () => {
    const [resized] = timetableReducer([block()], { type: 'resize', key: 'a', edge: 'end', minute: 527 });
    expect(resized.endMinute).toBe(525);
  });

  it('resize não deixa o fim chegar no início (mínimo 5 min)', () => {
    const [end] = timetableReducer([block()], { type: 'resize', key: 'a', edge: 'end', minute: 300 });
    expect(end).toMatchObject({ startMinute: 450, endMinute: 455 });
    const [start] = timetableReducer([block()], { type: 'resize', key: 'a', edge: 'start', minute: 900 });
    expect(start).toMatchObject({ startMinute: 495, endMinute: 500 });
  });

  it('move mantém a duração e não passa de 24:00 nem de 00:00', () => {
    const [moved] = timetableReducer([block()], { type: 'move', key: 'a', weekday: 3, minute: 601 });
    expect(moved).toMatchObject({ weekday: 3, startMinute: 600, endMinute: 650 });
    const [late] = timetableReducer([block()], { type: 'move', key: 'a', weekday: 3, minute: 1435 });
    expect(late).toMatchObject({ startMinute: 1390, endMinute: 1440 });
    const [early] = timetableReducer([block()], { type: 'move', key: 'a', weekday: 3, minute: -30 });
    expect(early).toMatchObject({ startMinute: 0, endMinute: 50 });
  });

  it('setTimes encaixa nos 5 min; remove e replace', () => {
    const [timed] = timetableReducer([block()], { type: 'setTimes', key: 'a', startMinute: 481, endMinute: 532 });
    expect(timed).toMatchObject({ startMinute: 480, endMinute: 530 });
    expect(timetableReducer([block()], { type: 'remove', key: 'a' })).toEqual([]);
    expect(timetableReducer([block()], { type: 'replace', blocks: [block({ key: 'z' })] })).toEqual([block({ key: 'z' })]);
  });

  it('overlappingKeys marca só os dois sobrepostos (encostados não contam)', () => {
    const blocks = [
      block({ key: 'a', startMinute: 450, endMinute: 500 }),
      block({ key: 'b', startMinute: 480, endMinute: 530 }),
      block({ key: 'c', startMinute: 530, endMinute: 580 }),
      block({ key: 'd', weekday: 2, startMinute: 450, endMinute: 500 }),
    ];
    expect([...overlappingKeys(blocks)].sort()).toEqual(['a', 'b']);
  });

  it('visibleRange amplia o turno para caber os blocos, em horas cheias', () => {
    expect(visibleRange('MORNING', [block({ startMinute: 790, endMinute: 840 })])).toEqual({ from: 420, to: 840 });
    expect(visibleRange('AFTERNOON', [])).toEqual({ from: 720, to: 1140 });
    expect(visibleRange('EVENING', [])).toEqual({ from: 1080, to: 1440 });
    expect(visibleRange('MORNING', [block({ startMinute: 395, endMinute: 445 })])).toEqual({ from: 360, to: 780 });
  });

  it('fromTimetable descarta aulas de disciplinas sem atribuição e mantém intervalos', () => {
    const result = fromTimetable(
      [
        { id: 1, kind: 'LESSON', weekday: 1, startMinute: 450, endMinute: 500, subject: { id: 1, name: 'Matemática', abbreviation: 'MAT', color: '#000000' }, teacher: null },
        { id: 2, kind: 'LESSON', weekday: 1, startMinute: 500, endMinute: 550, subject: { id: 9, name: 'Física', abbreviation: 'FIS', color: '#000000' }, teacher: null },
        { id: 3, kind: 'BREAK', weekday: 1, startMinute: 550, endMinute: 570, subject: null, teacher: null },
      ],
      new Set([1]),
    );
    expect(result.discarded).toBe(1);
    expect(result.blocks.map(({ kind, subjectId }) => [kind, subjectId])).toEqual([
      ['LESSON', 1],
      ['BREAK', null],
    ]);
  });
});
