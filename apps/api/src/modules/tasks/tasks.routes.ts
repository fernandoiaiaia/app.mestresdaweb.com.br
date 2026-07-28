import { Router } from "express";
import { tasksController } from "./tasks.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
    createTaskSchema,
    updateTaskSchema,
    taskParamsSchema,
} from "./tasks.schemas.js";

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// ═══ Tasks Routes ═══

router.get(
    "/",
    tasksController.list
);

router.post(
    "/",
    validate({ body: createTaskSchema }),
    tasksController.create
);

router.get(
    "/:id",
    validate({ params: taskParamsSchema }),
    tasksController.getById
);

router.put(
    "/:id",
    validate({ params: taskParamsSchema, body: updateTaskSchema }),
    tasksController.update
);

router.delete(
    "/:id",
    validate({ params: taskParamsSchema }),
    tasksController.delete
);

export const tasksRoutes = router;
