import { Request, Response } from "express";
import { CreditCardsService } from "./credit-cards.service.js";

const service = new CreditCardsService();

export class CreditCardsController {
    
    // GET /api/financial/cards
    async getCards(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const cards = await service.getCards(userId);
            return res.json({ success: true, data: cards });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // POST /api/financial/cards
    async createCard(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const data = req.body;
            if (!data.name || !data.closingDay || !data.dueDay) {
                return res.status(400).json({ success: false, error: { message: "Name, closingDay and dueDay are required" } });
            }

            const card = await service.createCard(userId, data);
            return res.status(201).json({ success: true, data: card });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // PUT /api/financial/cards/:id
    async updateCard(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const cardId = req.params.id as string;
            const data = req.body;
            await service.updateCard(userId, cardId, data);
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // GET /api/financial/cards/:id
    async getCard(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const cardId = req.params.id as string;
            const card = await service.getCard(userId, cardId);
            if (!card) return res.status(404).json({ success: false, error: { message: "Card not found" } });

            return res.json({ success: true, data: card });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // DELETE /api/financial/cards/:id
    async deleteCard(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const cardId = req.params.id as string;
            await service.deleteCard(userId, cardId);
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // POST /api/financial/cards/:id/expenses
    async addExpense(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const cardId = req.params.id as string;
            const data = req.body;

            if (!data.date || !data.description || !data.category || !data.value) {
                return res.status(400).json({ success: false, error: { message: "Missing required fields" } });
            }

            const expenses = await service.addExpense(userId, cardId, data);
            return res.status(201).json({ success: true, data: expenses });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }


    // PUT /api/financial/cards/:id/expenses/:expenseId
    async updateExpense(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const { id: cardId, expenseId } = req.params as { id: string; expenseId: string };
            const data = req.body;
            
            const updatedExpense = await service.updateExpense(userId, cardId, expenseId, data);
            return res.json({ success: true, data: updatedExpense });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // DELETE /api/financial/cards/:id/expenses/:expenseId
    async deleteExpense(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const { id: cardId, expenseId } = req.params as { id: string; expenseId: string };
            
            await service.deleteExpense(userId, cardId, expenseId);
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // POST /api/financial/cards/:id/invoices/:invoiceId/close
    async closeInvoice(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const { id: cardId, invoiceId } = req.params as { id: string; invoiceId: string };
            const { account } = req.body;

            const invoice = await service.closeInvoice(userId, cardId, invoiceId, account);
            return res.json({ success: true, data: invoice });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: { message: error.message } });
        }
    }

    // POST /api/financial/cards/:id/invoices
    async createInvoice(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const cardId = req.params.id as string;
            const { month, year } = req.body;

            if (month === undefined || year === undefined) {
                return res.status(400).json({ success: false, error: { message: "Month and year are required" } });
            }

            const invoice = await service.createInvoice(userId, cardId, parseInt(month), parseInt(year));
            return res.status(201).json({ success: true, data: invoice });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: { message: error.message } });
        }
    }

    // PUT /api/financial/cards/:id/invoices/:invoiceId
    async updateInvoice(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const { id: cardId, invoiceId } = req.params as { id: string; invoiceId: string };
            const data = req.body;

            const updated = await service.updateInvoice(userId, cardId, invoiceId, data);
            return res.json({ success: true, data: updated });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: { message: error.message } });
        }
    }

    // DELETE /api/financial/cards/:id/invoices/:invoiceId
    async deleteInvoice(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const { id: cardId, invoiceId } = req.params as { id: string; invoiceId: string };

            await service.deleteInvoice(userId, cardId, invoiceId);
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(400).json({ success: false, error: { message: error.message } });
        }
    }
}
