import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';

import { env } from './env';
import type { Role } from './validation';


const ALG = 'RS256';
const ISSUER = 'fair-nigeria';
const AUDIENCE = 'fair-nigeria-app';
const ACCESS_TTL = '2h';

export interface AccessTokenPayload {
  /** user id */
  sub: string;
  role: Role;
}

function toPem(value: string): string {
  return value.includes('BEGIN')
    ? value.replace(/\\n/g, '\n')
    : Buffer.from(value, 'base64').toString('utf8');
}

let privateKeyPromise: ReturnType<typeof importPKCS8> | undefined;
let publicKeyPromise: ReturnType<typeof importSPKI> | undefined;

function privateKey(): ReturnType<typeof importPKCS8> {
  if (!env.JWT_PRIVATE_KEY) {
    throw new Error('JWT_PRIVATE_KEY is not configured — cannot sign access tokens.');
  }
  privateKeyPromise ??= importPKCS8(toPem(env.JWT_PRIVATE_KEY), ALG);
  return privateKeyPromise;
}

function publicKey(): ReturnType<typeof importSPKI> {
  if (!env.JWT_PUBLIC_KEY) {
    throw new Error('JWT_PUBLIC_KEY is not configured — cannot verify access tokens.');
  }
  publicKeyPromise ??= importSPKI(toPem(env.JWT_PUBLIC_KEY), ALG);
  return publicKeyPromise;
}

/** Sign a 2-hour access token carrying the user id (sub) and role. No PII in the payload. */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(ACCESS_TTL)
    .sign(await privateKey());
}

/** Verify an access token's signature, issuer, audience, and expiry. Throws on any failure. */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, await publicKey(), {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALG],
  });

  const sub = payload.sub;
  const role = payload['role'];
  if (typeof sub !== 'string' || typeof role !== 'string') {
    throw new Error('Malformed access token payload.');
  }
  return { sub, role: role as Role };
}
