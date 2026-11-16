import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../config/env.js";

export interface EmailAttachment {
  filename: string;
  content?: string | Buffer;
  path?: string;
  contentType?: string;
}

export interface SendEmailOptions {
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  text?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  accepted: boolean;
  messageId: string;
  acceptedAddresses: string[];
  rejectedAddresses: string[];
}

let transporter: Transporter | null = null;

function getPassword(): string | undefined {
  return env.SMTP_PASS ?? env.RESEND_API_KEY;
}

export function isEmailConfigured(): boolean {
  return Boolean(getPassword());
}

function getTransporter(): Transporter {
  const password = getPassword();

  if (!password) {
    throw new Error("Email transport is not configured. Set SMTP_PASS or RESEND_API_KEY.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: password
      }
    });
  }

  return transporter;
}

export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  options: SendEmailOptions = {}
): Promise<SendEmailResult> {
  const info = await getTransporter().sendMail({
    from: options.from ?? env.SMTP_FROM,
    to,
    subject,
    html,
    text: options.text,
    replyTo: options.replyTo,
    cc: options.cc,
    bcc: options.bcc,
    attachments: options.attachments
  });

  return {
    accepted: info.accepted.length > 0,
    messageId: info.messageId,
    acceptedAddresses: info.accepted as string[],
    rejectedAddresses: info.rejected as string[]
  };
}

export async function sendEmailSafe(
  to: string | string[],
  subject: string,
  html: string,
  options: SendEmailOptions = {}
): Promise<{ sent: boolean; reason?: string }> {
  if (env.NODE_ENV === "test") {
    return { sent: false, reason: "Email delivery is disabled in tests." };
  }

  if (!isEmailConfigured()) {
    return { sent: false, reason: "Email transport is not configured." };
  }

  try {
    await sendEmail(to, subject, html, options);
    return { sent: true };
  } catch (error) {
     
    console.error("Email delivery failed:", error instanceof Error ? error.message : "unknown error");
    return { sent: false, reason: "Email delivery failed." };
  }
}

export async function verifyEmailTransport(): Promise<boolean> {
  await getTransporter().verify();
  return true;
}

export function closeEmailTransport(): void {
  transporter?.close();
  transporter = null;
}
