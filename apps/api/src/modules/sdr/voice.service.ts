import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { aiService } from "./ai.service.js";

// ═══════════════════════════════════════
// Voice Service — Synthflow AI
// https://docs.synthflow.ai/api-reference
// ═══════════════════════════════════════

const SYNTHFLOW_API_BASE = "https://api.synthflow.ai/v2";

export const voiceService = {
    /**
     * Initiate a phone call via Synthflow AI
     */
    async initiateCall(lead: any, step: any): Promise<void> {
        const apiKey = env.SYNTHFLOW_API_KEY;
        const modelId = env.SYNTHFLOW_MODEL_ID;
        if (!apiKey || !modelId) {
            logger.warn("Synthflow AI não configurada — ligação não realizada");
            return;
        }

        // Generate voice script via AI
        const criteria = await prisma.qualificationCriteria.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
        });
        const script = await aiService.generateVoiceScript(lead, criteria);

        // Create phone call via Synthflow API
        const response = await fetch(`${SYNTHFLOW_API_BASE}/calls`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model_id: modelId,
                phone: lead.phone,
                name: lead.name,
                custom_variables: [
                    { name: "lead_name", value: lead.name },
                    { name: "lead_company", value: lead.company || "" },
                    { name: "lead_segment", value: lead.segment || "" },
                    { name: "lead_id", value: lead.id },
                    { name: "qualification_questions", value: script },
                ],
                prompt: step.templateContent || undefined,
                greeting: `Olá ${lead.name}, tudo bem?`,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            logger.error({ status: response.status, err }, "Synthflow API error");
            throw new Error(`Synthflow API error: ${response.status}`);
        }

        const result = await response.json() as any;

        // Log action
        const enrollment = await prisma.leadCadenceEnrollment.findFirst({
            where: { leadId: lead.id, status: "ativo" },
        });

        await prisma.cadenceAction.create({
            data: {
                enrollmentId: enrollment?.id,
                leadId: lead.id,
                channel: "phone",
                actionType: "sent",
                content: `Ligação iniciada para ${lead.phone}`,
                metadata: { synthflowCallId: result.call_id || result.id },
            },
        });

        logger.info({ leadId: lead.id, callId: result.call_id || result.id }, "Ligação Synthflow AI iniciada");
    },

    /**
     * Handle call completion webhook from Synthflow AI
     */
    async handleCallWebhook(payload: any): Promise<void> {
        const callId = payload.call_id || payload.id;
        const status = payload.status;
        const transcript = payload.transcript;
        const recordingUrl = payload.recording_url;
        const callDuration = payload.call_duration || payload.duration;

        // Extract lead_id from custom_variables or metadata
        let leadId = payload.metadata?.lead_id;
        if (!leadId && payload.custom_variables) {
            const leadVar = payload.custom_variables.find?.((v: any) => v.name === "lead_id");
            leadId = leadVar?.value;
        }

        if (!leadId) {
            logger.warn({ callId }, "Synthflow webhook without lead_id");
            return;
        }

        const lead = await prisma.sdrLead.findUnique({ where: { id: leadId } });
        if (!lead) return;

        const actionType = (status === "ended" || status === "completed") && transcript
            ? "answered"
            : status === "no_answer" || status === "unanswered"
                ? "missed"
                : "voicemail";

        const enrollment = await prisma.leadCadenceEnrollment.findFirst({
            where: { leadId, status: { in: ["ativo", "respondeu"] } },
        });

        await prisma.cadenceAction.create({
            data: {
                enrollmentId: enrollment?.id,
                leadId,
                channel: "phone",
                actionType,
                content: transcript || `Ligação ${actionType}`,
                metadata: {
                    synthflowCallId: callId,
                    callDuration,
                    recordingUrl,
                    transcription: transcript,
                },
            },
        });

        // If answered, interpret transcript via AI
        if (actionType === "answered" && transcript) {
            const interpretation = await aiService.interpretResponse(lead, transcript, "phone");

            if (Object.keys(interpretation.qualificationData).length > 0) {
                const existingData = (lead.qualificationData as Record<string, any>) || {};
                await prisma.sdrLead.update({
                    where: { id: leadId },
                    data: {
                        qualificationData: { ...existingData, ...interpretation.qualificationData },
                        status: interpretation.interest === "opt_out" ? "opt_out" : "respondeu",
                    },
                });
            }

            await prisma.cadenceAction.create({
                data: {
                    leadId,
                    enrollmentId: enrollment?.id,
                    channel: "phone",
                    actionType: "qualified",
                    aiReasoning: interpretation.reasoning,
                    metadata: interpretation as any,
                },
            });

            if (enrollment) {
                await prisma.leadCadenceEnrollment.update({
                    where: { id: enrollment.id },
                    data: { status: "respondeu" },
                });
            }
        }

        logger.info({ leadId, actionType, callId }, "Synthflow call processed");
    },

    /**
     * Cleanup expired recordings (cron: daily at midnight)
     */
    async cleanupExpiredRecordings(retentionDays: number): Promise<void> {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - retentionDays);

        const expired = await prisma.cadenceAction.findMany({
            where: {
                channel: "phone",
                actionType: "answered",
                createdAt: { lt: cutoff },
            },
            select: { id: true, metadata: true },
        });

        for (const action of expired) {
            await prisma.cadenceAction.update({
                where: { id: action.id },
                data: { metadata: { ...(action.metadata as any), recordingUrl: null, transcription: "[expirado]" } },
            });
        }

        logger.info({ count: expired.length }, "Expired recordings cleaned up");
    },
};
