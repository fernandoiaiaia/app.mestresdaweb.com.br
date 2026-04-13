import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Gets the active Brevo configuration.
 * It prioritizes a valid "proposal_brevo" integration stored in the database.
 * If not found or if incomplete, it falls back to the .env variables.
 */
export async function getSystemEmailConfig() {
    try {
        const setting = await prisma.integrationSetting.findFirst({
            where: { provider: "proposal_brevo", isActive: true },
            orderBy: { createdAt: "asc" },
        });

        if (setting) {
            const creds = setting.credentials as any;
            const meta = setting.metadata as any;

            const apiKey = creds?.apiKey || env.BREVO_API_KEY;
            
            // Check both metadata and credentials since frontend structure might vary
            const fromEmail = meta?.fromEmail || creds?.fromEmail || meta?.senderEmail || creds?.senderEmail || env.BREVO_FROM_EMAIL || "noreply@mestresdaweb.com.br";
            const fromName = meta?.fromName || creds?.fromName || meta?.senderName || creds?.senderName || env.BREVO_FROM_NAME || "ProposalAI";

            if (apiKey) {
                return { apiKey, fromEmail, fromName, source: "database" };
            }
        }
    } catch (err) {
        logger.error({ err }, "Error fetching system email config from database");
    }

    return {
        apiKey: env.BREVO_API_KEY,
        fromEmail: env.BREVO_FROM_EMAIL || "noreply@mestresdaweb.com.br",
        fromName: env.BREVO_FROM_NAME || "ProposalAI",
        source: "env"
    };
}
