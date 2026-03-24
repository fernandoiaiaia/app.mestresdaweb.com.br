import { Request, Response } from "express";
import { companiesService } from "./companies.service.js";

export const companiesController = {
    async list(req: Request, res: Response) {
        const jwtUser = (req as any).user;
        const { search, status, segment } = req.query as any;
        const companies = await companiesService.list(jwtUser, { search, status, segment });
        res.json({ success: true, data: companies });
    },

    async getById(req: Request, res: Response) {
        const jwtUser = (req as any).user;
        const company = await companiesService.getById(req.params.id as string, jwtUser);
        res.json({ success: true, data: company });
    },

    async create(req: Request, res: Response) {
        const jwtUser = (req as any).user;
        const company = await companiesService.create(req.body, jwtUser);
        res.status(201).json({ success: true, data: company });
    },

    async update(req: Request, res: Response) {
        const jwtUser = (req as any).user;
        const company = await companiesService.update(req.params.id as string, req.body, jwtUser);
        res.json({ success: true, data: company });
    },

    async delete(req: Request, res: Response) {
        const jwtUser = (req as any).user;
        await companiesService.delete(req.params.id as string, jwtUser);
        res.json({ success: true, message: "Empresa excluída com sucesso" });
    },
};
