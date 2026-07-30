import { prisma } from "../../config/database.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

export interface AdvisorSummary {
    email: string;
    name: string;
}

/**
 * Mesmo funil e mesma lista (Funnel.assigneeIds) usados pelo round-robin de leads
 * (lib/lead-assignment.service.ts) — só quem realmente recebe leads hoje conta como
 * "advisor" pra fins da integração com o Connech.
 */
export async function listAdvisors(): Promise<AdvisorSummary[]> {
    const ownerId = await getOwnerUserId();
    if (!ownerId) return [];

    const funnel = await prisma.funnel.findFirst({
        where: { userId: ownerId, active: true },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    if (!funnel || funnel.assigneeIds.length === 0) return [];

    return prisma.user.findMany({
        where: { id: { in: funnel.assigneeIds }, active: true },
        select: { email: true, name: true },
    });
}
