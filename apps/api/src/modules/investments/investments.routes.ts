import { Router } from "express";
import { investmentsController } from "./investments.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createInvestmentSchema, updateBalanceSchema } from "./investments.schemas.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", investmentsController.list);
router.get("/:id", investmentsController.getById);
router.post("/", validate({ body: createInvestmentSchema }), investmentsController.create);
router.post("/:id/balance", validate({ body: updateBalanceSchema }), investmentsController.updateBalance);

export const investmentsRoutes = router;
