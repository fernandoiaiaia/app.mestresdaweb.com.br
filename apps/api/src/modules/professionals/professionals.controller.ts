import { Request, Response } from "express";
import { professionalsService } from "./professionals.service.js";

export const professionalsController = {
    async list(req: Request, res: Response) {
        try {
            const data = await professionalsService.list(req.user!.userId);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    async create(req: Request, res: Response) {
        try {
            const { role, seniority, seniorityColor, hourlyRate, currency } = req.body;
            if (!role || hourlyRate === undefined) {
                res.status(400).json({ success: false, error: "role e hourlyRate são obrigatórios." });
                return;
            }
            const data = await professionalsService.create(req.user!.userId, {
                role, seniority: seniority || "Pleno", seniorityColor: seniorityColor || "#22c55e", hourlyRate: Number(hourlyRate), currency,
            });
            res.status(201).json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    async update(req: Request, res: Response) {
        try {
            const data = await professionalsService.update(req.params.id as string, req.user!.userId, req.body);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        try {
            await professionalsService.delete(req.params.id as string, req.user!.userId);
            res.json({ success: true });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    /** Returns only active roles + rates — used by step-4 and step-5 */
    async activeRoles(req: Request, res: Response) {
        try {
            const data = await professionalsService.getActiveRoles(req.user!.userId);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },
};
