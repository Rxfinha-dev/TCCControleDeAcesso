-- A API acessa o banco só pelo Prisma (dono das tabelas); a Data API do Supabase (PostgREST)
-- não é usada. Aqui os papéis da Data API (anon e authenticated) perdem o acesso ao schema
-- "public", inclusive às tabelas criadas por migrations futuras (ALTER DEFAULT PRIVILEGES vale
-- para os objetos criados pelo usuário que roda as migrations). O RLS continua habilitado
-- como segunda barreira.
-- Em um PostgreSQL comum (docker-compose, CI) esses papéis não existem e nada é feito.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, PUBLIC;

    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
    -- Funções novas recebem EXECUTE para PUBLIC por padrão (e anon/authenticated herdam de PUBLIC).
    -- Esse padrão é global: só sai sem o IN SCHEMA.
    ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
  END IF;
END
$$;
