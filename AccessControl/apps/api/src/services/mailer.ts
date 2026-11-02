import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

class SmtpMailer implements Mailer {
  private transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });

  async send(message: MailMessage) {
    await this.transporter.sendMail({ from: env.MAIL_FROM, ...message });
  }
}

/** Usado em desenvolvimento quando não há SMTP configurado: apenas registra o e-mail no log. */
class LogMailer implements Mailer {
  async send(message: MailMessage) {
    logger.warn({ to: message.to, subject: message.subject, text: message.text }, 'SMTP não configurado - e-mail não enviado');
  }
}

export function createMailer(): Mailer {
  return env.SMTP_HOST ? new SmtpMailer() : new LogMailer();
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

const layout = (title: string, body: string) => `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:auto;border:2px solid #34BCFB;border-radius:16px;overflow:hidden">
  <div style="background:#34BCFB;padding:20px 24px;color:#111;font-size:24px;font-weight:600">Help<span style="color:#fff">Us</span></div>
  <div style="padding:24px;color:#404040">
    <h2 style="margin-top:0">${title}</h2>
    ${body}
  </div>
</div>`;

const codeBlock = (code: string) =>
  `<p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#111;text-align:center;margin:24px 0">${code}</p>`;

export const mailTemplates = {
  activation(to: string, name: string, code: string): MailMessage {
    return {
      to,
      subject: 'Bem-vindo ao HelpUs! Ative sua conta',
      text: `Olá, ${name}! Estamos felizes de termos você conosco! Seu código de ativação de conta é: ${code}. Ele expira em 15 minutos.`,
      html: layout(
        `Olá, ${escapeHtml(name)}!`,
        `<p>Estamos felizes de termos você conosco! Use o código abaixo para ativar sua conta:</p>${codeBlock(code)}<p>O código expira em 15 minutos.</p>`,
      ),
    };
  },
  passwordReset(to: string, code: string): MailMessage {
    return {
      to,
      subject: 'HelpUs - Recuperação de senha',
      text: `Seu código de verificação é: ${code}. Ele expira em 15 minutos. Se você não solicitou, ignore este e-mail.`,
      html: layout(
        'Recuperação de senha',
        `<p>Seu código de verificação é:</p>${codeBlock(code)}<p>O código expira em 15 minutos. Se você não solicitou a troca de senha, ignore este e-mail.</p>`,
      ),
    };
  },
};
