import { z } from 'zod';
import { codeSchema, emailSchema, passwordSchema } from '../../lib/validation';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome da instituição').max(100),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe a senha'),
});

export const emailOnlySchema = z.object({ email: emailSchema });

export const verifyEmailSchema = z.object({ email: emailSchema, code: codeSchema });

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: codeSchema,
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
