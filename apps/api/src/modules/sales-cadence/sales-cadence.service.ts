import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { WhatsappService } from "../whatsapp/whatsapp.service.js";

// ═══════════════════════════════════════
// Sales Cadence Service — CRM
// ═══════════════════════════════════════

export const salesCadenceService = {

    /* ─── CRUD Cadências ─── */

    async list(userId: string) {
        return prisma.salesCadence.findMany({
            where: { userId },
            include: {
                stage: true,
                funnel: true,
                steps: { orderBy: { orderIndex: "asc" } },
                _count: { select: { executions: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async getById(id: string, userId: string) {
        return prisma.salesCadence.findFirst({
            where: { id, userId },
            include: {
                stage: true,
                funnel: { include: { stages: { orderBy: { orderIndex: "asc" } } } },
                steps: { orderBy: { orderIndex: "asc" } },
                executions: {
                    take: 20,
                    orderBy: { createdAt: "desc" },
                    include: { deal: { select: { id: true, title: true, client: { select: { name: true } } } } },
                },
            },
        });
    },

    async getByStageId(stageId: string, userId: string) {
        return prisma.salesCadence.findFirst({
            where: { stageId, userId },
            include: {
                steps: { orderBy: { orderIndex: "asc" } },
                stage: true,
            },
        });
    },

    async getByFunnelId(funnelId: string, userId: string) {
        return prisma.salesCadence.findMany({
            where: { funnelId, userId },
            include: {
                stage: true,
                steps: { orderBy: { orderIndex: "asc" } },
                _count: { select: { executions: true } },
            },
            orderBy: { createdAt: "desc" },
        });
    },

    async create(data: {
        userId: string;
        funnelId: string;
        stageId: string;
        name: string;
        description?: string;
    }) {
        return prisma.salesCadence.create({
            data,
            include: { stage: true, funnel: true, steps: true },
        });
    },

    async update(id: string, userId: string, data: {
        name?: string;
        description?: string;
        isActive?: boolean;
    }) {
        return prisma.salesCadence.update({
            where: { id },
            data,
            include: { stage: true, funnel: true, steps: { orderBy: { orderIndex: "asc" } } },
        });
    },

    async remove(id: string, userId: string) {
        return prisma.salesCadence.delete({ where: { id } });
    },

    /* ─── CRUD Steps ─── */

    async addStep(salesCadenceId: string, data: {
        type: string;
        title: string;
        delayDays?: number;
        delayHours?: number;
        templateContent?: string;
        subject?: string;
    }) {
        const maxOrder = await prisma.salesCadenceStep.aggregate({
            where: { salesCadenceId },
            _max: { orderIndex: true },
        });
        const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

        return prisma.salesCadenceStep.create({
            data: { ...data, salesCadenceId, orderIndex },
        });
    },

    async updateStep(stepId: string, data: {
        type?: string;
        title?: string;
        delayDays?: number;
        delayHours?: number;
        templateContent?: string;
        subject?: string;
    }) {
        return prisma.salesCadenceStep.update({
            where: { id: stepId },
            data,
        });
    },

    async removeStep(stepId: string) {
        return prisma.salesCadenceStep.delete({ where: { id: stepId } });
    },

    async reorderSteps(steps: { id: string; orderIndex: number }[]) {
        const tx = steps.map(s =>
            prisma.salesCadenceStep.update({
                where: { id: s.id },
                data: { orderIndex: s.orderIndex },
            })
        );
        return prisma.$transaction(tx);
    },

    /* ─── Trigger & Process ─── */

    /**
     * Called when a Deal changes stage.
     * Cancels any running execution and starts the new cadence for the target stage.
     */
    async triggerCadenceForDeal(dealId: string, stageId: string, userId: string) {
        // 1. Cancel running executions for this deal
        await prisma.salesCadenceExecution.updateMany({
            where: { dealId, status: "running" },
            data: { status: "cancelled", completedAt: new Date() },
        });

        // 2. Find cadence for the target stage
        const cadence = await prisma.salesCadence.findUnique({
            where: { stageId },
            include: { steps: { orderBy: { orderIndex: "asc" } } },
        });

        if (!cadence || !cadence.isActive || cadence.steps.length === 0) {
            return null; // No cadence for this stage
        }

        // 3. Calculate first action time
        const firstStep = cadence.steps[0];
        const delayMs = (firstStep.delayDays * 86400000) + (firstStep.delayHours * 3600000);
        const nextActionAt = new Date(Date.now() + delayMs);

        // 4. Create execution
        const execution = await prisma.salesCadenceExecution.create({
            data: {
                salesCadenceId: cadence.id,
                dealId,
                currentStepIdx: 0,
                status: "running",
                nextActionAt,
            },
        });

        // 5. If delay is 0, process immediately
        if (delayMs === 0) {
            await this.processStep(execution.id);
        }

        logger.info({ dealId, cadenceId: cadence.id, stageId }, "Sales cadence triggered for deal");
        return execution;
    },

    /**
     * Cron job: process all pending executions whose nextActionAt <= now
     */
    async processPendingExecutions() {
        const pending = await prisma.salesCadenceExecution.findMany({
            where: {
                status: "running",
                nextActionAt: { lte: new Date() },
            },
            include: {
                salesCadence: {
                    include: { steps: { orderBy: { orderIndex: "asc" } } },
                },
                deal: {
                    include: {
                        client: true,
                        consultant: true,
                    },
                },
            },
        });

        for (const exec of pending) {
            try {
                await this.processStep(exec.id);
            } catch (err) {
                logger.error({ err, executionId: exec.id }, "Error processing sales cadence step");
            }
        }

        if (pending.length > 0) {
            logger.info({ count: pending.length }, "Processed sales cadence executions");
        }
    },

    /**
     * Process the current step of an execution
     */
    async processStep(executionId: string) {
        const execution = await prisma.salesCadenceExecution.findUnique({
            where: { id: executionId },
            include: {
                salesCadence: {
                    include: { steps: { orderBy: { orderIndex: "asc" } } },
                },
                deal: {
                    include: {
                        client: true,
                        consultant: true,
                        user: true,
                    },
                },
            },
        });

        if (!execution || execution.status !== "running") return;

        const steps = execution.salesCadence.steps;
        const currentStep = steps[execution.currentStepIdx];
        if (!currentStep) {
            // All steps done
            await prisma.salesCadenceExecution.update({
                where: { id: executionId },
                data: { status: "completed", completedAt: new Date() },
            });
            return;
        }

        const deal = execution.deal;
        const client = deal.client;

        // Execute the step based on type
        switch (currentStep.type) {
            case "whatsapp_auto":
                logger.info(
                    { dealId: deal.id, phone: client?.phone, step: currentStep.title },
                    "📱 [Sales Cadence] WhatsApp auto — Sending message"
                );
                if (client?.phone && currentStep.templateContent) {
                    try {
                        const credentials = await WhatsappService.getCredentials(deal.userId);
                        if (credentials) {
                            await WhatsappService.sendTextMessage(credentials, client.phone, currentStep.templateContent);
                        } else {
                            logger.warn({ dealId: deal.id }, "No active WhatsApp credentials found for Sales Cadence");
                        }
                    } catch(err) {
                        logger.error({ err }, "Could not dispatch automated Whatsapp message");
                    }
                }
                break;

            case "email_auto":
                logger.info(
                    { dealId: deal.id, email: client?.email, step: currentStep.title },
                    "📧 [Sales Cadence] Email auto — would send email"
                );
                // In production: call emailService.sendEmail(...)
                break;

            case "task_call":
            case "task_generic": {
                // Create a real Task in the CRM
                const taskDate = new Date();
                taskDate.setHours(taskDate.getHours() + 1); // Due in 1 hour

                await prisma.task.create({
                    data: {
                        userId: deal.userId,
                        clientId: deal.clientId,
                        dealId: deal.id,
                        title: currentStep.title,
                        description: currentStep.templateContent || undefined,
                        touchPoint: currentStep.type === "task_call" ? "Ligação" : "Tarefa",
                        date: taskDate,
                        status: "pending",
                    },
                });
                logger.info(
                    { dealId: deal.id, step: currentStep.title, type: currentStep.type },
                    "📋 [Sales Cadence] Task created"
                );
                break;
            }
        }

        // Advance to next step or complete
        const nextIdx = execution.currentStepIdx + 1;
        if (nextIdx >= steps.length) {
            await prisma.salesCadenceExecution.update({
                where: { id: executionId },
                data: {
                    status: "completed",
                    completedAt: new Date(),
                    currentStepIdx: nextIdx,
                },
            });
        } else {
            const nextStep = steps[nextIdx];
            const delayMs = (nextStep.delayDays * 86400000) + (nextStep.delayHours * 3600000);
            await prisma.salesCadenceExecution.update({
                where: { id: executionId },
                data: {
                    currentStepIdx: nextIdx,
                    nextActionAt: new Date(Date.now() + delayMs),
                },
            });
        }
    },

    /* ─── Execution Log ─── */

    async getExecutionsForDeal(dealId: string) {
        return prisma.salesCadenceExecution.findMany({
            where: { dealId },
            include: {
                salesCadence: { select: { name: true, stage: { select: { name: true } } } },
            },
            orderBy: { createdAt: "desc" },
        });
    },
};
