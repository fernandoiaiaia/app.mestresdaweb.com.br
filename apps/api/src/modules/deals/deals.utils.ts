import { prisma } from "../../config/database.js";

/**
 * Retorna a cláusula base 'where' para consultas de Deals/Oportunidades,
 * garantindo o respeito ao RBAC (DataScope OWN vs ALL).
 */
export async function getDealsBaseWhereClause(userId: string) {
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { permissions: true }
    });
    
    const isSuperAdmin = dbUser?.role === "OWNER";
    
    let hasAllAccess = false;
    if (isSuperAdmin) {
        hasAllAccess = true;
    } else {
        const pipelinePerm = dbUser?.permissions?.find((p: any) => p.module === "crm.pipeline" && p.action === "view");
        const oppsPerm = dbUser?.permissions?.find((p: any) => p.module === "crm.opportunities" && p.action === "view");
        if (pipelinePerm?.dataScope === "ALL" || oppsPerm?.dataScope === "ALL") {
            hasAllAccess = true;
        }
    }

    if (hasAllAccess) {
        return {}; // Admins e usuários com acesso "ALL" veem tudo da base
    } else {
        return {
            OR: [
                { consultantId: userId },
                { assigneeIds: { has: userId } }
            ]
        };
    }
}
