import { z } from 'zod';

import { authErrors, commonErrors, jsonError, jsonOk } from '../../shared/openapi/helpers';
import { registry } from '../../shared/openapi/registry';
import { publicUserSchema, registerBodySchema } from './auth.schemas';
import { requestOtpBodySchema, verifyOtpBodySchema } from './otp.schemas';


const RegisterRequest = registry.register('RegisterRequest', registerBodySchema.openapi({
  example: {
    fullName: 'Adaeze Okeke',
    phoneNumber: '+2348012345678',
    email: 'adaeze@example.com',
    ninHash: 'a'.repeat(64),
    state: 'Lagos',
    geopoliticalZone: 'SW',
  },
  description:
    'Citizen self-registration. Optionally include `inviteCode` (a codeword issued by ' +
    'a super admin) to register as a Yiaga official/transcriber — the role and ' +
    'state/zone are then taken from the code, not from the client.',
}));

const PublicUser = registry.register('PublicUser', publicUserSchema);

const RegisterResponse = registry.register(
  'RegisterResponse',
  z.object({
    user: publicUserSchema,
    otpSent: z
      .boolean()
      .openapi({ description: 'Whether the login OTP was dispatched. If false, call request-otp.' }),
  }),
);

const RequestOtpRequest = registry.register('RequestOtpRequest', requestOtpBodySchema.openapi({
  example: { phoneNumber: '+2348012345678' },
}));

const VerifyOtpRequest = registry.register('VerifyOtpRequest', verifyOtpBodySchema.openapi({
  example: { phoneNumber: '+2348012345678', code: '123456' },
}));

const AccessSession = registry.register(
  'AccessSession',
  z.object({
    accessToken: z.string().openapi({ description: 'RS256 JWT, 2h TTL.' }),
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
    'Creates a citizen account from a client-side SHA-256 NIN hash and immediately ' +
    'dispatches a login OTP by email — go straight to verify-otp next. The raw NIN ' +
    'never reaches the server. Phone stays the login identity; `email` is only where ' +
    'the OTP is delivered. `state`, if given, must be a real Nigerian state (the zone ' +
    'is derived from it). Duplicate nin_hash, phone_number, or email → 409.',
  request: { body: { required: true, content: { 'application/json': { schema: RegisterRequest } } } },
  responses: {
    ...commonErrors(),
    201: jsonOk(RegisterResponse, 'Account created; OTP dispatched.'),
    400: jsonError('Validation failed (e.g. unknown state).'),
    409: jsonError('NIN, phone number, or email already registered.'),
    422: jsonError('Invite code is invalid, expired, or fully used.'),
    
  },
});

// Request OTP
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/request-otp',
  tags: ['Auth'],
  summary: 'Request an OTP (also serves as login)',
  description:
    'Generates a 6-digit OTP, stores its SHA-256 hash in Redis (5-min TTL), and ' +
    'emails it to the address on file for that phone number. Returns 200 regardless ' +
    'of whether the phone is registered to prevent phone-number enumeration.',
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
  summary: 'Verify OTP and receive a session',
  description:
    'Verifies the 6-digit OTP against the Redis hash (constant-time comparison). ' +
    'On success: returns a 2h access token in the body and sets the 7d refresh token ' +
    'as an httpOnly, Secure, SameSite cookie. The refresh token is never in the body.',
  request: { body: { required: true, content: { 'application/json': { schema: VerifyOtpRequest } } } },
  responses: {
    200: jsonOk(AccessSession, 'OTP verified. Access token returned; refresh cookie set.'),
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
    'Reads the refresh token from its httpOnly cookie, revokes it, and issues a new ' +
    'access token plus a rotated refresh cookie. A replayed token is rejected. No ' +
    'request body — the cookie is sent automatically.',
  responses: {
    200: jsonOk(AccessSession, 'New access token issued; refresh cookie rotated.'),
    401: jsonError('Refresh cookie missing, invalid, expired, or already revoked.'),
    ...commonErrors(),
  },
});

// Logout
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/logout',
  tags: ['Auth'],
  summary: 'Logout (revoke refresh token)',
  description:
    'Revokes the refresh token read from its httpOnly cookie and clears the cookie. ' +
    'Idempotent — a missing or already-revoked token is silently accepted. No request body.',
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
