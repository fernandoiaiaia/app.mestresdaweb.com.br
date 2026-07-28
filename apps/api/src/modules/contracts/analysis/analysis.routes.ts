import { Router } from 'express';
import { contractAnalysisController } from './analysis.controller.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';

const router: Router = Router();

router.use(authMiddleware);

router.post('/analyze-risks', contractAnalysisController.analyzeRisks);

export { router as contractAnalysisRoutes };
