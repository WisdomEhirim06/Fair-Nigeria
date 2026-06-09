import { z } from 'zod';

import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import { publicUserSchema, registerBodySchema } from './auth.schemas';
import {
  refreshBodySchema,
  requestOtpBodySchema,
  verifyOtpBodySchema,
} from './otp.schemas';

//  Registered schemas (appear in the Components / Schemas panel)

const RegisterRequest = registry.register('RegisterRequest', registerBodySchema.openapi({
  example: {
    fullName: 'Adaeze Okeke',
    phoneNumber: '+2348012345678',
    ninHash: 'a'.repeat(64),
    state: 'Lagos',
    geopoliticalZone: 'SW',
  },
}));

const PublicUser = registry.register('PublicUser', publicUserSchema);

const RequestOtpRequest = registry.register('RequestOtpRequest', requestOtpBodySchema.openapi({
  example: { phoneNumber: '+2348012345678' },
}));

const VerifyOtpRequest = registry.register('VerifyOtpRequest', verifyOtpBodySchema.openapi({
  example: { phoneNumber: '+2348012345678', code: '123456' },
}));

const RefreshRequest = registry.register('RefreshRequest', refreshBodySchema.openapi({
  example: { refreshToken: '<opaque-refresh-token>' },
}));

const TokenPairSchema = registry.register(
  'TokenPair',
  z.object({
    accessToken: z.string().openapi({ description: 'RS256 JWT, 2h TTL.' }),
    refreshToken: z.string().openapi({ description: 'Opaque token, 7d TTL.' }),
    expiresIn: z.number().openapi({ example: 7200, description: 'Access token TTL in seconds.' }),
  }),
);

//  Endpoint registrations

// Registration
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/register',
  tags: ['Auth'],
  summary: 'Register a citizen',
  description:
    'Creates a citizen account from a client-side SHA-256 NIN hash. ' +
    'The raw NIN never reaches the server. Duplicate nin_hash or phone_number → 409.',
  request: { body: { required: true, content: { 'application/json': { schema: RegisterRequest } } } },
  responses: {
    201: jsonOk(PublicUser, 'Account created.'),
    409: jsonError('NIN or phone number already registered.'),
    ...commonErrors(),
  },
});

// Request OTP
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/request-otp',
  tags: ['Auth'],
  summary: 'Request an OTP',
  description:
    'Generates a 6-digit OTP, stores its SHA-256 hash in Redis (5-min TTL), and ' +
    'dispatches it via SMS. Always returns 200 regardless of whether the phone is ' +
    'registered to prevent phone-number enumeration.',
  request: { body: { required: true, content: { 'application/json': { schema: RequestOtpRequest } } } },
  responses: {
    200: jsonOk(z.object({ message: z.string() }), 'OTP dispatched (or silently ignored for unregistered phones).'),
    ...commonErrors(),
  },
});

// Verify OTP
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/verify-otp',
  tags: ['Auth'],
  summary: 'Verify OTP and receive tokens',
  description:
    'Verifies the 6-digit OTP against the Redis hash (constant-time comparison). ' +
    'On success: marks the DB record used, deletes the Redis key, issues a 2h access ' +
    'token and a 7d refresh token.',
  request: { body: { required: true, content: { 'application/json': { schema: VerifyOtpRequest } } } },
  responses: {
    200: jsonOk(TokenPairSchema, 'OTP verified — access and refresh tokens issued.'),
    401: jsonError('OTP incorrect, expired, or already used.'),
    ...commonErrors(),
  },
});

// Refresh token rotation
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/refresh',
  tags: ['Auth'],
  summary: 'Rotate refresh token',
  description:
    'Validates the refresh token, revokes it, and issues a new access + refresh pair. ' +
    'A replayed token is rejected.',
  request: { body: { required: true, content: { 'application/json': { schema: RefreshRequest } } } },
  responses: {
    200: jsonOk(TokenPairSchema, 'New token pair issued.'),
    401: jsonError('Token invalid, expired, or already revoked.'),
    ...commonErrors(),
  },
});

// Logout
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Logout (revoke refresh token)',
  description: 'Marks the refresh token as revoked. Idempotent — already-revoked tokens are silently accepted.',
  request: { body: { required: true, content: { 'application/json': { schema: RefreshRequest } } } },
  responses: {
    200: jsonOk(z.object({ message: z.string() }), 'Logged out.'),
    ...commonErrors(),
  },
});

// Me — authenticated profile
registry.registerPath({
  method: 'get',
  path: '/api/v1/auth/me',
  tags: ['Auth'],
  summary: 'Get current user profile',
  description:
    'Returns the authenticated user\'s public profile. ' +
    'Never exposes ninHash or fcmToken. ' +
    'Requires a valid Bearer access token.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonOk(PublicUser, 'Authenticated user profile.'),
    ...authErrors(),
    ...commonErrors(),
  },
});
