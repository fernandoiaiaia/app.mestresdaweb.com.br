import { Router } from "express";
import { bankAccountsController } from "./bank-accounts.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();

router.use(authMiddleware);

router.get("/", bankAccountsController.list);
router.get("/:id", bankAccountsController.getById);
router.post("/", bankAccountsController.create);
router.put("/:id", bankAccountsController.update);
router.delete("/:id", bankAccountsController.delete);

export const bankAccountsRoutes = router;
