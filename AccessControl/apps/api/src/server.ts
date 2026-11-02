import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { createMailer } from './services/mailer';
import { createPhotoStorage } from './services/storage';

const app = createApp({ prisma, mailer: createMailer(), storage: createPhotoStorage(prisma) });

const server = app.listen(env.PORT, () => {
  logger.info(`HelpUs API rodando na porta ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} recebido, encerrando...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
