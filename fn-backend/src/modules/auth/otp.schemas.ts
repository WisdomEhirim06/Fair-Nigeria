import { z } from 'zod';

import { otpCodeSchema, phoneNumberSchema } from '../../shared/validation';

export const requestOtpBodySchema = z
  .object({
    phoneNumber: phoneNumberSchema,
  })
  .strict();

export type RequestOtpInput = z.infer<typeof requestOtpBodySchema>;

export const verifyOtpBodySchema = z
  .object({
    phoneNumber: phoneNumberSchema,
    code: otpCodeSchema,
  })
  .strict();

export type VerifyOtpInput = z.infer<typeof verifyOtpBodySchema>;

export const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export type RefreshInput = z.infer<typeof refreshBodySchema>;
