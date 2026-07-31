import { Resend } from 'resend';

import { env } from '../../shared/env';
import { logger } from '../../shared/logger';



let client: Resend | null = null;

function getClient(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured.');
  }
  if (!client) {
    client = new Resend(env.RESEND_API_KEY);
  }
  return client;
}

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.info({ email, code }, '[DEV] OTP email (no provider configured)');
    return;
  }

  const { error } = await getClient().emails.send({
    from: env.EMAIL_FROM,
    to: email,
    subject: `${code} is your Fair Nigeria code`,
    text: `Your Fair Nigeria verification code is ${code}. It expires in 5 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    html:
      `<p>Your Fair Nigeria verification code is <strong style="font-size:1.2em">${code}</strong>.</p>` +
      `<p>It expires in 5 minutes.</p>` +
      `<p style="color:#666">If you didn't request this, you can ignore this email.</p>`,
  });

  if (error) {
    logger.error({ email, error }, 'Failed to send OTP email');
    throw new Error('Could not send the verification email. Please try again.');
  }
}
