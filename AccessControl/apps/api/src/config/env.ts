import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

  // Supabase Auth: o login acontece no Supabase e a API valida os tokens emitidos por ele.
  SUPABASE_URL: z.url('SUPABASE_URL deve ser a URL do projeto (https://<ref>.supabase.co)'),
  // Chave publicável (sb_publishable_...) ou a chave "anon" legada. Nunca a secret/service_role.
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'SUPABASE_PUBLISHABLE_KEY é obrigatória'),

  STORAGE_DRIVER: z.enum(['database', 'supabase']).default('database'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('student-photos'),

  // E-mail que nasce SUPER_ADMIN no primeiro login (bootstrap do primeiro super admin).
  SUPER_ADMIN_BOOTSTRAP_EMAIL: z
    .email()
    .default('rafaelhenriqueoliveira1234@gmail.com')
    .transform((email) => email.toLowerCase()),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`);
  throw new Error(`Variáveis de ambiente inválidas:\n${issues.join('\n')}`);
}

if (parsed.data.STORAGE_DRIVER === 'supabase' && !parsed.data.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('STORAGE_DRIVER=supabase exige SUPABASE_SERVICE_ROLE_KEY');
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
