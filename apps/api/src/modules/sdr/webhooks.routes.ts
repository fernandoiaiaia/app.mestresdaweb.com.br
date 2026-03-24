import { Router, Request, Response } from "express";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { emailService } from "./email.service.js";
import { whatsappService } from "./whatsapp.service.js";
import { voiceService } from "./voice.service.js";

const router = Router();

// ═══════════════════════════════════════
// BREVO WEBHOOKS
// ═══════════════════════════════════════

/**
 * POST /api/webhooks/brevo/events
 * Tracking events: delivered, opened, click, hard_bounce, soft_bounce, unsubscribed
 */
router.post("/brevo/events", async (req: Request, res: Response) => {
    try {
        const events = Array.isArray(req.body) ? req.body : [req.body];
        await emailService.handleWebhook(events);
        res.status(200).json({ ok: true });
    } catch (err) {
        logger.error({ err }, "Brevo webhook error");
        res.status(500).json({ error: "Internal error" });
    }
});

/**
 * POST /api/webhooks/brevo/inbound
 * Inbound Parse: replies from leads
 */
router.post("/brevo/inbound", async (req: Request, res: Response) => {
    try {
        const items = req.body?.items || [req.body];
        for (const item of items) {
            const parsed = {
                from: item.From?.Address || item.from || "",
                to: item.To?.[0]?.Address || item.to || "",
                subject: item.Subject || item.subject || "",
                text: item.RawTextBody || item.text || "",
                html: item.RawHtmlBody || item.html || "",
            };
            await emailService.handleInboundEmail(parsed);
        }
        res.status(200).json({ ok: true });
    } catch (err) {
        logger.error({ err }, "Brevo inbound webhook error");
        res.status(500).json({ error: "Internal error" });
    }
});

// ═══════════════════════════════════════
// WHATSAPP (META) WEBHOOKS
// ═══════════════════════════════════════

/**
 * GET /api/webhooks/whatsapp
 * Meta webhook verification (hub.challenge)
 */
router.get("/whatsapp", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
        logger.info("WhatsApp webhook verified");
        return res.status(200).send(challenge);
    }

    res.status(403).json({ error: "Verification failed" });
});

/**
 * POST /api/webhooks/whatsapp
 * Incoming messages from leads
 */
router.post("/whatsapp", async (req: Request, res: Response) => {
    try {
        await whatsappService.handleWebhook(req.body);
        res.status(200).json({ ok: true });
    } catch (err) {
        logger.error({ err }, "WhatsApp webhook error");
        res.status(500).json({ error: "Internal error" });
    }
});

// ═══════════════════════════════════════
// SYNTHFLOW AI WEBHOOKS
// ═══════════════════════════════════════

/**
 * POST /api/webhooks/synthflow
 * Call results: call_ended, call_completed
 */
router.post("/synthflow", async (req: Request, res: Response) => {
    try {
        await voiceService.handleCallWebhook(req.body);
        res.status(200).json({ ok: true });
    } catch (err) {
        logger.error({ err }, "Synthflow webhook error");
        res.status(500).json({ error: "Internal error" });
    }
});

export const webhooksRoutes: Router = router;
