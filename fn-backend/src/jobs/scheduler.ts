import {
  buildAndCacheRatingsDashboard,
  buildAndCacheResultsDashboard,
} from '../modules/dashboard/dashboard.service';
import { logger } from '../shared/logger';

const DASHBOARD_AGGREGATION_INTERVAL_MS = 15 * 60 * 1000;
const INITIAL_WARMUP_DELAY_MS = 5_000;

let aggregationTimer: NodeJS.Timeout | undefined;
let warmupTimer: NodeJS.Timeout | undefined;

async function runDashboardAggregation(): Promise<void> {
  try {
    const ratings = await buildAndCacheRatingsDashboard();
    logger.info(`Ratings aggregation: cached ${ratings.elections} election(s).`);
  } catch (err) {
    logger.error(`Ratings aggregation failed: ${(err as Error).message}`);
  }
  try {
    const results = await buildAndCacheResultsDashboard();
    logger.info(`Results aggregation: cached ${results.elections} election(s).`);
  } catch (err) {
    logger.error(`Results aggregation failed: ${(err as Error).message}`);
  }
}
export function startScheduledJobs(): void {
  warmupTimer = setTimeout(() => void runDashboardAggregation(), INITIAL_WARMUP_DELAY_MS);
  warmupTimer.unref();

  aggregationTimer = setInterval(
    () => void runDashboardAggregation(),
    DASHBOARD_AGGREGATION_INTERVAL_MS,
  );
  aggregationTimer.unref();

  logger.info('Scheduled jobs started (dashboard aggregation every 15m).');
}

/** Stop all background jobs during graceful shutdown. */
export function stopScheduledJobs(): void {
  if (warmupTimer) {
    clearTimeout(warmupTimer);
    warmupTimer = undefined;
  }
  if (aggregationTimer) {
    clearInterval(aggregationTimer);
    aggregationTimer = undefined;
  }
}
