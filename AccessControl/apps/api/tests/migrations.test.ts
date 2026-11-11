import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = readFileSync(join(__dirname, '../prisma/migrations/20261108000000_users_roles/migration.sql'), 'utf-8');

describe('Migration users_roles', () => {
  it('habilita RLS na tabela users, como nas demais tabelas', () => {
    expect(migration).toMatch(/ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;/);
  });
});

const academic = readFileSync(
  join(__dirname, '../prisma/migrations/20261109000000_academic_structure/migration.sql'),
  'utf-8',
);

describe('Migration academic_structure', () => {
  it.each([
    'teachers',
    'subjects',
    'class_groups',
    'enrollments',
    'teaching_assignments',
    'timetable_versions',
    'timetable_slots',
  ])('habilita RLS em %s', (table) => {
    expect(academic).toMatch(new RegExp(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`));
  });

  it('garante uma matrícula aberta por aluno e ano', () => {
    expect(academic).toMatch(
      /CREATE UNIQUE INDEX "enrollments_open_key" ON "enrollments" \("student_id", "school_year"\) WHERE "end_date" IS NULL;/,
    );
  });
});

describe('Migration student_optional_course', () => {
  const sql = readFileSync(
    join(__dirname, '../prisma/migrations/20261109000100_student_optional_course/migration.sql'),
    'utf-8',
  );

  it('torna curso e série do aluno opcionais', () => {
    expect(sql).toMatch(/ALTER COLUMN "course_id" DROP NOT NULL/);
    expect(sql).toMatch(/ALTER COLUMN "year" DROP NOT NULL/);
  });
});
