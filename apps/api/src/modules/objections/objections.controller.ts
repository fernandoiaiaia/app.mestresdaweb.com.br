import { Request, Response } from "express";
import { objectionsService } from "./objections.service.js";

export const objectionsController = {
    // ═══ Categories ═══

    async listCategories(req: Request, res: Response) {
        const data = await objectionsService.listCategories(req.user!);
        res.json({ success: true, data });
    },

    async createCategory(req: Request, res: Response) {
        const data = await objectionsService.createCategory(req.body, req.user!);
        res.status(201).json({ success: true, data });
    },

    async updateCategory(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await objectionsService.updateCategory(id, req.body, req.user!);
        res.json({ success: true, data });
    },

    async deleteCategory(req: Request, res: Response) {
        const id = req.params.id as string;
        await objectionsService.deleteCategory(id, req.user!);
        res.json({ success: true, message: "Categoria excluída" });
    },

    // ═══ Objections ═══

    async listObjections(req: Request, res: Response) {
        const data = await objectionsService.listObjections(req.user!);
        res.json({ success: true, data });
    },

    async createObjection(req: Request, res: Response) {
        const data = await objectionsService.createObjection(req.body, req.user!);
        res.status(201).json({ success: true, data });
    },

    async updateObjection(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await objectionsService.updateObjection(id, req.body, req.user!);
        res.json({ success: true, data });
    },

    async toggleObjection(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await objectionsService.toggleObjection(id, req.user!);
        res.json({ success: true, data });
    },

    async deleteObjection(req: Request, res: Response) {
        const id = req.params.id as string;
        await objectionsService.deleteObjection(id, req.user!);
        res.json({ success: true, message: "Objeção excluída" });
    },
};
