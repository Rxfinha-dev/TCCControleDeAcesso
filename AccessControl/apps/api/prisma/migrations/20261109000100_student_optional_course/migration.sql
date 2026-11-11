-- Curso e série deixam de ser obrigatórios no aluno: escolas de ensino regular
-- organizam os alunos só por turma (class_groups).
ALTER TABLE "students" ALTER COLUMN "course_id" DROP NOT NULL;
ALTER TABLE "students" ALTER COLUMN "year" DROP NOT NULL;
