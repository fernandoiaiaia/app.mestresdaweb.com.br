import { Request, Response } from "express";
import { sdrService } from "./sdr.service.js";
import {
    createCadenceSchema, updateCadenceSchema, updateCadenceStatusSchema,
    addStepSchema, updateStepSchema, reorderStepsSchema,
    createLeadSchema, updateLeadSchema, activateLeadsSchema, importLeadsSchema,
    createCriteriaSchema, updateCriteriaSchema, reorderCriteriaSchema, updateThresholdsSchema,
    listLeadsQuerySchema, monitorLeadsQuerySchema,
    createMeetingSchema, updateMeetingSchema,
} from "./sdr.schemas.js";

// ═══════════════════════════════════════
// Helper
// ═══════════════════════════════════════
function getUser(req: Request) {
    return (req as any).user as { userId: string; role: string };
}

function getParam(req: Request, name: string): string {
    const val = req.params[name];
    return Array.isArray(val) ? val[0] : val;
}

function handleError(res: Response, err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno";
    res.status(400).json({ success: false, error: { message } });
}

// ═══════════════════════════════════════
// SDR Controller
// ═══════════════════════════════════════
export const sdrController = {
    // ═══ CADENCES ═══
    async listCadences(req: Request, res: Response) {
        try {
            const data = await sdrService.listCadences(getUser(req));
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async getCadence(req: Request, res: Response) {
        try {
            const data = await sdrService.getCadence(getParam(req, 'id'), getUser(req));
            if (!data) return res.status(404).json({ success: false, error: { message: "Cadência não encontrada" } });
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async createCadence(req: Request, res: Response) {
        try {
            const body = createCadenceSchema.parse(req.body);
            const data = await sdrService.createCadence(body, getUser(req));
            res.status(201).json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async updateCadence(req: Request, res: Response) {
        try {
            const body = updateCadenceSchema.parse(req.body);
            const data = await sdrService.updateCadence(getParam(req, 'id'), body, getUser(req));
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async updateCadenceStatus(req: Request, res: Response) {
        try {
            const body = updateCadenceStatusSchema.parse(req.body);
            const data = await sdrService.updateCadenceStatus(getParam(req, 'id'), body.status, getUser(req));
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async deleteCadence(req: Request, res: Response) {
        try {
            await sdrService.deleteCadence(getParam(req, 'id'), getUser(req));
            res.json({ success: true, message: "Cadência deletada" });
        } catch (err) { handleError(res, err); }
    },

    // ═══ STEPS ═══
    async addStep(req: Request, res: Response) {
        try {
            const body = addStepSchema.parse(req.body);
            const data = await sdrService.addStep(getParam(req, 'id'), body, getUser(req));
            res.status(201).json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async updateStep(req: Request, res: Response) {
        try {
            const body = updateStepSchema.parse(req.body);
            const data = await sdrService.updateStep(getParam(req, 'id'), getParam(req, 'stepId'), body, getUser(req));
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async deleteStep(req: Request, res: Response) {
        try {
            await sdrService.deleteStep(getParam(req, 'id'), getParam(req, 'stepId'), getUser(req));
            res.json({ success: true, message: "Step deletado" });
        } catch (err) { handleError(res, err); }
    },

    async reorderSteps(req: Request, res: Response) {
        try {
            const body = reorderStepsSchema.parse(req.body);
            await sdrService.reorderSteps(getParam(req, 'id'), body.stepIds, getUser(req));
            res.json({ success: true, message: "Steps reordenados" });
        } catch (err) { handleError(res, err); }
    },

    // ═══ LEADS ═══
    async getAvailableLeads(req: Request, res: Response) {
        try {
            const data = await sdrService.getAvailableLeads(req.query);
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async activateLeads(req: Request, res: Response) {
        try {
            const body = activateLeadsSchema.parse(req.body);
            const data = await sdrService.activateLeads(body.leadIds, body.cadenceId, body.consultantId);
            res.json({ success: true, data, message: `${body.leadIds.length} leads ativados` });
        } catch (err) { handleError(res, err); }
    },

    async importLeads(req: Request, res: Response) {
        try {
            const body = importLeadsSchema.parse(req.body);
            const data = await sdrService.importLeads(body.leads, body.cadenceId);
            res.status(201).json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async pauseLead(req: Request, res: Response) {
        try {
            await sdrService.pauseLead(getParam(req, 'id'));
            res.json({ success: true, message: "Lead pausado" });
        } catch (err) { handleError(res, err); }
    },

    async resumeLead(req: Request, res: Response) {
        try {
            await sdrService.resumeLead(getParam(req, 'id'));
            res.json({ success: true, message: "Lead retomado" });
        } catch (err) { handleError(res, err); }
    },

    async removeLead(req: Request, res: Response) {
        try {
            await sdrService.removeLead(getParam(req, 'id'));
            res.json({ success: true, message: "Lead removido da cadência" });
        } catch (err) { handleError(res, err); }
    },

    async takeoverLead(req: Request, res: Response) {
        try {
            const data = await sdrService.takeoverLead(getParam(req, 'id'));
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    // ═══ MONITOR ═══
    async getMonitorStats(req: Request, res: Response) {
        try {
            const data = await sdrService.getMonitorStats();
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async getMonitorLeads(req: Request, res: Response) {
        try {
            const query = monitorLeadsQuerySchema.parse(req.query);
            const data = await sdrService.getMonitorLeads(query);
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async getActivityFeed(req: Request, res: Response) {
        try {
            const data = await sdrService.getActivityFeed();
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async getInterventions(req: Request, res: Response) {
        try {
            const data = await sdrService.getInterventions();
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    // ═══ TIMELINE ═══
    async getLeadTimeline(req: Request, res: Response) {
        try {
            const data = await sdrService.getLeadTimeline(getParam(req, 'id'));
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async getLeadQualification(req: Request, res: Response) {
        try {
            const data = await sdrService.getLeadQualification(getParam(req, 'id'));
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    // ═══ QUALIFICATION ═══
    async listCriteria(req: Request, res: Response) {
        try {
            const data = await sdrService.listCriteria();
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async createCriteria(req: Request, res: Response) {
        try {
            const body = createCriteriaSchema.parse(req.body);
            const data = await sdrService.createCriteria(body);
            res.status(201).json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async updateCriteria(req: Request, res: Response) {
        try {
            const body = updateCriteriaSchema.parse(req.body);
            const data = await sdrService.updateCriteria(getParam(req, 'id'), body);
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async deleteCriteria(req: Request, res: Response) {
        try {
            await sdrService.deleteCriteria(getParam(req, 'id'));
            res.json({ success: true, message: "Critério deletado" });
        } catch (err) { handleError(res, err); }
    },

    async reorderCriteria(req: Request, res: Response) {
        try {
            const body = reorderCriteriaSchema.parse(req.body);
            await sdrService.reorderCriteria(body.criteriaIds);
            res.json({ success: true, message: "Critérios reordenados" });
        } catch (err) { handleError(res, err); }
    },

    async getThresholds(req: Request, res: Response) {
        try {
            const data = await sdrService.getThresholds();
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async updateThresholds(req: Request, res: Response) {
        try {
            const body = updateThresholdsSchema.parse(req.body);
            const data = await sdrService.updateThresholds(body);
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async recalculateScore(req: Request, res: Response) {
        try {
            // Will be implemented via qualification.service.ts
            res.json({ success: true, message: "Score recalculado (placeholder)" });
        } catch (err) { handleError(res, err); }
    },

    async overrideTemperature(req: Request, res: Response) {
        try {
            const { temperature } = req.body;
            const data = await sdrService.updateLead(getParam(req, 'id'), { temperature });
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    // ═══ SCHEDULING ═══
    async listMeetings(req: Request, res: Response) {
        try {
            const data = await sdrService.listMeetings(req.query as any);
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async createMeeting(req: Request, res: Response) {
        try {
            const body = createMeetingSchema.parse(req.body);
            const data = await sdrService.createMeeting(body);
            res.status(201).json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },

    async updateMeeting(req: Request, res: Response) {
        try {
            const body = updateMeetingSchema.parse(req.body);
            const data = await sdrService.updateMeeting(getParam(req, 'id'), body);
            res.json({ success: true, data });
        } catch (err) { handleError(res, err); }
    },
};
