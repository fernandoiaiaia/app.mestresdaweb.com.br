import { Router } from 'express';
import { emailTemplatesController } from './email-templates.controller.js';
import { authMiddleware } from '../../../middlewares/auth.middleware.js';

const router: Router = Router();

router.use(authMiddleware);

router.get('/', emailTemplatesController.list);
router.get('/:id', emailTemplatesController.getById);
router.post('/', emailTemplatesController.create);
router.put('/:id', emailTemplatesController.update);
router.delete('/:id', emailTemplatesController.delete);

export { router as emailTemplatesRoutes };
