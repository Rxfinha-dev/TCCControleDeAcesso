-- Avaliações, notas e sistema de notas (etapa 5 do módulo acadêmico).
-- CreateEnum
CREATE TYPE "AssessmentKind" AS ENUM ('EXAM', 'ASSIGNMENT');

-- CreateEnum
CREATE TYPE "GradingKind" AS ENUM ('NUMERIC', 'CONCEPT');

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "grade_concepts" JSONB,
ADD COLUMN     "grade_decimals" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "grade_max" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "grading_kind" "GradingKind" NOT NULL DEFAULT 'NUMERIC',
ADD COLUMN     "passing_grade" DOUBLE PRECISION NOT NULL DEFAULT 6;

-- CreateTable
CREATE TABLE "assessments" (
    "id" SERIAL NOT NULL,
    "class_group_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "kind" "AssessmentKind" NOT NULL,
    "date" DATE NOT NULL,
    "start_minute" INTEGER,
    "title" VARCHAR(100) NOT NULL,
    "content" VARCHAR(2000),
    "note" VARCHAR(300),
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "assessment_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "user_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("assessment_id","student_id")
);

-- CreateIndex
CREATE INDEX "assessments_class_group_id_date_idx" ON "assessments"("class_group_id", "date");

-- CreateIndex
CREATE INDEX "grades_student_id_idx" ON "grades"("student_id");

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- RLS: as tabelas só são acessadas pela API (conexão de serviço).
ALTER TABLE "assessments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "grades" ENABLE ROW LEVEL SECURITY;
