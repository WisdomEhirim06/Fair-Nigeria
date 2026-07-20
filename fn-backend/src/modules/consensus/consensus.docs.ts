import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import {
  claimSchema,
  queueStatusSchema,
  submitEntryBodySchema,
  submitEntryResultSchema,
} from './consensus.schemas';

const Claim = registry.register('Claim', claimSchema);
const QueueStatus = registry.register('QueueStatus', queueStatusSchema);
const SubmitEntryResult = registry.register('SubmitEntryResult', submitEntryResultSchema);

const SubmitEntryRequest = registry.register(
  'SubmitEntryRequest',
  submitEntryBodySchema.openapi({
    example: {
      sheetId: '11111111-1111-1111-1111-111111111111',
      accreditedVoters: 512,
      totalValidVotes: 498,
      rejectedBallots: 14,
      totalVotesCast: 512,
      partyVotes: {
        '22222222-2222-2222-2222-222222222222': 301,
        '33333333-3333-3333-3333-333333333333': 197,
      },
    },
  }),
);

registry.registerPath({
  method: 'get',
  path: '/api/v1/transcription/queue',
  tags: ['Transcription'],
  summary: 'Count sheets awaiting me',
  description:
    'How many sheets the signed-in transcriber could be handed right now. Returns a ' +
    'count only — never which sheets — so it cannot be used to pick a specific one. ' +
    'Transcriber only.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonOk(QueueStatus, 'The number of sheets waiting.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/transcription/claim',
  tags: ['Transcription'],
  summary: 'Claim the next sheet',
  description:
    'Returns the next sheet for the authenticated transcriber to read, with the ' +
    "election's parties. Excludes their own uploads and sheets they have already " +
    'transcribed. Yiaga transcriber only.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonOk(Claim, 'The claimed sheet and its parties.'),
    404: jsonError('No sheets are awaiting transcription.'),
    ...authErrors(),
    ...commonErrors(),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/transcription/entries',
  tags: ['Transcription'],
  summary: 'Submit a reading',
  description:
    'Records one transcriber reading of a sheet and evaluates consensus. Two ' +
    'readings that match on every figure verify the sheet (2-of-3); four ' +
    'all-distinct readings dispute it. partyVotes must cover exactly the ' +
    "election's configured parties. Append-only. Yiaga transcriber only.",
  security: [{ bearerAuth: [] }],
  request: {
    body: { required: true, content: { 'application/json': { schema: SubmitEntryRequest } } },
  },
  responses: {
    201: jsonOk(SubmitEntryResult, 'Reading recorded; includes the sheet status after evaluation.'),
    404: jsonError('Sheet not found.'),
    409: jsonError('Already transcribed, or the sheet is already resolved.'),
    422: jsonError(
      'Self-transcription, no parties configured, party votes mismatch, or figures do not tally.',
    ),
    ...authErrors(),
    ...commonErrors(),
  },
});
