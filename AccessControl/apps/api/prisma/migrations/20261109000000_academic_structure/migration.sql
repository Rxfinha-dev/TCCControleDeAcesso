-- Estrutura acadêmica: professores, disciplinas, turmas, matrículas, atribuições e grade semanal versionada.
-- FKs de disciplina/professor usam NO ACTION (checado no fim do comando) para que a exclusão em cascata
-- de uma escola não falhe; a exclusão avulsa em uso é barrada pela API.

-- CreateEnum
CREATE TYPE "Shift" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'FULL_TIME');

-- CreateEnum
CREATE TYPE "TimetableSlotKind" AS ENUM ('LESSON', 'BREAK');

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "contact_email" VARCHAR(120),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "abbreviation" VARCHAR(8) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_groups" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "name" VARCHAR(40) NOT NULL,
    "school_year" INTEGER NOT NULL,
    "shift" "Shift" NOT NULL,
    "course_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" SERIAL NOT NULL,
    "class_group_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "school_year" INTEGER NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teaching_assignments" (
    "id" SERIAL NOT NULL,
    "class_group_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_versions" (
    "id" SERIAL NOT NULL,
    "class_group_id" INTEGER NOT NULL,
    "valid_from" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timetable_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_slots" (
    "id" SERIAL NOT NULL,
    "version_id" INTEGER NOT NULL,
    "kind" "TimetableSlotKind" NOT NULL,
    "subject_id" INTEGER,
    "weekday" INTEGER NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "end_minute" INTEGER NOT NULL,

    CONSTRAINT "timetable_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teachers_school_id_name_idx" ON "teachers"("school_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_school_id_name_key" ON "subjects"("school_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "class_groups_school_id_school_year_name_key" ON "class_groups"("school_id", "school_year", "name");

-- CreateIndex
CREATE INDEX "enrollments_student_id_school_year_idx" ON "enrollments"("student_id", "school_year");

-- CreateIndex
CREATE INDEX "enrollments_class_group_id_idx" ON "enrollments"("class_group_id");

-- CreateIndex
CREATE INDEX "teaching_assignments_teacher_id_idx" ON "teaching_assignments"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "teaching_assignments_class_group_id_subject_id_key" ON "teaching_assignments"("class_group_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "timetable_versions_class_group_id_valid_from_key" ON "timetable_versions"("class_group_id", "valid_from");

-- CreateIndex
CREATE INDEX "timetable_slots_version_id_idx" ON "timetable_slots"("version_id");

-- CreateIndex
CREATE INDEX "timetable_slots_subject_id_idx" ON "timetable_slots"("subject_id");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_groups" ADD CONSTRAINT "class_groups_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teaching_assignments" ADD CONSTRAINT "teaching_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_versions" ADD CONSTRAINT "timetable_versions_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "timetable_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_slots" ADD CONSTRAINT "timetable_slots_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE NO ACTION ON UPDATE CASCADE;


-- Um aluno tem no máximo uma matrícula aberta por ano letivo.
CREATE UNIQUE INDEX "enrollments_open_key" ON "enrollments" ("student_id", "school_year") WHERE "end_date" IS NULL;

-- RLS como nas demais tabelas: a API acessa com o papel do banco; a Data API do Supabase fica bloqueada.
ALTER TABLE "teachers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "class_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "teaching_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timetable_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "timetable_slots" ENABLE ROW LEVEL SECURITY;
