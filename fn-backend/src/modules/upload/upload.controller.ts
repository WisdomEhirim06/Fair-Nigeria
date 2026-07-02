import busboy from 'busboy';
import { createHash, randomUUID } from 'node:crypto';
import { PassThrough } from 'node:stream';
import type { RequestHandler } from 'express';

import { env } from '../../shared/env';
import { AppError } from '../../shared/errors';
import { successEnvelope } from '../../shared/response';
import { isStorageConfigured, putObjectStream } from '../../shared/storage';
import type { Actor, UploadedFile } from './upload.service';
import { createSheet, flagSheet, getSheet, listSheets } from './upload.service';
import {
  EXT_BY_MIME,
  listSheetsQuerySchema,
  sheetIdParamSchema,
  sheetUploadFieldsSchema,
  type FlagSheetInput,
  type SheetIdParam,
} from './upload.schemas';

function actorFrom(req: Parameters<RequestHandler>[0]): Actor {
  return { id: req.user!.id, role: req.user!.role, ip: req.ip ?? null };
}

function reqId(req: Parameters<RequestHandler>[0]): string {
  return req.id as unknown as string;
}

export const uploadSheetHandler: RequestHandler = (req, res, next) => {
  if (!req.headers['content-type']?.startsWith('multipart/form-data')) {
    next(new AppError('VALIDATION_ERROR', 'Expected a multipart/form-data upload.'));
    return;
  }
  if (!isStorageConfigured()) {
    next(new AppError('INTERNAL_ERROR', 'File storage is not configured.'));
    return;
  }

  const bb = busboy({ headers: req.headers, limits: { files: 1, fileSize: env.UPLOAD_MAX_BYTES } });
  const fields: Record<string, string> = {};
  let upload: Promise<UploadedFile> | null = null;
  let tooLarge = false;
  let settled = false;

  const fail = (err: unknown): void => {
    if (settled) return;
    settled = true;
    req.unpipe(bb);
    next(err instanceof Error ? err : new AppError('INTERNAL_ERROR', 'Upload failed.'));
  };

  bb.on('field', (name, value) => {
    fields[name] = value;
  });

  bb.on('file', (_name, stream, info) => {
    // Fields must arrive before the file so we can validate before streaming.
    const parsed = sheetUploadFieldsSchema.safeParse(fields);
    if (!parsed.success) {
      stream.resume();
      const issue = parsed.error.issues[0];
      fail(new AppError('VALIDATION_ERROR', issue?.message, issue?.path.join('.') || undefined));
      return;
    }
    const ext = EXT_BY_MIME[info.mimeType];
    if (!ext) {
      stream.resume();
      fail(new AppError('INVALID_FILE_TYPE', 'Only JPEG, PNG, or PDF sheets are accepted.'));
      return;
    }

    const r2Key = `sheets/${parsed.data.electionId}/${randomUUID()}.${ext}`;
    const hash = createHash('sha256');
    const pass = new PassThrough();
    let fileSize = 0;

    stream.on('data', (chunk: Buffer) => {
      fileSize += chunk.length;
      hash.update(chunk);
    });
    stream.on('limit', () => {
      tooLarge = true;
      pass.destroy();
    });
    stream.pipe(pass);

    upload = putObjectStream(r2Key, pass, info.mimeType).then(() => ({
      r2Key,
      fileHash: hash.digest('hex'),
      fileSize,
      mimeType: info.mimeType,
    }));
  });

  bb.on('error', (err) => fail(err));

  bb.on('close', () => {
    void (async () => {
      if (settled) return;
      if (tooLarge) {
        await upload?.catch(() => undefined);
        fail(
          new AppError(
            'FILE_TOO_LARGE',
            `Sheet exceeds the ${env.UPLOAD_MAX_BYTES}-byte limit.`,
          ),
        );
        return;
      }
      if (!upload) {
        fail(new AppError('VALIDATION_ERROR', 'No file part was provided.'));
        return;
      }
      try {
        const file = await upload;
        const fieldValues = sheetUploadFieldsSchema.parse(fields);
        const sheet = await createSheet(fieldValues, file, actorFrom(req));
        settled = true;
        res.status(201).json(successEnvelope(sheet, reqId(req)));
      } catch (err) {
        fail(err);
      }
    })();
  });

  req.pipe(bb);
};

/** GET /sheets — public, paginated list of uploaded sheets. */
export const listSheetsHandler: RequestHandler = async (req, res, next) => {
  try {
    const query = listSheetsQuerySchema.parse(req.query);
    const { sheets, pagination } = await listSheets(query);
    res.json(successEnvelope(sheets, reqId(req), pagination));
  } catch (err) {
    next(err);
  }
};

/** GET /sheets/:id — public single sheet. */
export const getSheetHandler: RequestHandler = async (req, res, next) => {
  try {
    const sheet = await getSheet((req.params as SheetIdParam).id);
    res.json(successEnvelope(sheet, reqId(req)));
  } catch (err) {
    next(err);
  }
};

/** POST /sheets/:id/flag — public flag (guests included), rate-limited per IP. */
export const flagSheetHandler: RequestHandler = async (req, res, next) => {
  try {
    const { id } = sheetIdParamSchema.parse(req.params);
    const { reason } = req.body as FlagSheetInput;
    const result = await flagSheet(
      id,
      req.user?.id ?? null,
      req.ip ?? 'unknown',
      reason,
      req.user?.role ?? null,
    );
    res.status(201).json(successEnvelope(result, reqId(req)));
  } catch (err) {
    next(err);
  }
};
