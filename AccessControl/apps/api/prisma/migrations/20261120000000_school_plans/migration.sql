CREATE TYPE "SchoolPlan" AS ENUM ('BASIC', 'ACADEMIC', 'ATTENDANCE', 'ASSESSMENTS');
-- Escolas existentes ficam com tudo liberado; escolas novas nascem no Básico.
ALTER TABLE "schools" ADD COLUMN "plan" "SchoolPlan" NOT NULL DEFAULT 'ASSESSMENTS';
ALTER TABLE "schools" ALTER COLUMN "plan" SET DEFAULT 'BASIC';
