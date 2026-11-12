-- Logins de professores e alunos (etapa 4 do módulo acadêmico).

-- Código curto da escola, sufixo dos usuários ("joao.silva@etec-jau").
ALTER TABLE "schools" ADD COLUMN "code" VARCHAR(30);
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- Usuário de professor/aluno ligado ao cadastro, com troca de senha obrigatória no primeiro acesso.
ALTER TABLE "users" ADD COLUMN "username" VARCHAR(80),
ADD COLUMN "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "teacher_id" INTEGER,
ADD COLUMN "student_id" INTEGER;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_teacher_id_key" ON "users"("teacher_id");
CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

ALTER TABLE "users" ADD CONSTRAINT "users_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
