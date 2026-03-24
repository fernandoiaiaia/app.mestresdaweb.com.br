import { Router } from "express";
import { clientsController } from "./clients.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createClientSchema,
    updateClientSchema,
    clientParamsSchema,
    bulkCreateClientSchema,
} from "./clients.schemas.js";

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// ═══ CRM Clients Routes ═══

router.get(
    "/",
    clientsController.list
);

router.post(
    "/bulk",
    validate({ body: bulkCreateClientSchema }),
    clientsController.bulkCreate
);

router.post(
    "/",
    validate({ body: createClientSchema }),
    clientsController.create
);

router.get(
    "/:id",
    validate({ params: clientParamsSchema }),
    clientsController.getById
);

router.put(
    "/:id",
    validate({ params: clientParamsSchema, body: updateClientSchema }),
    clientsController.update
);

router.delete(
    "/:id",
    validate({ params: clientParamsSchema }),
    clientsController.delete
);

export const clientsRoutes = router;
