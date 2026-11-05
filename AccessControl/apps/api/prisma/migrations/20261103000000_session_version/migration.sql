-- Versão da sessão: ao trocar a senha, tokens emitidos antes deixam de valer.
ALTER TABLE "schools" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;
