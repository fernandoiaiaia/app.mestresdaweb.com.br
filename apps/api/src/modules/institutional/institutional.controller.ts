import { Request, Response } from "express";
import { institutionalService } from "./institutional.service.js";

export const institutionalController = {
    async get(req: Request, res: Response) {
        const data = await institutionalService.get(req.user!);
        res.json({ success: true, data });
    },

    async upsert(req: Request, res: Response) {
        const data = await institutionalService.upsert(req.body, req.user!);
        res.json({ success: true, data });
    },
};
