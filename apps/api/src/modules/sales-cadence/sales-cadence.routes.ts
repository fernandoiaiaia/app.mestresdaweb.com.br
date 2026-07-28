import { Router, Request, Response } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { salesCadenceService } from "./sales-cadence.service.js";

// ═══════════════════════════════════════
// Sales Cadence Routes — CRM
// ═══════════════════════════════════════

const router = Router();
router.use(authMiddleware);

const getUser = (req: Request) => (req as any).user;
const getParam = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

/* ─── Cadences ─── */

// List all
router.get("/", async (req: Request, res: Response) => {
    try {
        const data = await salesCadenceService.list(getUser(req).userId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao listar cadências" } });
    }
});

// Get by funnel
router.get("/funnel/:funnelId", async (req: Request, res: Response) => {
    try {
        const data = await salesCadenceService.getByFunnelId(getParam(req.params.funnelId), getUser(req).userId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao buscar cadências do funil" } });
    }
});

// Get cadence for a stage
router.get("/stage/:stageId", async (req: Request, res: Response) => {
    try {
        const data = await salesCadenceService.getByStageId(getParam(req.params.stageId), getUser(req).userId);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao buscar cadência da fase" } });
    }
});

// Get execution log for a deal
router.get("/executions/:dealId", async (req: Request, res: Response) => {
    try {
        const data = await salesCadenceService.getExecutionsForDeal(getParam(req.params.dealId));
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao buscar execuções" } });
    }
});

// Get by id
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const data = await salesCadenceService.getById(getParam(req.params.id), getUser(req).userId);
        if (!data) return res.status(404).json({ success: false, error: { message: "Cadência não encontrada" } });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao buscar cadência" } });
    }
});

// Create
router.post("/", async (req: Request, res: Response) => {
    try {
        const { funnelId, stageId, name, description } = req.body;
        if (!funnelId || !stageId || !name) {
            return res.status(400).json({ success: false, error: { message: "funnelId, stageId e name são obrigatórios" } });
        }
        const data = await salesCadenceService.create({
            userId: getUser(req).userId,
            funnelId,
            stageId,
            name,
            description,
        });
        res.status(201).json({ success: true, data });
    } catch (err: any) {
        if (err.code === "P2002") {
            return res.status(409).json({ success: false, error: { message: "Já existe uma cadência para esta fase" } });
        }
        res.status(500).json({ success: false, error: { message: "Erro ao criar cadência" } });
    }
});

// Update
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const { name, description, isActive } = req.body;
        const data = await salesCadenceService.update(getParam(req.params.id), getUser(req).userId, { name, description, isActive });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao atualizar cadência" } });
    }
});

// Delete
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        await salesCadenceService.remove(getParam(req.params.id), getUser(req).userId);
        res.json({ success: true, message: "Cadência removida" });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao remover cadência" } });
    }
});

/* ─── Steps ─── */

// Add step
router.post("/:id/steps", async (req: Request, res: Response) => {
    try {
        const { type, title, delayDays, delayHours, templateContent, subject } = req.body;
        if (!type || !title) {
            return res.status(400).json({ success: false, error: { message: "type e title são obrigatórios" } });
        }
        const data = await salesCadenceService.addStep(getParam(req.params.id), {
            type,
            title,
            delayDays: delayDays || 0,
            delayHours: delayHours || 0,
            templateContent,
            subject,
        });
        res.status(201).json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao adicionar step" } });
    }
});

// Update step
router.put("/steps/:stepId", async (req: Request, res: Response) => {
    try {
        const { type, title, delayDays, delayHours, templateContent, subject } = req.body;
        const data = await salesCadenceService.updateStep(getParam(req.params.stepId), {
            type, title, delayDays, delayHours, templateContent, subject,
        });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao atualizar step" } });
    }
});

// Delete step
router.delete("/steps/:stepId", async (req: Request, res: Response) => {
    try {
        await salesCadenceService.removeStep(getParam(req.params.stepId));
        res.json({ success: true, message: "Step removido" });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao remover step" } });
    }
});

// Reorder steps
router.put("/steps/reorder", async (req: Request, res: Response) => {
    try {
        const { steps } = req.body; // [{ id, orderIndex }]
        if (!Array.isArray(steps)) {
            return res.status(400).json({ success: false, error: { message: "steps deve ser um array" } });
        }
        await salesCadenceService.reorderSteps(steps);
        res.json({ success: true, message: "Reordenado" });
    } catch (err) {
        res.status(500).json({ success: false, error: { message: "Erro ao reordenar" } });
    }
});

export const salesCadenceRoutes: Router = router;
