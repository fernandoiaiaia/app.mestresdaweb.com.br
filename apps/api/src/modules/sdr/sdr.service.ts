import { prisma } from "../../config/database.js";
import { Prisma } from "@prisma/client";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════
interface JwtUser {
    userId: string;
    role: string;
}

// ═══════════════════════════════════════
// SDR Service
// ═══════════════════════════════════════
export const sdrService = {

    // ═══════════════════════════════════
    // CADENCES CRUD
    // ═══════════════════════════════════
    async listCadences(user: JwtUser) {
        return prisma.cadence.findMany({
            where: { userId: user.userId },
            include: { steps: { orderBy: { orderIndex: "asc" } }, _count: { select: { enrollments: true } } },
            orderBy: { createdAt: "desc" },
        });
    },

    async getCadence(id: string, user: JwtUser) {
        return prisma.cadence.findUnique({
            where: { id, userId: user.userId },
            include: { steps: { orderBy: { orderIndex: "asc" } }, enrollments: { include: { lead: true } } },
        });
    },

    async createCadence(data: any, user: JwtUser) {
        return prisma.cadence.create({
            data: { ...data, userId: user.userId, status: "draft" },
            include: { steps: true },
        });
    },

    async updateCadence(id: string, data: any, user: JwtUser) {
        return prisma.cadence.update({ where: { id, userId: user.userId }, data });
    },

    async updateCadenceStatus(id: string, status: string, user: JwtUser) {
        return prisma.cadence.update({ where: { id, userId: user.userId }, data: { status } });
    },

    async deleteCadence(id: string, user: JwtUser) {
        const cadence = await prisma.cadence.findUnique({ where: { id, userId: user.userId } });
        if (!cadence) throw new Error("Cadência não encontrada");
        if (cadence.status === "active") throw new Error("Não é possível deletar cadência ativa");
        return prisma.cadence.delete({ where: { id } });
    },

    // ═══════════════════════════════════
    // CADENCE STEPS
    // ═══════════════════════════════════
    async addStep(cadenceId: string, data: any, user: JwtUser) {
        const cadence = await prisma.cadence.findUnique({
            where: { id: cadenceId, userId: user.userId },
            include: { steps: true },
        });
        if (!cadence) throw new Error("Cadência não encontrada");

        return prisma.cadenceStep.create({
            data: {
                cadenceId,
                type: data.type || data.channel,
                title: data.title,
                delay: data.delay || 0,
                delayUnit: data.delayUnit || "days",
                orderIndex: cadence.steps.length,
                channel: data.channel || "email",
                delayDays: data.delayDays || 0,
                delayHours: data.delayHours || 0,
                templateContent: data.templateContent,
                subject: data.subject,
                stopOnReply: data.stopOnReply ?? true,
            },
        });
    },

    async updateStep(cadenceId: string, stepId: string, data: any, user: JwtUser) {
        const cadence = await prisma.cadence.findUnique({ where: { id: cadenceId, userId: user.userId } });
        if (!cadence) throw new Error("Cadência não encontrada");
        return prisma.cadenceStep.update({ where: { id: stepId, cadenceId }, data });
    },

    async deleteStep(cadenceId: string, stepId: string, user: JwtUser) {
        const cadence = await prisma.cadence.findUnique({ where: { id: cadenceId, userId: user.userId } });
        if (!cadence) throw new Error("Cadência não encontrada");
        return prisma.cadenceStep.delete({ where: { id: stepId, cadenceId } });
    },

    async reorderSteps(cadenceId: string, stepIds: string[], user: JwtUser) {
        const cadence = await prisma.cadence.findUnique({ where: { id: cadenceId, userId: user.userId } });
        if (!cadence) throw new Error("Cadência não encontrada");

        const ops = stepIds.map((id, index) =>
            prisma.cadenceStep.update({ where: { id, cadenceId }, data: { orderIndex: index } })
        );
        return prisma.$transaction(ops);
    },

    // ═══════════════════════════════════
    // SDR LEADS
    // ═══════════════════════════════════
    async listLeads(query: any) {
        const where: Prisma.SdrLeadWhereInput = {};
        if (query.status) where.status = query.status;
        if (query.segment) where.segment = query.segment;
        if (query.temperature) where.temperature = query.temperature;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { email: { contains: query.search, mode: "insensitive" } },
                { company: { contains: query.search, mode: "insensitive" } },
            ];
        }

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [items, total] = await Promise.all([
            prisma.sdrLead.findMany({
                where,
                include: { enrollments: { include: { cadence: { select: { id: true, name: true } } } } },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.sdrLead.count({ where }),
        ]);
        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    },

    async getAvailableLeads(query: any) {
        const where: Prisma.SdrLeadWhereInput = {
            status: "novo",
            enrollments: { none: { status: "ativo" } },
        };
        if (query.segment) where.segment = query.segment;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { company: { contains: query.search, mode: "insensitive" } },
            ];
        }

        return prisma.sdrLead.findMany({ where, orderBy: { createdAt: "desc" } });
    },

    async createLead(data: any) {
        return prisma.sdrLead.create({ data });
    },

    async updateLead(id: string, data: any) {
        return prisma.sdrLead.update({ where: { id }, data });
    },

    async activateLeads(leadIds: string[], cadenceId: string, consultantId?: string) {
        const cadence = await prisma.cadence.findUnique({
            where: { id: cadenceId },
            include: { steps: { orderBy: { orderIndex: "asc" }, take: 1 } },
        });
        if (!cadence) throw new Error("Cadência não encontrada");
        if (cadence.status !== "active" && cadence.status !== "draft") throw new Error("Cadência não está ativa");

        const now = new Date();
        const firstStep = cadence.steps[0];
        const delayMs = firstStep
            ? (firstStep.delayDays * 86400000) + (firstStep.delayHours * 3600000)
            : 0;
        const nextActionAt = new Date(now.getTime() + delayMs);

        const results = await prisma.$transaction(
            leadIds.map(leadId =>
                prisma.leadCadenceEnrollment.create({
                    data: {
                        leadId,
                        cadenceId,
                        currentStep: 1,
                        status: "ativo",
                        startedAt: now,
                        nextActionAt,
                    },
                })
            )
        );

        // Update lead status
        await prisma.sdrLead.updateMany({
            where: { id: { in: leadIds } },
            data: { status: "em_cadencia", ...(consultantId ? { consultantId } : {}) },
        });

        // Update cadence contact count
        await prisma.cadence.update({
            where: { id: cadenceId },
            data: { contactsCount: { increment: leadIds.length } },
        });

        return results;
    },

    async pauseLead(leadId: string) {
        return prisma.leadCadenceEnrollment.updateMany({
            where: { leadId, status: "ativo" },
            data: { status: "pausado", pausedAt: new Date() },
        });
    },

    async resumeLead(leadId: string) {
        return prisma.leadCadenceEnrollment.updateMany({
            where: { leadId, status: "pausado" },
            data: { status: "ativo", pausedAt: null, nextActionAt: new Date() },
        });
    },

    async removeLead(leadId: string) {
        await prisma.leadCadenceEnrollment.updateMany({
            where: { leadId, status: { in: ["ativo", "pausado"] } },
            data: { status: "concluido", completedAt: new Date() },
        });
        return prisma.sdrLead.update({ where: { id: leadId }, data: { status: "novo" } });
    },

    async takeoverLead(leadId: string) {
        await prisma.leadCadenceEnrollment.updateMany({
            where: { leadId, status: "ativo" },
            data: { status: "pausado", pausedAt: new Date() },
        });
        return { message: "Cadência pausada. Você está no controle manual." };
    },

    async importLeads(leads: any[], cadenceId?: string) {
        const created = await prisma.$transaction(
            leads.map(lead => prisma.sdrLead.create({ data: { ...lead, origin: "csv_import" } }))
        );

        if (cadenceId) {
            await this.activateLeads(created.map(l => l.id), cadenceId);
        }
        return { imported: created.length, leads: created };
    },

    // ═══════════════════════════════════
    // MONITOR & STATS
    // ═══════════════════════════════════
    async getMonitorStats() {
        const [leadsInCadence, needsIntervention, qualified, meetings] = await Promise.all([
            prisma.leadCadenceEnrollment.count({ where: { status: "ativo" } }),
            prisma.sdrLead.count({ where: { status: "em_cadencia" /* intervention logic via actions would go here */ } }),
            prisma.sdrLead.count({ where: { status: "qualificado" } }),
            prisma.scheduledMeeting.count({ where: { status: { in: ["agendada", "confirmada"] } } }),
        ]);
        return { leadsInCadence, needsIntervention, qualified, meetings };
    },

    async getMonitorLeads(query: any) {
        const where: Prisma.SdrLeadWhereInput = {
            enrollments: { some: { status: "ativo" } },
        };
        if (query.cadenceId) {
            where.enrollments = { some: { cadenceId: query.cadenceId, status: "ativo" } };
        }
        if (query.temperature) where.temperature = query.temperature;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { company: { contains: query.search, mode: "insensitive" } },
            ];
        }

        const page = query.page || 1;
        const limit = query.limit || 20;

        const [items, total] = await Promise.all([
            prisma.sdrLead.findMany({
                where,
                include: {
                    enrollments: { where: { status: "ativo" }, include: { cadence: { select: { id: true, name: true } } } },
                },
                orderBy: { updatedAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.sdrLead.count({ where }),
        ]);
        return { items, total, page, limit };
    },

    async getActivityFeed(limit = 20) {
        return prisma.cadenceAction.findMany({
            include: { lead: { select: { id: true, name: true, company: true } } },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    },

    async getInterventions() {
        // Leads with actions where AI escalated or reasoning suggests intervention
        return prisma.sdrLead.findMany({
            where: {
                status: "em_cadencia",
                actions: { some: { actionType: "escalated" } },
            },
            include: {
                actions: { orderBy: { createdAt: "desc" }, take: 1 },
                enrollments: { where: { status: "ativo" }, include: { cadence: { select: { name: true } } } },
            },
        });
    },

    // ═══════════════════════════════════
    // TIMELINE
    // ═══════════════════════════════════
    async getLeadTimeline(leadId: string) {
        return prisma.cadenceAction.findMany({
            where: { leadId },
            orderBy: { createdAt: "desc" },
        });
    },

    async getLeadQualification(leadId: string) {
        const lead = await prisma.sdrLead.findUnique({
            where: { id: leadId },
            select: { qualificationData: true, score: true, temperature: true },
        });
        return lead;
    },

    // ═══════════════════════════════════
    // QUALIFICATION CRITERIA
    // ═══════════════════════════════════
    async listCriteria() {
        return prisma.qualificationCriteria.findMany({ orderBy: { sortOrder: "asc" } });
    },

    async createCriteria(data: any) {
        return prisma.qualificationCriteria.create({ data });
    },

    async updateCriteria(id: string, data: any) {
        return prisma.qualificationCriteria.update({ where: { id }, data });
    },

    async deleteCriteria(id: string) {
        return prisma.qualificationCriteria.delete({ where: { id } });
    },

    async reorderCriteria(criteriaIds: string[]) {
        const ops = criteriaIds.map((id, index) =>
            prisma.qualificationCriteria.update({ where: { id }, data: { sortOrder: index } })
        );
        return prisma.$transaction(ops);
    },

    // ═══════════════════════════════════
    // THRESHOLDS
    // ═══════════════════════════════════
    async getThresholds() {
        let thresholds = await prisma.qualificationThresholds.findFirst();
        if (!thresholds) {
            thresholds = await prisma.qualificationThresholds.create({
                data: { hotMin: 80, warmMin: 50, hotAction: "agendar_reuniao", warmAction: "continuar_cadencia", coldAction: "pausar_cadencia" },
            });
        }
        return thresholds;
    },

    async updateThresholds(data: any) {
        const existing = await prisma.qualificationThresholds.findFirst();
        if (existing) {
            return prisma.qualificationThresholds.update({ where: { id: existing.id }, data });
        }
        return prisma.qualificationThresholds.create({ data });
    },

    // ═══════════════════════════════════
    // MEETINGS
    // ═══════════════════════════════════
    async listMeetings(query?: { consultantId?: string; status?: string }) {
        const where: Prisma.ScheduledMeetingWhereInput = {};
        if (query?.consultantId) where.consultantId = query.consultantId;
        if (query?.status) where.status = query.status;

        return prisma.scheduledMeeting.findMany({
            where,
            include: {
                lead: { select: { id: true, name: true, company: true, email: true, phone: true, score: true, temperature: true } },
                consultant: { select: { id: true, name: true, email: true } },
            },
            orderBy: { scheduledAt: "asc" },
        });
    },

    async createMeeting(data: any) {
        const meeting = await prisma.scheduledMeeting.create({
            data: {
                leadId: data.leadId,
                consultantId: data.consultantId,
                scheduledAt: new Date(data.scheduledAt),
                meetLink: data.meetLink,
                status: "agendada",
            },
        });

        // Update lead status
        await prisma.sdrLead.update({
            where: { id: data.leadId },
            data: { status: "agendado" },
        });

        return meeting;
    },

    async updateMeeting(id: string, data: any) {
        const updateData: any = {};
        if (data.status) updateData.status = data.status;
        if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt);
        if (data.meetLink) updateData.meetLink = data.meetLink;

        return prisma.scheduledMeeting.update({ where: { id }, data: updateData });
    },
};
