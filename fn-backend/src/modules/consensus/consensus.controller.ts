import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import { claimNextSheet, submitEntry } from './consensus.service';
import type { SubmitEntryInput } from './consensus.schemas';

function reqId(req: Parameters<RequestHandler>[0]): string {
  return req.id as unknown as string;
}

/** POST /transcription/claim — hand the transcriber their next sheet (pull model). */
export const claimSheetHandler: RequestHandler = async (req, res, next) => {
  try {
    const claim = await claimNextSheet(req.user!.id);
    res.json(successEnvelope(claim, reqId(req)));
  } catch (err) {
    next(err);
  }
};

/** POST /transcription/entries — submit one reading of a sheet's figures. */
export const submitEntryHandler: RequestHandler = async (req, res, next) => {
  try {
    const result = await submitEntry(req.user!.id, req.body as SubmitEntryInput, req.ip ?? null);
    res.status(201).json(successEnvelope(result, reqId(req)));
  } catch (err) {
    next(err);
  }
};
