import { Request, Response } from "express";
import { sourcesService } from "./sources.service.js";

export const sourcesController = {
    // ═══ Source Types ═══

    async listTypes(req: Request, res: Response) {
        const data = await sourcesService.listTypes(req.user!);
        res.json({ success: true, data });
    },

    async createType(req: Request, res: Response) {
        const data = await sourcesService.createType(req.body, req.user!);
        res.status(201).json({ success: true, data });
    },

    async updateType(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await sourcesService.updateType(id, req.body, req.user!);
        res.json({ success: true, data });
    },

    async deleteType(req: Request, res: Response) {
        const id = req.params.id as string;
        await sourcesService.deleteType(id, req.user!);
        res.json({ success: true, message: "Tipo excluído" });
    },

    // ═══ Sources ═══

    async listSources(req: Request, res: Response) {
        const data = await sourcesService.listSources(req.user!);
        res.json({ success: true, data });
    },

    async createSource(req: Request, res: Response) {
        const data = await sourcesService.createSource(req.body, req.user!);
        res.status(201).json({ success: true, data });
    },

    async updateSource(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await sourcesService.updateSource(id, req.body, req.user!);
        res.json({ success: true, data });
    },

    async toggleSource(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await sourcesService.toggleSource(id, req.user!);
        res.json({ success: true, data });
    },

    async deleteSource(req: Request, res: Response) {
        const id = req.params.id as string;
        await sourcesService.deleteSource(id, req.user!);
        res.json({ success: true, message: "Fonte excluída" });
    },

    // ═══ Campaigns ═══

    async createCampaign(req: Request, res: Response) {
        const id = req.params.id as string;
        const data = await sourcesService.createCampaign(id, req.body, req.user!);
        res.status(201).json({ success: true, data });
    },

    async updateCampaign(req: Request, res: Response) {
        const campaignId = req.params.campaignId as string;
        const data = await sourcesService.updateCampaign(campaignId, req.body, req.user!);
        res.json({ success: true, data });
    },

    async toggleCampaign(req: Request, res: Response) {
        const campaignId = req.params.campaignId as string;
        const data = await sourcesService.toggleCampaign(campaignId, req.user!);
        res.json({ success: true, data });
    },

    async deleteCampaign(req: Request, res: Response) {
        const campaignId = req.params.campaignId as string;
        await sourcesService.deleteCampaign(campaignId, req.user!);
        res.json({ success: true, message: "Campanha excluída" });
    },
};
