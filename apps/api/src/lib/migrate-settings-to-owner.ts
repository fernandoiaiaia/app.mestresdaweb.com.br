import { prisma } from "../config/database.js";
import { getOwnerUserId } from "./get-owner.js";
import { logger } from "./logger.js";

/**
 * One-time reassignment of CRM lookup-table rows (Fontes, Produtos, Motivos de perda,
 * Segmentos, Objeções, Condições de pagamento, Checklist) to the company OWNER account.
 * These tables are meant to be universal/company-wide — every list query filters strictly
 * by getOwnerUserId() — but rows created before that convention existed still carry their
 * original creator's userId, making them invisible to those queries even though they're
 * still in the database. Idempotent: short-circuits once every row already belongs to the
 * owner, so it's safe to call on every boot.
 */
export async function migrateSettingsToOwner(): Promise<void> {
    try {
        const ownerId = await getOwnerUserId();
        if (!ownerId) {
            logger.warn("[MIGRATION] Nenhum OWNER/ADMIN ativo encontrado — pulando migração de settings CRM");
            return;
        }

        const stale = await prisma.lossReason.findFirst({ where: { userId: { not: ownerId } } });
        if (!stale) return; // Já migrado

        await Promise.all([
            prisma.lossReason.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.productCategory.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.product.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.sourceType.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.source.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.sourceCampaign.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.segment.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.objectionCategory.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.objection.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.paymentCondition.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.checklistCategory.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
            prisma.checklistQuestion.updateMany({ where: { userId: { not: ownerId } }, data: { userId: ownerId } }),
        ]);
        logger.info("[MIGRATION] CRM settings reassigned to OWNER");
    } catch (err) {
        logger.error({ err }, "[MIGRATION] Failed to reassign CRM settings to OWNER");
    }
}
