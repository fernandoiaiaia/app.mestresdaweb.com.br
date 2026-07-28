import type { Request, Response } from "express";
import { devSprintsService } from "./dev-sprints.service.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Sprints Controller
// ═══════════════════════════════════════

export const devSprintsController = {

    /** GET /project/:projectId — list sprints for a project */
    async listByProject(req: Request, res: Response) {
        const sprints = await devSprintsService.listByProject(req.params.projectId as string);
        res.json({ success: true, data: sprints });
    },

    /** POST /project/:projectId — create a sprint */
    async create(req: Request, res: Response) {
        const { name, goal, startDate, endDate, taskIds } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ success: false, error: { code: "VALIDATION", message: "Nome da sprint é obrigatório." } });
        }
        const sprint = await devSprintsService.create({
            projectId: req.params.projectId as string,
            name,
            goal,
            startDate,
            endDate,
            taskIds,
        });
        res.status(201).json({ success: true, data: sprint });
    },

    /** PATCH /:id — update a sprint (status, name, dates, taskIds, etc.) */
    async update(req: Request, res: Response) {
        const sprint = await devSprintsService.update(req.params.id as string, req.body);
        res.json({ success: true, data: sprint });
    },

    /** DELETE /:id — delete a sprint */
    async delete(req: Request, res: Response) {
        await devSprintsService.delete(req.params.id as string);
        res.json({ success: true, data: null });
    },
};
