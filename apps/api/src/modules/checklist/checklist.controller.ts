import { Request, Response } from "express";
import { checklistService } from "./checklist.service.js";

export const checklistController = {
    // ═══ Categories ═══
    async listCategories(req: Request, res: Response) {
        const data = await checklistService.listCategories(req.user!);
        res.json({ success: true, data });
    },
    async createCategory(req: Request, res: Response) {
        const data = await checklistService.createCategory(req.body, req.user!);
        res.status(201).json({ success: true, data });
    },
    async updateCategory(req: Request, res: Response) {
        const data = await checklistService.updateCategory(req.params.id as string, req.body, req.user!);
        res.json({ success: true, data });
    },
    async deleteCategory(req: Request, res: Response) {
        await checklistService.deleteCategory(req.params.id as string, req.user!);
        res.json({ success: true, message: "Categoria excluída" });
    },

    // ═══ Questions ═══
    async listQuestions(req: Request, res: Response) {
        const data = await checklistService.listQuestions(req.user!);
        res.json({ success: true, data });
    },
    async createQuestion(req: Request, res: Response) {
        const data = await checklistService.createQuestion(req.body, req.user!);
        res.status(201).json({ success: true, data });
    },
    async updateQuestion(req: Request, res: Response) {
        const data = await checklistService.updateQuestion(req.params.id as string, req.body, req.user!);
        res.json({ success: true, data });
    },
    async deleteQuestion(req: Request, res: Response) {
        await checklistService.deleteQuestion(req.params.id as string, req.user!);
        res.json({ success: true, message: "Pergunta excluída" });
    },
};
