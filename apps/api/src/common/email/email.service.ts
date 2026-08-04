import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { EnvSchema } from '../config/env.validation';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService<EnvSchema, true>) {}

  onModuleInit(): void {
    const host = this.config.get('SMTP_HOST', { infer: true });
    if (!host) {
      this.logger.warn('SMTP_HOST not configured - emails will be logged instead of sent. See docs/DEPLOYMENT.md.');
      return;
    }
    this.transporter = createTransport({
      host,
      port: this.config.get('SMTP_PORT', { infer: true }),
      secure: this.config.get('SMTP_SECURE', { infer: true }),
      auth: this.config.get('SMTP_USER', { infer: true })
        ? {
            user: this.config.get('SMTP_USER', { infer: true }),
            pass: this.config.get('SMTP_PASSWORD', { infer: true }),
          }
        : undefined,
    });
  }

  private async send(input: SendEmailInput): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[email:dry-run] To: ${input.to} | Subject: ${input.subject}\n${input.text}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM', { infer: true }),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Verify your email address',
      html: emailLayout(
        'Verify your email',
        `<p>Thanks for signing up. Please confirm your email address to activate your account.</p>
         <p><a href="${verifyUrl}" style="${buttonStyle}">Verify email</a></p>
         <p style="color:#6b7280;font-size:13px;">Or paste this link into your browser: ${verifyUrl}</p>`,
      ),
      text: `Verify your email: ${verifyUrl}`,
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    await this.send({
      to,
      subject: 'Reset your password',
      html: emailLayout(
        'Reset your password',
        `<p>We received a request to reset your password. This link expires in 60 minutes.</p>
         <p><a href="${resetUrl}" style="${buttonStyle}">Reset password</a></p>
         <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>`,
      ),
      text: `Reset your password: ${resetUrl}`,
    });
  }
}

const buttonStyle =
  'display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600;';

function emailLayout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px;background:#f3f4f6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:32px;">
        <h1 style="font-size:20px;margin:0 0 16px;color:#111827;">${heading}</h1>
        <div style="font-size:15px;line-height:1.6;color:#374151;">${bodyHtml}</div>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
        <p style="font-size:12px;color:#9ca3af;margin:0;">QR Code Generator</p>
      </td></tr>
    </table>
  </body>
</html>`;
}
