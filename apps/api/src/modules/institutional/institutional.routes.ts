import { Router } from "express";
import { institutionalController } from "./institutional.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { upsertInstitutionalSchema } from "./institutional.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", institutionalController.get);
router.put("/", validate({ body: upsertInstitutionalSchema }), institutionalController.upsert);

export const institutionalRoutes = router;
