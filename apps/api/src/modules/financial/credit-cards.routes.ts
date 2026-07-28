import { Router } from "express";
import { CreditCardsController } from "./credit-cards.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router: Router = Router();
const controller = new CreditCardsController();

router.use(authMiddleware);

router.get("/", controller.getCards.bind(controller));
router.post("/", controller.createCard.bind(controller));

router.get("/:id", controller.getCard.bind(controller));
router.put("/:id", controller.updateCard.bind(controller));
router.delete("/:id", controller.deleteCard.bind(controller));

router.post("/:id/expenses", controller.addExpense.bind(controller));
router.put("/:id/expenses/:expenseId", controller.updateExpense.bind(controller));
router.delete("/:id/expenses/:expenseId", controller.deleteExpense.bind(controller));

router.post("/:id/invoices/:invoiceId/close", controller.closeInvoice.bind(controller));
router.post("/:id/invoices", controller.createInvoice.bind(controller));
router.put("/:id/invoices/:invoiceId", controller.updateInvoice.bind(controller));
router.delete("/:id/invoices/:invoiceId", controller.deleteInvoice.bind(controller));

export { router as creditCardsRoutes };
