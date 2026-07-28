import { prisma } from "../config/database.js";

/**
 * Returns the OWNER user's ID.
 * Integration settings are global (company-wide): they are always stored
 * under the OWNER account so every user in the organization shares the
 * same credentials.
 *
 * Fallback order: OWNER → ADMIN → first active user.
 */
export async function getOwnerUserId(): Promise<string | null> {
    const owner = await prisma.user.findFirst({
        where: { role: "OWNER", active: true },
        select: { id: true },
        orderBy: { createdAt: "asc" },
    });
    if (owner) return owner.id;

    // Fallback: any ADMIN
    const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", active: true },
        select: { id: true },
        orderBy: { createdAt: "asc" },
    });
    return admin?.id ?? null;
}
