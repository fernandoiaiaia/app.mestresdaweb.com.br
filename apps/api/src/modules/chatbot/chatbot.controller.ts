import { Request, Response, Router } from "express";
import { chatbotSettingsService } from "./chatbot-settings.service.js";
import { chatbotFlowService } from "./chatbot-flow.service.js";
import { chatbotKnowledgeService } from "./chatbot-knowledge.service.js";
import { chatbotSessionService } from "./chatbot-session.service.js";
import { chatbotTemplateService } from "./chatbot-template.service.js";
import { chatbotService } from "./chatbot.service.js";

const router: Router = Router();

// ═══════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════

router.get("/settings", async (_req: Request, res: Response) => {
    try {
        const data = await chatbotSettingsService.get();
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/settings", async (req: Request, res: Response) => {
    try {
        const data = await chatbotSettingsService.update(req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════
// FLOWS
// ═══════════════════════════════════════

router.get("/flows", async (_req: Request, res: Response) => {
    try {
        const data = await chatbotFlowService.list();
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/flows", async (req: Request, res: Response) => {
    try {
        const data = await chatbotFlowService.create(req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/flows/:id", async (req: Request, res: Response) => {
    try {
        const data = await chatbotFlowService.update(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete("/flows/:id", async (req: Request, res: Response) => {
    try {
        await chatbotFlowService.delete(req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════

router.get("/knowledge", async (_req: Request, res: Response) => {
    try {
        const data = await chatbotKnowledgeService.list();
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/knowledge", async (req: Request, res: Response) => {
    try {
        const data = await chatbotKnowledgeService.create(req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/knowledge/:id", async (req: Request, res: Response) => {
    try {
        const data = await chatbotKnowledgeService.update(req.params.id, req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete("/knowledge/:id", async (req: Request, res: Response) => {
    try {
        await chatbotKnowledgeService.delete(req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════
// SESSIONS
// ═══════════════════════════════════════

router.get("/sessions", async (req: Request, res: Response) => {
    try {
        const data = await chatbotSessionService.list({
            status: req.query.status as string | undefined,
            flowId: req.query.flowId as string | undefined,
        });
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/sessions/stats", async (_req: Request, res: Response) => {
    try {
        const data = await chatbotSessionService.getStats();
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/sessions/:id", async (req: Request, res: Response) => {
    try {
        const data = await chatbotSessionService.getById(req.params.id);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/sessions/:id/transfer", async (req: Request, res: Response) => {
    try {
        const data = await chatbotSessionService.transfer(req.params.id);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════

router.get("/templates", async (_req: Request, res: Response) => {
    try {
        const data = await chatbotTemplateService.list();
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/templates", async (req: Request, res: Response) => {
    try {
        const data = await chatbotTemplateService.create(req.body);
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.delete("/templates/:id", async (req: Request, res: Response) => {
    try {
        await chatbotTemplateService.delete(req.params.id);
        res.json({ success: true });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/templates/sync", async (_req: Request, res: Response) => {
    try {
        await chatbotTemplateService.syncAll();
        const data = await chatbotTemplateService.list();
        res.json({ success: true, data });
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ═══════════════════════════════════════
// TRIGGER OUTBOUND
// ═══════════════════════════════════════

router.post("/trigger/:dealId", async (req: Request, res: Response) => {
    try {
        const result = await chatbotService.triggerOutbound(req.params.dealId);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ success: false, message: err.message });
    }
});

export default router;
