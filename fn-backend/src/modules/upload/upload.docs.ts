import { z } from 'zod';

import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import { flagResultSchema, flagSheetBodySchema, sheetSchema } from './upload.schemas';

const Sheet = registry.register('Sheet', sheetSchema);
const FlagResult = registry.register('FlagResult', flagResultSchema);

const FlagSheetRequest = registry.register(
  'FlagSheetRequest',
  flagSheetBodySchema.openapi({ example: { reason: 'Figures look altered.' } }),
);

const UploadSheetForm = registry.register(
  'UploadSheetForm',
  z.object({
    electionId: z.string().uuid(),
    stateId: z.string().uuid(),
    lgaId: z.string().uuid(),
    puCode: z.string(),
    file: z.string().openapi({ type: 'string', format: 'binary' }),
  }),
);

registry.registerPath({
  method: 'post',
  path: '/api/v1/upload',
  tags: ['Sheets'],
  summary: 'Upload an EC8A sheet',
  description:
    'Streams an EC8A result sheet to immutable storage, computing its SHA-256 ' +
    'server-side. The sheet is public the moment the upload completes. Yiaga ' +
    'official only. Send the form fields before the file part.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'multipart/form-data': { schema: UploadSheetForm } },
    },
  },
  responses: {
    201: jsonOk(Sheet, 'Sheet uploaded.'),
    404: jsonError('Election or LGA not found.'),
    413: jsonError('File exceeds the size limit.'),
    415: jsonError('Unsupported file type.'),
    422: jsonError('Upload is not open for this election.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/sheets',
  tags: ['Sheets'],
  summary: 'List sheets',
  description: 'Public, paginated list of uploaded sheets, newest first.',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      electionId: z.string().uuid().optional(),
      lgaId: z.string().uuid().optional(),
      status: z.enum(['pending', 'verified', 'disputed']).optional(),
    }),
  },
  responses: {
    200: jsonOk(z.array(Sheet), 'Matching sheets.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/sheets/{id}',
  tags: ['Sheets'],
  summary: 'Get a sheet',
  description: 'Returns a single sheet by id. Public.',
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: jsonOk(Sheet, 'The sheet.'),
    404: jsonError('Sheet not found.'),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/sheets/{id}/flag',
  tags: ['Sheets'],
  summary: 'Flag a sheet',
  description:
    'Raises a public flag against a sheet. Open to everyone, guests included; ' +
    'the flagger IP is recorded and limited to a few flags per hour. One flag ' +
    'per IP per sheet. Flags never alter the figures.',
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: { content: { 'application/json': { schema: FlagSheetRequest } } },
  },
  responses: {
    201: jsonOk(FlagResult, 'Flag recorded.'),
    404: jsonError('Sheet not found.'),
    409: jsonError('Already flagged from this IP.'),
    ...commonErrors(),
  },
});
