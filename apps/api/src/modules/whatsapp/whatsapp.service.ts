import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";

interface WhatsappCredentials {
    accessToken: string;
    phoneNumberId: string;
    wabaId?: string;
}

export class WhatsappService {
    /**
     * Gets the active Integration Setting for a specific user to act on their behalf.
     */
    static async getCredentials(userId: string): Promise<WhatsappCredentials | null> {
        const setting = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider: "whatsapp" } }
        });

        if (!setting || !setting.isActive || !setting.credentials) return null;

        const creds = setting.credentials as Record<string, any>;
        if (!creds.accessToken || !creds.phoneNumberId) return null;

        return {
            accessToken: creds.accessToken,
            phoneNumberId: creds.phoneNumberId,
            wabaId: creds.wabaId
        };
    }

    /**
     * Finds the integration credentials by the phoneNumberId (used when a webhook comes in).
     */
    static async getCredentialsByPhoneId(phoneNumberId: string): Promise<{ userId: string, credentials: WhatsappCredentials } | null> {
        // We'll search across all whatsapp configurations that match this phone ID
        const rawSettings = await prisma.integrationSetting.findMany({
            where: { provider: "whatsapp", isActive: true }
        });

        for (const setting of rawSettings) {
            const creds = setting.credentials as any;
            if (creds && creds.phoneNumberId === phoneNumberId && creds.accessToken) {
                return {
                    userId: setting.userId,
                    credentials: {
                        accessToken: creds.accessToken,
                        phoneNumberId: creds.phoneNumberId,
                        wabaId: creds.wabaId
                    }
                };
            }
        }
        return null;
    }

    /**
     * Sends a simple text message
     */
    static async sendTextMessage(credentials: WhatsappCredentials, toPhone: string, text: string) {
        try {
            const url = `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`;
            
            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: toPhone.replace(/\\D/g, ""),
                type: "text",
                text: { preview_url: true, body: text }
            };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${credentials.accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                logger.error({ data }, "Failed to send WhatsApp message");
                throw new Error("Failed to send WhatsApp message");
            }

            return data;
        } catch (err) {
            logger.error({ err }, "WhatsApp Send Exception");
            throw err;
        }
    }

    /**
     * Sends a template message
     */
    static async sendTemplateMessage(credentials: WhatsappCredentials, toPhone: string, templateName: string, language: string = "pt_BR") {
        try {
            const url = `https://graph.facebook.com/v18.0/${credentials.phoneNumberId}/messages`;
            
            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: toPhone.replace(/\\D/g, ""),
                type: "template",
                template: {
                    name: templateName,
                    language: { code: language }
                }
            };

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${credentials.accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) {
                logger.error({ data }, "Failed to send WhatsApp template");
                throw new Error("Failed to send WhatsApp template");
            }

            return data;
        } catch (err) {
            logger.error({ err }, "WhatsApp Send Template Exception");
            throw err;
        }
    }
}
