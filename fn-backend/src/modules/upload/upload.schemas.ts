import { z } from 'zod';

import { paginationQuerySchema, uuidSchema } from '../../shared/validation';

// Allowed EC8A file types
export const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

export const sheetUploadFieldsSchema = z
  .object({
    electionId: uuidSchema,
    stateId: uuidSchema,
    lgaId: uuidSchema,
    puCode: z.string().trim().min(1).max(120),
  })
  .strict();

export type SheetUploadFields = z.infer<typeof sheetUploadFieldsSchema>;

export const listSheetsQuerySchema = paginationQuerySchema.extend({
  electionId: uuidSchema.optional(),
  lgaId: uuidSchema.optional(),
  status: z.enum(['pending', 'verified', 'disputed']).optional(),
});

export type ListSheetsQuery = z.infer<typeof listSheetsQuerySchema>;

export const sheetIdParamSchema = z.object({ id: uuidSchema });
export type SheetIdParam = z.infer<typeof sheetIdParamSchema>;

export const flagSheetBodySchema = z
  .object({
    reason: z.string().trim().min(1).max(300).optional(),
  })
  .strict();

export type FlagSheetInput = z.infer<typeof flagSheetBodySchema>;

/** Public-safe sheet shape. Never exposes the uploader's id. */
export const sheetSchema = z.object({
  id: z.string().uuid(),
  electionId: z.string().uuid(),
  stateId: z.string().uuid(),
  lgaId: z.string().uuid(),
  puCode: z.string(),
  fileHash: z.string(),
  fileUrl: z.string().url().nullable(),
  mimeType: z.string(),
  fileSize: z.number().int(),
  status: z.enum(['pending', 'verified', 'disputed']),
  flagCount: z.number().int(),
  createdAt: z.string().datetime(),
});

export type PublicSheet = z.infer<typeof sheetSchema>;

export const flagResultSchema = z.object({
  sheetId: z.string().uuid(),
  flagCount: z.number().int(),
});

export type FlagResult = z.infer<typeof flagResultSchema>;
