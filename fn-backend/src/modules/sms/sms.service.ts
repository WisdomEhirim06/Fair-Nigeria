import { env } from '../../shared/env';
import { logger } from '../../shared/logger';


 // SMS dispatch. In development (no OTP_SMS_API_KEY) the OTP is logged to the console so local development works without a live SMS provider. 
 // OTP_SMS_API_KEY is present when NODE_ENV=production if a provider is wired in.
 
 // Sprint 5 / infra ticket: replace the stub with a real provider call (Africa's
 // Talking or Termii are the shortlisted options for NGN numbers).
 
export async function sendOtpSms(phoneNumber: string, code: string): Promise<void> {
  if (!env.OTP_SMS_API_KEY) {
    logger.info({ phoneNumber, code }, '[DEV] OTP SMS (no provider configured)');
    return;
  }

  // TODO: wire real SMS provider here.
  logger.warn({ phoneNumber }, 'OTP_SMS_API_KEY set but no provider wired — OTP not sent');
}
