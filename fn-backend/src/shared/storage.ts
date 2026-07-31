import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { Readable } from 'node:stream';

import { env } from './env';

/**
 * R2 storage client for the immutable EC8A sheet bucket.
 */
let client: S3Client | null = null;

function getClient(): S3Client {
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME
  ) {
    throw new Error('R2 storage is not configured');
  }
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    env.R2_ACCOUNT_ID &&
      env.R2_ACCESS_KEY_ID &&
      env.R2_SECRET_ACCESS_KEY &&
      env.R2_BUCKET_NAME,
  );
}

export async function putObjectStream(
  key: string,
  body: Readable,
  contentType: string,
): Promise<void> {
  const upload = new Upload({
    client: getClient(),
    params: {
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  });
  await upload.done();
}

export function publicUrlFor(key: string): string | null {
  if (!env.R2_PUBLIC_BASE_URL) return null;
  return `${env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${key}`;
}

const RESIZABLE_MIME = new Set(['image/jpeg', 'image/png']);


export function thumbnailUrlFor(
  key: string,
  mimeType: string,
  width = 400,
): string | null {
  if (!env.R2_IMAGE_RESIZING || !env.R2_PUBLIC_BASE_URL) return null;
  if (!RESIZABLE_MIME.has(mimeType)) return null;
  const base = env.R2_PUBLIC_BASE_URL.replace(/\/+$/, '');
  return `${base}/cdn-cgi/image/width=${width},quality=75,format=auto,fit=cover/${key}`;
}