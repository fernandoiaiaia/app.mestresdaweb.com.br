import { prisma } from "../config/database.js";
import { logger } from "./logger.js";
import { getOwnerUserId } from "./get-owner.js";

/**
 * Centralised Lead Assignment Service
 * 
 * Provides a single `resolveAssignee` function that:
 * 1. Checks Lead Affinity — if the phone/email already belongs to a Client/Contact
 *    that has a Deal with a consultant, returns that same consultant.
 * 2. Falls back to Round-Robin from the default Funnel's `assigneeIds`.
 * 3. Falls back to the OWNER account if no Round-Robin is configured.
 */
export const leadAssignmentService = {

    /**
     * Resolve which user should own a new Lead / Conversation.
     * 
     * @param phone  — Raw phone (e.g. "5511958333123")
     * @param email  — Contact e-mail (optional)
     * @returns userId of the assigned salesperson
     */
    async resolveAssignee(phone?: string | null, email?: string | null): Promise<string> {
        const ownerId = await getOwnerUserId();
        if (!ownerId) throw new Error("Nenhum OWNER/ADMIN encontrado no sistema.");

        // ─── 1. Lead Affinity: check if this phone/email already has an assigned consultant ───
        const affinityUserId = await this.findAffinityConsultant(phone, email, ownerId);
        if (affinityUserId) {
            logger.info({ affinityUserId, phone, email }, "[LeadAssignment] Affinity match — routing to existing consultant");
            return affinityUserId;
        }

        // ─── 2. Round-Robin from Default Funnel ───
        const funnel = await prisma.funnel.findFirst({
            where: { userId: ownerId, active: true },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
        });

        if (funnel && funnel.assigneeIds.length > 0) {
            const nextIndex = (funnel.lastAssignedIndex + 1) % funnel.assigneeIds.length;
            const assignedUserId = funnel.assigneeIds[nextIndex];

            // Persist Round-Robin pointer
            await prisma.funnel.update({
                where: { id: funnel.id },
                data: { lastAssignedIndex: nextIndex },
            });

            logger.info({ assignedUserId, nextIndex, funnelId: funnel.id }, "[LeadAssignment] Round-Robin assignment");
            return assignedUserId;
        }

        // ─── 3. Fallback: OWNER ───
        logger.info({ ownerId }, "[LeadAssignment] No Round-Robin configured — fallback to OWNER");
        return ownerId;
    },

    /**
     * Searches for an existing consultant assignment by phone or email.
     * Checks: Deals (consultantId) via Client, and WhatsApp Conversations (assigneeId).
     */
    async findAffinityConsultant(phone?: string | null, email?: string | null, ownerId?: string): Promise<string | null> {
        if (!phone && !email) return null;

        // Normalise phone to last 10 digits for flexible matching
        const phoneSuffix = phone ? phone.replace(/\D/g, "").slice(-10) : null;

        // ─── Check Deals via Client (phone or email match) ───
        if (phoneSuffix || email) {
            const conditions: any[] = [];

            if (phoneSuffix) {
                // Use raw query for phone stripping
                const clientsByPhone = await prisma.$queryRaw<Array<{ id: string }>>`
                    SELECT id FROM clients
                    WHERE phone IS NOT NULL
                      AND regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${"%" + phoneSuffix + "%"}
                    LIMIT 1
                `;
                if (clientsByPhone.length > 0) {
                    conditions.push({ clientId: clientsByPhone[0].id });
                }
            }

            if (email) {
                const clientByEmail = await prisma.client.findFirst({
                    where: { email: { equals: email.toLowerCase(), mode: "insensitive" } },
                    select: { id: true },
                });
                if (clientByEmail) {
                    conditions.push({ clientId: clientByEmail.id });
                }
            }

            if (conditions.length > 0) {
                const deal = await prisma.deal.findFirst({
                    where: {
                        OR: conditions,
                        consultantId: { not: null },
                        status: { not: "lost" },
                    },
                    orderBy: { updatedAt: "desc" },
                    select: { consultantId: true },
                });
                if (deal?.consultantId) return deal.consultantId;
            }
        }

        // ─── Check WhatsApp Conversations (phone match) ───
        if (phoneSuffix) {
            const contacts = await prisma.$queryRaw<Array<{ id: string }>>`
                SELECT id FROM whatsapp_contacts
                WHERE regexp_replace(phone, '[^0-9]', '', 'g') LIKE ${"%" + phoneSuffix + "%"}
                LIMIT 1
            `;

            if (contacts.length > 0) {
                const conversation = await prisma.whatsappConversation.findFirst({
                    where: {
                        contactId: contacts[0].id,
                        assigneeId: { not: null },
                    },
                    orderBy: { lastMessageAt: "desc" },
                    select: { assigneeId: true },
                });
                if (conversation?.assigneeId) return conversation.assigneeId;
            }
        }

        return null;
    },
};
