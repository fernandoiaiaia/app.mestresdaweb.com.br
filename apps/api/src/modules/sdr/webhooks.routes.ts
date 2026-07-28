import { Router, Request, Response } from "express";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../config/database.js";
import { emailService } from "./email.service.js";
import { whatsappService } from "./whatsapp.service.js";
import { voiceService } from "./voice.service.js";
import { processWhatsappWebhookForInbox } from "../whatsapp/whatsapp.webhook.controller.js";

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
router.get("/whatsapp", async (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const settings = await prisma.integrationSetting.findMany({
        where: { provider: "whatsapp" }
    });

    // Check if any user configuration has this verifyToken
    const isValidDB = settings.some(s => {
        const creds = s.credentials as Record<string, any>;
        return creds?.verifyToken === token;
    });

    if (mode === "subscribe" && (isValidDB || token === env.WHATSAPP_VERIFY_TOKEN)) {
        logger.info("WhatsApp webhook verified via DB config or ENV fallback");
        return res.status(200).send(challenge);
    }

    logger.warn({ received: token }, "WhatsApp Webhook verification failed");
    res.status(403).json({ error: "Verification failed" });
});

/**
 * POST /api/webhooks/whatsapp
 * Incoming messages from leads — processes for BOTH:
 * 1. SDR cadence engine (lead qualification, auto-reply)
 * 2. Inbox CRM (contact, conversation, message persistence for WhatsApp Web UI)
 */
router.post("/whatsapp", async (req: Request, res: Response) => {
    try {
        // Run both processors in parallel — SDR and Inbox are independent
        await Promise.all([
            whatsappService.handleWebhook(req.body),
            processWhatsappWebhookForInbox(req.body),
        ]);
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
