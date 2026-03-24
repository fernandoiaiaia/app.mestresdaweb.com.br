import { prisma } from "../../config/database.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import { emailService } from "./email.service.js";
import { whatsappService } from "./whatsapp.service.js";
import { voiceService } from "./voice.service.js";

// ═══════════════════════════════════════
// Cadence Engine — Main Motor (Cron Job)
// ═══════════════════════════════════════

function isBusinessHours(timezone: string): boolean {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone || env.SDR_TIMEZONE,
        hour: "numeric",
        minute: "numeric",
        hour12: false,
        weekday: "short",
    });

    const parts = formatter.formatToParts(now);
    const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0");
    const weekday = parts.find(p => p.type === "weekday")?.value || "";

    // Skip weekends
    if (["Sat", "Sun"].includes(weekday)) return false;

    const startHour = parseInt(env.SDR_BUSINESS_HOURS_START.split(":")[0]);
    const endHour = parseInt(env.SDR_BUSINESS_HOURS_END.split(":")[0]);

    return hour >= startHour && hour < endHour;
}

function getNextBusinessDay(date: Date, timezone: string): Date {
    const next = new Date(date);
    const startHour = parseInt(env.SDR_BUSINESS_HOURS_START.split(":")[0]);

    // Set to start of business hours
    next.setHours(startHour, 0, 0, 0);

    // Move to next day if needed
    while (true) {
        next.setDate(next.getDate() + 1);
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            weekday: "short",
        });
        const weekday = formatter.format(next);
        if (!["Sat", "Sun"].includes(weekday)) break;
    }

    return next;
}

export const cadenceEngine = {
    /**
     * Process all due enrollments — runs every 5 minutes via cron
     */
    async processQueue(): Promise<void> {
        const now = new Date();

        // Find all active enrollments with nextActionAt <= now
        const dueEnrollments = await prisma.leadCadenceEnrollment.findMany({
            where: {
                status: "ativo",
                nextActionAt: { lte: now },
            },
            include: {
                lead: true,
                cadence: {
                    include: {
                        steps: { orderBy: { orderIndex: "asc" } },
                    },
                },
            },
            take: 50, // Process max 50 per cycle
        });

        if (dueEnrollments.length === 0) return;

        logger.info({ count: dueEnrollments.length }, "Processing SDR queue");

        for (const enrollment of dueEnrollments) {
            try {
                await this.processEnrollment(enrollment);
            } catch (err) {
                logger.error({ enrollmentId: enrollment.id, err }, "Failed to process enrollment");
            }
        }
    },

    async processEnrollment(enrollment: any): Promise<void> {
        const { lead, cadence } = enrollment;
        const steps = cadence.steps;
        const currentStepIndex = enrollment.currentStep - 1;

        // Skip if lead opted out
        if (lead.status === "opt_out") {
            await prisma.leadCadenceEnrollment.update({
                where: { id: enrollment.id },
                data: { status: "opt_out", completedAt: new Date() },
            });
            return;
        }

        // No more steps — mark as completed
        if (currentStepIndex >= steps.length) {
            await prisma.leadCadenceEnrollment.update({
                where: { id: enrollment.id },
                data: { status: "concluido", completedAt: new Date() },
            });
            await prisma.sdrLead.update({
                where: { id: lead.id },
                data: { status: "sem_contato" },
            });
            return;
        }

        const step = steps[currentStepIndex];
        const channel = step.channel || step.type;

        // Check business hours (except for 'wait' type)
        if (channel !== "wait" && !isBusinessHours(cadence.timezone)) {
            const nextBizDay = getNextBusinessDay(new Date(), cadence.timezone);
            await prisma.leadCadenceEnrollment.update({
                where: { id: enrollment.id },
                data: { nextActionAt: nextBizDay },
            });
            return;
        }

        // Execute based on channel
        switch (channel) {
            case "wait":
                // Just advance to next step
                break;

            case "email":
                if (lead.email) {
                    await emailService.sendPersonalized(lead, step, cadence.tone);
                }
                break;

            case "whatsapp":
                if (lead.phone) {
                    await whatsappService.sendTemplate(lead, step);
                }
                break;

            case "phone":
                if (lead.phone) {
                    // Check daily call limit
                    const todayStart = new Date();
                    todayStart.setHours(0, 0, 0, 0);
                    const callsToday = await prisma.cadenceAction.count({
                        where: { channel: "phone", actionType: "sent", createdAt: { gte: todayStart } },
                    });
                    if (callsToday < env.SDR_MAX_CALLS_PER_DAY) {
                        await voiceService.initiateCall(lead, step);
                    } else {
                        logger.warn("Daily call limit reached");
                        // Reschedule for tomorrow
                        const nextBizDay = getNextBusinessDay(new Date(), cadence.timezone);
                        await prisma.leadCadenceEnrollment.update({
                            where: { id: enrollment.id },
                            data: { nextActionAt: nextBizDay },
                        });
                        return;
                    }
                }
                break;
        }

        // Calculate next action time
        const nextStepIndex = currentStepIndex + 1;
        let nextActionAt: Date | null = null;

        if (nextStepIndex < steps.length) {
            const nextStep = steps[nextStepIndex];
            const delayMs = ((nextStep.delayDays || nextStep.delay || 0) * 86400000) + ((nextStep.delayHours || 0) * 3600000);
            nextActionAt = new Date(Date.now() + delayMs);

            // Push to next business day if outside hours
            if (!isBusinessHours(cadence.timezone)) {
                nextActionAt = getNextBusinessDay(nextActionAt, cadence.timezone);
            }
        }

        // Update enrollment
        await prisma.leadCadenceEnrollment.update({
            where: { id: enrollment.id },
            data: {
                currentStep: enrollment.currentStep + 1,
                nextActionAt,
                ...(nextStepIndex >= steps.length ? { status: "concluido", completedAt: new Date() } : {}),
            },
        });

        // If last step, mark lead
        if (nextStepIndex >= steps.length) {
            await prisma.sdrLead.update({
                where: { id: lead.id },
                data: { status: "sem_contato" },
            });
        }

        logger.info({
            enrollmentId: enrollment.id,
            leadId: lead.id,
            stepIndex: currentStepIndex,
            channel,
        }, "Step executed");
    },
};
