-- Login passa a ser de um usuário com perfil (users), não mais da própria escola.
-- Cada escola já vinculada ao Supabase Auth ganha um usuário SCHOOL, e o dono do
-- projeto vira o primeiro SUPER_ADMIN (mantendo a escola dele como escola de teste).

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'SCHOOL', 'STUDENT', 'EMPLOYEE', 'TEACHER');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "auth_user_id" UUID NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'SCHOOL',
    "school_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_school_id_idx" ON "users"("school_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migra os vínculos existentes: cada escola com login vira um usuário SCHOOL.
INSERT INTO "users" ("auth_user_id", "email", "name", "role", "school_id", "updated_at")
SELECT "auth_user_id", lower("email"), "name", 'SCHOOL', "id", CURRENT_TIMESTAMP
FROM "schools"
WHERE "auth_user_id" IS NOT NULL;

-- Primeiro super admin (sem efeito em ambientes onde o e-mail não existe).
UPDATE "users" SET "role" = 'SUPER_ADMIN' WHERE "email" = 'rafaelhenriqueoliveira1234@gmail.com';

-- Como nas demais tabelas: RLS ligado e sem políticas, a Data API (anon/authenticated) não acessa os perfis.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

-- No máximo um login de escola (SCHOOL) por escola. O Prisma não modela índice parcial.
CREATE UNIQUE INDEX "users_school_role_key" ON "users"("school_id") WHERE "role" = 'SCHOOL';

-- DropIndex
DROP INDEX "schools_auth_user_id_key";

-- AlterTable
ALTER TABLE "schools" DROP COLUMN "auth_user_id";
