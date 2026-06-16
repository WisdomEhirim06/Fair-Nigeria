import { z } from 'zod';

import { geopoliticalZoneSchema, uuidSchema } from '../../shared/validation';

export const stateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  alias: z.string(),
  zone: geopoliticalZoneSchema,
});
export type PublicState = z.infer<typeof stateSchema>;

export const lgaSchema = z.object({
  id: z.string().uuid(),
  stateId: z.string().uuid(),
  name: z.string(),
});
export type PublicLga = z.infer<typeof lgaSchema>;

export const stateIdParamSchema = z.object({ stateId: uuidSchema });
export type StateIdParam = z.infer<typeof stateIdParamSchema>;
