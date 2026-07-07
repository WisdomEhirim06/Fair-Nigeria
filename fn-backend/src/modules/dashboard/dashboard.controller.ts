import type { RequestHandler } from 'express';

import { successEnvelope } from '../../shared/response';
import {
  ratingsDashboardQuerySchema,
  resultsDashboardQuerySchema,
  stateResultsQuerySchema,
} from './dashboard.schemas';
import { getRatingsDashboard, getResultsDashboard, getStateResults } from './dashboard.service';

export const getRatingsDashboardHandler: RequestHandler = async (req, res, next) => {
  try {
    const { electionId } = ratingsDashboardQuerySchema.parse(req.query);
    const dashboard = await getRatingsDashboard(electionId);
    const requestId = req.id as unknown as string;
    res.json(successEnvelope(dashboard, requestId));
  } catch (err) {
    next(err);
  }
};

// GET /dashboard/results — national + per-state verified figures. Public, Redis-only.
export const getResultsDashboardHandler: RequestHandler = async (req, res, next) => {
  try {
    const { electionId } = resultsDashboardQuerySchema.parse(req.query);
    const dashboard = await getResultsDashboard(electionId);
    res.json(successEnvelope(dashboard, req.id as unknown as string));
  } catch (err) {
    next(err);
  }
};

// GET /dashboard/results/state — one state's LGA breakdown. Public, Redis-only.
export const getStateResultsHandler: RequestHandler = async (req, res, next) => {
  try {
    const { electionId, stateId } = stateResultsQuerySchema.parse(req.query);
    const detail = await getStateResults(electionId, stateId);
    res.json(successEnvelope(detail, req.id as unknown as string));
  } catch (err) {
    next(err);
  }
};
