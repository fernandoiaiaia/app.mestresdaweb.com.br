import { Request, Response } from "express";
import { companyBranchesService } from "./company-branches.service.js";

export const companyBranchesController = {
    async list(req: Request, res: Response) {
        try {
            const data = await companyBranchesService.list(req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const data = await companyBranchesService.getById(req.params.id as string, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(404).json({ success: false, message: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const data = await companyBranchesService.create(req.body, req.user!);
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await companyBranchesService.update(req.params.id as string, req.body, req.user!);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            await companyBranchesService.delete(req.params.id as string, req.user!);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
};
