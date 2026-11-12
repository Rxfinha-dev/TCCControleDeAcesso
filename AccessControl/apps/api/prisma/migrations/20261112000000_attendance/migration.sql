-- Presença: só o que não dá para derivar é gravado (correções manuais e aulas canceladas), mais a
-- frequência mínima da escola. A aula é identificada por turma + data + minuto de início, porque os
-- blocos da grade são recriados a cada gravação e os ids deles não são estáveis.

-- CreateEnum
CREATE TYPE "CancellationReason" AS ENUM ('TEACHER_ABSENT', 'CANCELLED');

-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "min_attendance" INTEGER NOT NULL DEFAULT 75;

-- CreateTable
CREATE TABLE "attendance_overrides" (
    "id" SERIAL NOT NULL,
    "class_group_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "present" BOOLEAN NOT NULL,
    "user_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_cancellations" (
    "id" SERIAL NOT NULL,
    "class_group_id" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "start_minute" INTEGER NOT NULL,
    "reason" "CancellationReason" NOT NULL,
    "user_id" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_overrides_student_id_date_idx" ON "attendance_overrides"("student_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_overrides_class_group_id_student_id_date_start_m_key" ON "attendance_overrides"("class_group_id", "student_id", "date", "start_minute");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_cancellations_class_group_id_date_start_minute_key" ON "lesson_cancellations"("class_group_id", "date", "start_minute");

-- CreateIndex
CREATE INDEX "access_logs_student_id_created_at_idx" ON "access_logs"("student_id", "created_at");

-- AddForeignKey
ALTER TABLE "attendance_overrides" ADD CONSTRAINT "attendance_overrides_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_overrides" ADD CONSTRAINT "attendance_overrides_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_overrides" ADD CONSTRAINT "attendance_overrides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_cancellations" ADD CONSTRAINT "lesson_cancellations_class_group_id_fkey" FOREIGN KEY ("class_group_id") REFERENCES "class_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_cancellations" ADD CONSTRAINT "lesson_cancellations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RLS como nas demais tabelas.
ALTER TABLE "attendance_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_cancellations" ENABLE ROW LEVEL SECURITY;
