import { Router } from 'express';
import { contractTemplatesController } from './contract-templates.controller.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';

const router: Router = Router();

router.use(authMiddleware);

router.get('/', contractTemplatesController.list);
router.get('/:id', contractTemplatesController.getById);
router.post('/', contractTemplatesController.create);
router.put('/:id', contractTemplatesController.update);
router.delete('/:id', contractTemplatesController.delete);
router.post('/generate-ai', contractTemplatesController.generateWithAI);

export { router as contractTemplatesRoutes };
