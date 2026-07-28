import { Request, Response } from "express";
import { TaxInvoicesService } from "./tax-invoices.service.js";

const service = new TaxInvoicesService();

export class TaxInvoicesController {
    
    // GET /api/financial/tax-invoices
    async getInvoices(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const invoices = await service.getInvoices(userId);
            return res.json({ success: true, data: invoices });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // POST /api/financial/tax-invoices
    async createInvoice(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const data = req.body;
            if (!data.clientName || !data.clientDocument || !data.serviceDescription || data.value === undefined) {
                return res.status(400).json({ success: false, error: { message: "Faltam campos obrigatórios" } });
            }

            const invoice = await service.createInvoice(userId, data);
            return res.status(201).json({ success: true, data: invoice });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }

    // DELETE /api/financial/tax-invoices/:id
    async cancelInvoice(req: Request, res: Response) {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ error: "Unauthorized" });

            const invoiceId = req.params.id as string;
            await service.cancelInvoice(userId, invoiceId);
            return res.json({ success: true });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: { message: error.message } });
        }
    }
}
