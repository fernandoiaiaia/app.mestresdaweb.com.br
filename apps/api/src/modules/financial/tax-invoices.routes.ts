import { Router } from "express";
import { TaxInvoicesController } from "./tax-invoices.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();
const controller = new TaxInvoicesController();

router.use(authMiddleware);

router.get("/", controller.getInvoices.bind(controller));
router.post("/", controller.createInvoice.bind(controller));
router.delete("/:id", controller.cancelInvoice.bind(controller));

export { router as taxInvoicesRoutes };
