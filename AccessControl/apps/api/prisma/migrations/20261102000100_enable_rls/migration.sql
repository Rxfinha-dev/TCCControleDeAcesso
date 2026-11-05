-- O Supabase expõe o schema "public" pela API REST (PostgREST) usando as chaves anon/authenticated.
-- Toda a regra de acesso fica na API Node, então habilitamos RLS SEM políticas:
-- os papéis anon/authenticated não conseguem ler nem gravar nada diretamente.
-- O usuário usado pelo Prisma (postgres/owner) ignora RLS e continua com acesso total.
ALTER TABLE "schools" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "courses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "student_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "access_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
