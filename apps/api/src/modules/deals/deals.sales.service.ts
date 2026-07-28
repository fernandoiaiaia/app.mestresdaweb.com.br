import { prisma } from "../../config/database.js";
import { getDealsBaseWhereClause } from "./deals.utils.js";

export interface SalesReportQuery {
    userId: string;
    startDate?: string;
    endDate?: string;
    consultantId?: string;
    source?: string;
    funnelId?: string;
    search?: string;
}

export const dealsSalesService = {
    async list(query: SalesReportQuery) {
        const { userId, startDate, endDate, consultantId, source, funnelId, search } = query;

        const baseWhere = await getDealsBaseWhereClause(userId);

        // ─── Filter options: all "won" deals within scope, ignoring active filters ───
        const scopeConditions: any[] = [{ status: "won" }];
        if (baseWhere.OR) scopeConditions.push({ OR: baseWhere.OR });

        const scopedWonDeals = await prisma.deal.findMany({
            where: { AND: scopeConditions },
            select: {
                source: true,
                funnel: { select: { id: true, name: true } },
                consultant: { select: { id: true, name: true } },
            },
        });

        const consultantsMap = new Map<string, { id: string; name: string }>();
        const funnelsMap = new Map<string, { id: string; name: string }>();
        const sourcesSet = new Set<string>();
        for (const d of scopedWonDeals) {
            if (d.consultant) consultantsMap.set(d.consultant.id, d.consultant);
            if (d.funnel) funnelsMap.set(d.funnel.id, d.funnel);
            if (d.source) sourcesSet.add(d.source);
        }

        // ─── Main filtered list ───────────────────────────────────────────────
        const conditions: any[] = [...scopeConditions];

        if (consultantId) {
            conditions.push({ OR: [{ consultantId }, { assigneeIds: { has: consultantId } }] });
        }
        if (funnelId) {
            conditions.push({ funnelId });
        }
        if (source) {
            conditions.push({ source });
        }
        if (startDate || endDate) {
            const updatedAt: { gte?: Date; lte?: Date } = {};
            if (startDate) updatedAt.gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) updatedAt.lte = new Date(`${endDate}T23:59:59.999Z`);
            conditions.push({ updatedAt });
        }
        if (search) {
            conditions.push({
                OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { client: { name: { contains: search, mode: "insensitive" } } },
                ],
            });
        }

        const deals = await prisma.deal.findMany({
            where: { AND: conditions },
            include: {
                client: { select: { id: true, name: true, email: true, company: true, phone: true } },
                consultant: { select: { id: true, name: true, avatar: true } },
                funnel: { select: { id: true, name: true } },
                stage: { select: { id: true, name: true, color: true } },
            },
            orderBy: { updatedAt: "desc" },
        });

        const count = deals.length;
        const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
        const avgTicket = count > 0 ? totalValue / count : 0;

        return {
            deals,
            filterOptions: {
                consultants: Array.from(consultantsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
                funnels: Array.from(funnelsMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
                sources: Array.from(sourcesSet.values()).sort(),
            },
            summary: { count, totalValue, avgTicket },
        };
    },
};
