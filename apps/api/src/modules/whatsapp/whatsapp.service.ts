import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { getOwnerUserId } from "../../lib/get-owner.js";

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
        // Use OWNER's global WhatsApp integration
        const ownerId = await getOwnerUserId();
        if (!ownerId) return null;
        const setting = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId: ownerId, provider: "whatsapp" } }
        });

        if (!setting || !setting.isActive || !setting.credentials) return null;

        const creds = setting.credentials as Record<string, any>;
        if (!creds.accessToken || !creds.phoneNumberId) return null;

        return {
            accessToken: creds.accessToken,
            phoneNumberId: creds.phoneNumberId,
            wabaId: creds.wabaId || creds.businessAccountId
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
                        wabaId: creds.wabaId || creds.businessAccountId
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
            
            const hasPlus = toPhone.trim().startsWith("+");
            let finalPhone = toPhone.replace(/\D/g, "");
            
            // Remove leading zero(s) common in Brazil (e.g. 011999999999)
            if (finalPhone.startsWith("0")) {
                finalPhone = finalPhone.replace(/^0+/, "");
            }
            
            // Só adiciona 55 se não tiver o "+" indicando código de país internacional 
            // E se tiver o tamanho exato de um telefone local do Brasil (DDD + Número = 10 ou 11)
            if (!hasPlus && (finalPhone.length === 10 || finalPhone.length === 11)) {
                finalPhone = "55" + finalPhone;
            }

            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: finalPhone,
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
     * Sends a template message. Automatically handles templates with IMAGE headers.
     */
    static async sendTemplateMessage(
        credentials: WhatsappCredentials,
        toPhone: string,
        templateName: string,
        language: string = "pt_BR",
        headerImageUrl?: string
    ) {
        try {
            const url = `https://graph.facebook.com/v23.0/${credentials.phoneNumberId}/messages`;
            
            const hasPlus = toPhone.trim().startsWith("+");
            let finalPhone = toPhone.replace(/\D/g, "");
            
            if (finalPhone.startsWith("0")) {
                finalPhone = finalPhone.replace(/^0+/, "");
            }
            
            if (!hasPlus && (finalPhone.length === 10 || finalPhone.length === 11)) {
                finalPhone = "55" + finalPhone;
            }

            // Build template components
            const components: any[] = [];

            // If template needs an image header, try to detect it from Meta API
            if (!headerImageUrl && credentials.wabaId) {
                try {
                    const metaRes = await fetch(
                        `https://graph.facebook.com/v23.0/${credentials.wabaId}/message_templates?fields=name,components&limit=250`,
                        { headers: { "Authorization": `Bearer ${credentials.accessToken}` } }
                    );
                    const metaData = await metaRes.json() as any;
                    const templateDef = (metaData.data || []).find((t: any) => t.name === templateName);
                    
                    if (templateDef) {
                        const headerComp = templateDef.components?.find((c: any) => c.type === "HEADER");
                        if (headerComp?.format === "IMAGE") {
                            // Use a default company logo if no image provided
                            headerImageUrl = "https://mestresdaweb.com.br/images/logo-dark.png";
                            logger.info({ templateName }, "[WhatsApp] Template requires IMAGE header, using default logo");
                        }
                    }
                } catch (metaErr) {
                    logger.warn({ metaErr }, "[WhatsApp] Could not fetch template metadata, sending without header");
                }
            }

            if (headerImageUrl) {
                components.push({
                    type: "header",
                    parameters: [{ type: "image", image: { link: headerImageUrl } }]
                });
            }

            const payload: any = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: finalPhone,
                type: "template",
                template: {
                    name: templateName,
                    language: { code: language },
                    ...(components.length > 0 ? { components } : {})
                }
            };

            logger.info({ templateName, to: finalPhone, hasImageHeader: !!headerImageUrl }, "[WhatsApp] Sending template");

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

    /**
     * Gets all message templates from the WhatsApp Business Account
     */
    static async getTemplates(credentials: WhatsappCredentials) {
        try {
            if (!credentials.wabaId) {
                throw new Error("WhatsApp Business Account ID (wabaId) is missing in credentials");
            }
            
            const url = `https://graph.facebook.com/v18.0/${credentials.wabaId}/message_templates`;
            
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${credentials.accessToken}`
                }
            });

            const data = await response.json();
            if (!response.ok) {
                logger.error({ data }, "Failed to fetch WhatsApp templates");
                throw new Error("Failed to fetch WhatsApp templates");
            }

            return data.data || [];
        } catch (err) {
            logger.error({ err }, "WhatsApp Get Templates Exception");
            throw err;
        }
    }
}
