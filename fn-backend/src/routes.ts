import { Router } from 'express';
import { authRouter, usersRouter } from './modules/auth/auth.routes';
import { electionsRouter } from './modules/elections/elections.routes';
import { articlesRouter } from './modules/content/content.routes';
import { geographyRouter } from './modules/geography/geography.routes';
import { ratingsRouter } from './modules/ratings/ratings.routes';
import { uploadRouter, sheetsRouter } from './modules/upload/upload.routes';
import { transcriptionRouter } from './modules/consensus/consensus.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { auditRouter } from './modules/audit/audit.routes';


export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/elections', electionsRouter);
apiRouter.use('/articles', articlesRouter);
apiRouter.use('/geography', geographyRouter);
apiRouter.use('/ratings', ratingsRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/sheets', sheetsRouter);
apiRouter.use('/transcription', transcriptionRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/audit', auditRouter);
