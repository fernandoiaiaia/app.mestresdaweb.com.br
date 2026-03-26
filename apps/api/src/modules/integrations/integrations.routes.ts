import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

// ═══════════════════════════════════════
// Integration Settings Routes
// ═══════════════════════════════════════

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/integrations
 * List all integration settings for current user
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const settings = await prisma.integrationSetting.findMany({
            where: { userId },
            orderBy: { provider: "asc" },
        });
        res.json({ success: true, data: settings });
    } catch (err) {
        logger.error({ err }, "Error listing integration settings");
        res.status(500).json({ success: false, error: { message: "Erro ao listar integrações" } });
    }
});

/**
 * GET /api/integrations/:provider
 * Get a specific integration setting
 */
router.get("/:provider", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;
        const setting = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider } },
        });
        res.json({ success: true, data: setting });
    } catch (err) {
        logger.error({ err }, "Error getting integration setting");
        res.status(500).json({ success: false, error: { message: "Erro ao buscar integração" } });
    }
});

/**
 * PUT /api/integrations/:provider
 * Create or update integration settings (upsert)
 */
router.put("/:provider", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;
        const { credentials, metadata, isActive } = req.body;

        const validProviders = ["anthropic", "brevo", "whatsapp", "synthflow", "google_calendar", "proposal_openai", "proposal_brevo", "proposal_whisper", "proposal_minimax"];

        if (!validProviders.includes(provider)) {
            return res.status(400).json({ success: false, error: { message: `Provider inválido. Use: ${validProviders.join(", ")}` } });
        }

        // ── Fetch existing setting so we can MERGE credentials, not replace them ──
        // This prevents the UI from wiping saved API keys when the user saves
        // other fields (model, group_id, etc.) without re-entering masked secrets.
        const existing = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider } },
        });

        // Deep-merge: start from what's in DB, apply only non-empty incoming values
        const existingCreds: Record<string, any> = (existing?.credentials as Record<string, any>) || {};
        const mergedCreds: Record<string, any> = { ...existingCreds };

        if (credentials && typeof credentials === "object") {
            for (const [key, value] of Object.entries(credentials)) {
                // Only overwrite if the incoming value is a non-empty, non-masked string
                const isPlaceholder = typeof value === "string" && /^[•*]+$/.test(value);
                if (value !== undefined && value !== null && value !== "" && !isPlaceholder) {
                    mergedCreds[key] = value;
                }
            }
        }

        const setting = await prisma.integrationSetting.upsert({
            where: { userId_provider: { userId, provider } },
            create: {
                userId,
                provider,
                credentials: mergedCreds,
                metadata: metadata || {},
                isActive: isActive ?? false,
            },
            update: {
                credentials: mergedCreds,
                ...(metadata !== undefined && { metadata }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        logger.info({ userId, provider, isActive: setting.isActive }, "Integration setting updated");
        res.json({ success: true, data: setting });
    } catch (err) {
        logger.error({ err }, "Error updating integration setting");
        res.status(500).json({ success: false, error: { message: "Erro ao salvar integração" } });
    }
});

/**
 * PATCH /api/integrations/:provider/toggle
 * Toggle integration active/inactive
 */
router.patch("/:provider/toggle", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;

        const existing = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider } },
        });

        if (!existing) {
            return res.status(404).json({ success: false, error: { message: "Integração não encontrada" } });
        }

        const setting = await prisma.integrationSetting.update({
            where: { userId_provider: { userId, provider } },
            data: {
                isActive: !existing.isActive,
                lastSyncAt: !existing.isActive ? new Date() : existing.lastSyncAt,
            },
        });

        res.json({ success: true, data: setting });
    } catch (err) {
        logger.error({ err }, "Error toggling integration");
        res.status(500).json({ success: false, error: { message: "Erro ao alternar integração" } });
    }
});

/**
 * DELETE /api/integrations/:provider
 * Remove integration settings
 */
router.delete("/:provider", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;

        await prisma.integrationSetting.deleteMany({
            where: { userId, provider },
        });

        res.json({ success: true, message: "Integração removida" });
    } catch (err) {
        logger.error({ err }, "Error deleting integration");
        res.status(500).json({ success: false, error: { message: "Erro ao remover integração" } });
    }
});

/**
 * POST /api/integrations/:provider/test
 * Test if integration credentials are valid
 */
router.post("/:provider/test", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const provider = Array.isArray(req.params.provider) ? req.params.provider[0] : req.params.provider;

        const setting = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider } },
        });

        if (!setting) {
            return res.status(404).json({ success: false, error: { message: "Configure os dados primeiro" } });
        }

        const creds = setting.credentials as Record<string, any>;
        let valid = false;
        let message = "";

        switch (provider) {
            case "anthropic":
                if (creds.apiKey) {
                    try {
                        const r = await fetch("https://api.anthropic.com/v1/messages", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-api-key": creds.apiKey,
                                "anthropic-version": "2023-06-01",
                            },
                            body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 10, messages: [{ role: "user", content: "Hi" }] }),
                        });
                        valid = r.ok;
                        message = valid ? "API Key válida" : `Erro: ${r.status}`;
                    } catch { message = "Falha na conexão"; }
                } else { message = "API Key não informada"; }
                break;

            case "brevo":
                if (creds.apiKey) {
                    try {
                        const r = await fetch("https://api.brevo.com/v3/account", {
                            headers: { "api-key": creds.apiKey, "Accept": "application/json" },
                        });
                        valid = r.ok;
                        message = valid ? "API Key válida — Brevo conectada" : `Erro: ${r.status}`;
                    } catch { message = "Falha na conexão"; }
                } else { message = "API Key não informada"; }
                break;

            case "whatsapp":
                if (creds.accessToken && creds.phoneNumberId) {
                    try {
                        const r = await fetch(`https://graph.facebook.com/v18.0/${creds.phoneNumberId}`, {
                            headers: { Authorization: `Bearer ${creds.accessToken}` },
                        });
                        valid = r.ok;
                        message = valid ? "Token válido" : `Erro: ${r.status}`;
                    } catch { message = "Falha na conexão"; }
                } else { message = "Token ou Phone ID não informados"; }
                break;

            case "synthflow":
                if (creds.apiKey) {
                    try {
                        const r = await fetch("https://api.synthflow.ai/v2/agents", {
                            headers: { Authorization: `Bearer ${creds.apiKey}` },
                        });
                        valid = r.ok;
                        message = valid ? "API Key válida" : `Erro: ${r.status}`;
                    } catch { message = "Falha na conexão"; }
                } else { message = "API Key não informada"; }
                break;

            case "google_calendar":
                message = "Requer OAuth — configure Client ID e Secret para iniciar";
                valid = !!(creds.clientId && creds.clientSecret);
                break;

            // ═══ Proposal Module Integrations ═══
            case "proposal_openai":
                if (creds.apiKey) {
                    try {
                        const r = await fetch("https://api.openai.com/v1/models", {
                            headers: { Authorization: `Bearer ${creds.apiKey}` },
                        });
                        valid = r.ok;
                        message = valid ? "API Key válida — OpenAI conectada" : `Erro: ${r.status}`;
                    } catch { message = "Falha na conexão"; }
                } else { message = "API Key não informada"; }
                break;

            case "proposal_brevo":
                if (creds.apiKey) {
                    try {
                        const r = await fetch("https://api.brevo.com/v3/account", {
                            headers: { "api-key": creds.apiKey, "Accept": "application/json" },
                        });
                        valid = r.ok;
                        message = valid ? "API Key válida — Brevo conectada" : `Erro: ${r.status}`;
                    } catch { message = "Falha na conexão"; }
                } else { message = "API Key não informada"; }
                break;

            case "proposal_whisper":
                if (creds.apiKey) {
                    try {
                        const r = await fetch("https://api.openai.com/v1/models/whisper-1", {
                            headers: { Authorization: `Bearer ${creds.apiKey}` },
                        });
                        valid = r.ok;
                        message = valid ? "API Key válida — Whisper conectada" : `Erro: ${r.status}`;
                    } catch { message = "Falha na conexão"; }
                } else { message = "API Key não informada"; }
                break;

            case "proposal_minimax":
                if (creds.apiKey && creds.groupId) {
                    try {
                        const r = await fetch(`https://api.minimaxi.chat/v1/text/chatcompletion_v2?GroupId=${creds.groupId}`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${creds.apiKey}`,
                            },
                            body: JSON.stringify({
                                model: creds.model || "MiniMax-M2.5",
                                messages: [{ role: "user", name: "user", content: "Hi" }],
                                max_tokens: 10,
                            }),
                        });
                        if (r.ok) {
                            valid = true;
                            message = "API Key e Group ID válidos — MiniMax M2.5 conectada";
                        } else {
                            const body = await r.json().catch(() => ({})) as any;
                            message = `Erro ${r.status}: ${body?.error?.message || body?.base_resp?.status_msg || "Credenciais inválidas"}`;
                        }
                    } catch { message = "Falha na conexão com a MiniMax"; }
                } else if (!creds.apiKey) {
                    message = "API Key não informada";
                } else {
                    message = "Group ID não informado";
                }
                break;

            default:
                message = "Provider desconhecido";
        }

        if (valid) {
            await prisma.integrationSetting.update({
                where: { userId_provider: { userId, provider } },
                data: { lastSyncAt: new Date() },
            });
        }

        res.json({ success: true, data: { valid, message } });
    } catch (err) {
        logger.error({ err }, "Error testing integration");
        res.status(500).json({ success: false, error: { message: "Erro ao testar" } });
    }
});

export function integrationsRoutes(app: Router) {
    app.use("/api/integrations", router);
}
