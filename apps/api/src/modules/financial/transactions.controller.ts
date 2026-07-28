import { Request, Response } from "express";
import { transactionsService } from "./transactions.service.js";

export const transactionsController = {
    // List Transactions
    async list(req: Request, res: Response) {
        try {
            const data = await transactionsService.list(req.query, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Get Transaction by ID
    async getById(req: Request, res: Response) {
        try {
            const data = await transactionsService.getById(req.params.id as string, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Create Transaction
    async create(req: Request, res: Response) {
        try {
            const data = await transactionsService.create(req.body, req.user!);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Update Transaction
    async update(req: Request, res: Response) {
        try {
            const data = await transactionsService.update(req.params.id as string, req.body, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Delete Transaction
    async delete(req: Request, res: Response) {
        try {
            const scope = (req.query.scope as "this" | "future" | "all") || "this";
            await transactionsService.delete(req.params.id as string, req.user!, scope);
            res.json({ success: true, message: "Transação excluída com sucesso" });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Batch Pay
    async batchPay(req: Request, res: Response) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "IDs devem ser informados em um array" } });
                return;
            }
            await transactionsService.batchPay(ids, req.user!);
            res.json({ success: true, message: "Transações marcadas como pagas" });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Batch Delete
    async batchDelete(req: Request, res: Response) {
        try {
            const { ids } = req.body;
            if (!ids || !Array.isArray(ids)) {
                res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "IDs devem ser informados em um array" } });
                return;
            }
            await transactionsService.batchDelete(ids, req.user!);
            res.json({ success: true, message: "Transações excluídas com sucesso" });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Upload Attachment
    async uploadAttachment(req: Request, res: Response) {
        try {
            if (!req.file) {
                res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Nenhum arquivo enviado" } });
                return;
            }
            const data = await transactionsService.addAttachment(req.params.id as string, req.file, req.user!);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Download Attachment
    async downloadAttachment(req: Request, res: Response) {
        try {
            const file = await transactionsService.getAttachment(req.params.id as string, req.params.fileId as string, req.user!);
            if (!file) {
                res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Arquivo não encontrado" } });
                return;
            }
            res.download(file.filePath, file.filename);
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },

    // Delete Attachment
    async deleteAttachment(req: Request, res: Response) {
        try {
            const result = await transactionsService.deleteAttachment(req.params.id as string, req.params.fileId as string, req.user!);
            if (!result) {
                res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Arquivo não encontrado ou transação incorreta" } });
                return;
            }
            res.json({ success: true, message: "Arquivo excluído com sucesso" });
        } catch (error: any) {
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } });
        }
    },
};
