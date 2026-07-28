// ═══════════════════════════════════════
// CHATBOT CONTROLLER — REST API Routes
// ═══════════════════════════════════════

import { Router, Request, Response } from "express";
import { logger } from "../../lib/logger.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
    chatbotConfigService,
    chatbotFlowService,
    chatbotKnowledgeService,
    whatsappTemplateService,
    chatbotSessionService
} from "./chatbot.service.js";

const router = Router();
router.use(authMiddleware);

// ═══════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════

/**
 * GET /api/chatbot/config
 * Get or create the chatbot configuration for the current user
 */
router.get("/config", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const config = await chatbotConfigService.getOrCreate(userId);
        res.json({ success: true, data: config });
    } catch (err) {
        logger.error({ err }, "Error getting chatbot config");
        res.status(500).json({ success: false, error: { message: "Erro ao carregar configuração" } });
    }
});

/**
 * PUT /api/chatbot/config
 * Update chatbot configuration
 */
router.put("/config", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const config = await chatbotConfigService.update(userId, req.body);
        res.json({ success: true, data: config });
    } catch (err) {
        logger.error({ err }, "Error updating chatbot config");
        res.status(500).json({ success: false, error: { message: "Erro ao salvar configuração" } });
    }
});

// ═══════════════════════════════════════
// FLOWS
// ═══════════════════════════════════════

/**
 * GET /api/chatbot/flows
 * List all chatbot flows with pagination
 */
router.get("/flows", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string | undefined;

        const result = await chatbotFlowService.list(userId, page, limit, search);
        res.json({ success: true, ...result });
    } catch (err) {
        logger.error({ err }, "Error listing chatbot flows");
        res.status(500).json({ success: false, error: { message: "Erro ao listar fluxos" } });
    }
});

/**
 * GET /api/chatbot/flows/:id
 * Get a single flow by ID
 */
router.get("/flows/:id", async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const flow = await chatbotFlowService.getById(id);
        if (!flow) return res.status(404).json({ success: false, error: { message: "Fluxo não encontrado" } });
        res.json({ success: true, data: flow });
    } catch (err) {
        logger.error({ err }, "Error getting chatbot flow");
        res.status(500).json({ success: false, error: { message: "Erro ao buscar fluxo" } });
    }
});

/**
 * POST /api/chatbot/flows
 * Create a new flow
 */
router.post("/flows", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const flow = await chatbotFlowService.create(userId, req.body);
        res.status(201).json({ success: true, data: flow });
    } catch (err: any) {
        logger.error({ err }, "Error creating chatbot flow");
        const msg = err?.code === "P2002"
            ? "Já existe um fluxo para este estágio neste chatbot"
            : "Erro ao criar fluxo";
        res.status(400).json({ success: false, error: { message: msg } });
    }
});

/**
 * PUT /api/chatbot/flows/:id
 * Update a flow
 */
router.put("/flows/:id", async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const flow = await chatbotFlowService.update(id, req.body);
        res.json({ success: true, data: flow });
    } catch (err) {
        logger.error({ err }, "Error updating chatbot flow");
        res.status(500).json({ success: false, error: { message: "Erro ao atualizar fluxo" } });
    }
});

/**
 * DELETE /api/chatbot/flows/:id
 * Delete a flow
 */
router.delete("/flows/:id", async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await chatbotFlowService.delete(id);
        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, "Error deleting chatbot flow");
        res.status(500).json({ success: false, error: { message: "Erro ao excluir fluxo" } });
    }
});

/**
 * PATCH /api/chatbot/flows/:id/toggle
 * Toggle flow active/paused
 */
router.patch("/flows/:id/toggle", async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const flow = await chatbotFlowService.toggleActive(id);
        res.json({ success: true, data: flow });
    } catch (err) {
        logger.error({ err }, "Error toggling chatbot flow");
        res.status(500).json({ success: false, error: { message: "Erro ao alternar status do fluxo" } });
    }
});

// ═══════════════════════════════════════
// KNOWLEDGE BASE
// ═══════════════════════════════════════

/**
 * GET /api/chatbot/knowledge
 * List knowledge base documents
 */
router.get("/knowledge", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string | undefined;

        const result = await chatbotKnowledgeService.list(userId, page, limit, search);
        res.json({ success: true, ...result });
    } catch (err) {
        logger.error({ err }, "Error listing knowledge base");
        res.status(500).json({ success: false, error: { message: "Erro ao listar base de conhecimento" } });
    }
});

/**
 * POST /api/chatbot/knowledge
 * Add content to knowledge base
 */
router.post("/knowledge", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const doc = await chatbotKnowledgeService.create(userId, req.body);
        res.status(201).json({ success: true, data: doc });
    } catch (err) {
        logger.error({ err }, "Error adding to knowledge base");
        res.status(500).json({ success: false, error: { message: "Erro ao adicionar conteúdo" } });
    }
});

/**
 * DELETE /api/chatbot/knowledge/:id
 * Remove content from knowledge base
 */
router.delete("/knowledge/:id", async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await chatbotKnowledgeService.delete(id);
        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, "Error deleting from knowledge base");
        res.status(500).json({ success: false, error: { message: "Erro ao excluir conteúdo" } });
    }
});

// ═══════════════════════════════════════
// TEMPLATES
// ═══════════════════════════════════════

/**
 * GET /api/chatbot/templates
 * List WhatsApp templates
 */
router.get("/templates", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string | undefined;

        const result = await whatsappTemplateService.list(userId, page, limit, search);
        res.json({ success: true, ...result });
    } catch (err) {
        logger.error({ err }, "Error listing templates");
        res.status(500).json({ success: false, error: { message: "Erro ao listar templates" } });
    }
});

/**
 * POST /api/chatbot/templates
 * Create and submit a template to Meta
 */
router.post("/templates", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const template = await whatsappTemplateService.create(userId, req.body);
        res.status(201).json({ success: true, data: template });
    } catch (err: any) {
        logger.error({ err }, "Error creating template");
        const msg = err?.code === "P2002"
            ? "Já existe um template com este nome"
            : "Erro ao criar template";
        res.status(400).json({ success: false, error: { message: msg } });
    }
});

/**
 * DELETE /api/chatbot/templates/:id
 * Delete a template
 */
router.delete("/templates/:id", async (req: Request, res: Response) => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        await whatsappTemplateService.delete(id);
        res.json({ success: true });
    } catch (err) {
        logger.error({ err }, "Error deleting template");
        res.status(500).json({ success: false, error: { message: "Erro ao excluir template" } });
    }
});

/**
 * POST /api/chatbot/templates/sync
 * Sync templates from Meta Graph API
 */
router.post("/templates/sync", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const result = await whatsappTemplateService.syncFromMeta(userId);
        res.json({ success: true, data: result });
    } catch (err: any) {
        logger.error({ err }, "Error syncing templates");
        res.status(500).json({ success: false, error: { message: err.message || "Erro ao sincronizar" } });
    }
});

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════

/**
 * GET /api/chatbot/dashboard
 * Get dashboard statistics
 */
router.get("/dashboard", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const stats = await chatbotSessionService.getDashboardStats(userId);
        res.json({ success: true, data: stats });
    } catch (err) {
        logger.error({ err }, "Error getting chatbot dashboard");
        res.status(500).json({ success: false, error: { message: "Erro ao carregar dashboard" } });
    }
});

// ═══ Routes Export ═══

export const chatbotRoutes: import("express").Router = router;
