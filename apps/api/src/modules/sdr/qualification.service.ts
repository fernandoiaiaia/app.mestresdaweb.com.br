import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { aiService } from "./ai.service.js";
import { schedulingService } from "./scheduling.service.js";

// ═══════════════════════════════════════
// Qualification Service — Score BANT
// ═══════════════════════════════════════

export const qualificationService = {
    /**
     * Recalculate a lead's score based on qualification data and criteria
     */
    async recalculate(leadId: string): Promise<{ score: number; temperature: string }> {
        const lead = await prisma.sdrLead.findUnique({ where: { id: leadId } });
        if (!lead) throw new Error("Lead não encontrado");

        const criteria = await prisma.qualificationCriteria.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
        });

        const thresholds = await prisma.qualificationThresholds.findFirst();
        const hotMin = thresholds?.hotMin || 80;
        const warmMin = thresholds?.warmMin || 50;

        const extractedData = (lead.qualificationData as Record<string, any>) || {};
        const { score, temperature, details } = await aiService.calculateScore(lead, criteria, extractedData);

        // Update lead
        await prisma.sdrLead.update({
            where: { id: leadId },
            data: { score, temperature },
        });

        // Log qualification
        const enrollment = await prisma.leadCadenceEnrollment.findFirst({
            where: { leadId, status: { in: ["ativo", "respondeu"] } },
        });

        await prisma.cadenceAction.create({
            data: {
                leadId,
                enrollmentId: enrollment?.id,
                channel: "email", // placeholder
                actionType: "qualified",
                aiReasoning: `Score: ${score}. Temperature: ${temperature}. Details: ${JSON.stringify(details)}`,
                metadata: { score, temperature, details },
            },
        });

        // Execute action based on temperature
        const action = temperature === "quente"
            ? thresholds?.hotAction || "agendar_reuniao"
            : temperature === "morno"
                ? thresholds?.warmAction || "continuar_cadencia"
                : thresholds?.coldAction || "pausar_cadencia";

        await this.executeAction(leadId, action);

        logger.info({ leadId, score, temperature, action }, "Lead qualification recalculated");
        return { score, temperature };
    },

    /**
     * Execute action based on qualification result
     */
    async executeAction(leadId: string, action: string): Promise<void> {
        switch (action) {
            case "agendar_reuniao": {
                const lead = await prisma.sdrLead.findUnique({ where: { id: leadId } });
                if (lead?.consultantId) {
                    const slots = await schedulingService.getAvailability(lead.consultantId);
                    if (slots.length > 0) {
                        // Auto-schedule first available slot
                        await schedulingService.autoSchedule(leadId, lead.consultantId, slots[0].start);
                    }
                }
                break;
            }

            case "escalar_humano": {
                await prisma.cadenceAction.create({
                    data: {
                        leadId,
                        channel: "email",
                        actionType: "escalated",
                        content: "Lead escalado para intervenção humana (ação automática por score)",
                    },
                });
                break;
            }

            case "continuar_cadencia":
                // Keep in current cadence — no action needed
                break;

            case "pausar_cadencia": {
                await prisma.leadCadenceEnrollment.updateMany({
                    where: { leadId, status: "ativo" },
                    data: { status: "pausado", pausedAt: new Date() },
                });
                break;
            }
        }
    },
};
