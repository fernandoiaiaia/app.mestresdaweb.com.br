import { Request, Response } from "express";
import { leadsService } from "./leads.service.js";
import { logger } from "../../lib/logger.js";

export const leadsController = {
    async createPublic(req: Request, res: Response) {
        // DISCONNECTED: Returning dummy data to keep external site flow working
        // const lead = await leadsService.createPublic(req.body);
        res.status(201).json({ success: true, data: { id: "dummy-disconnected-lead-id" } });
    },

    async createPublicContact(req: Request, res: Response) {
        try {
            const { name, email, phone, company } = req.body as {
                name: string; email: string; phone: string; company?: string | null;
            };
            if (!name?.trim() || !email?.trim() || !phone?.trim()) {
                return res.status(400).json({ success: false, error: { message: "name, email e phone são obrigatórios." } });
            }
            
            // DISCONNECTED: Bypass logic to avoid populating CRM while "desconectado"
            // const result = await leadsService.createPublicContact({ name, email, phone, company });
            const result = { clientId: "dummy-client-id-disconnected", companyId: null };
            
            return res.status(201).json({ success: true, data: result });
        } catch (err) {
            logger.error({ err }, "[Cz Form] Error creating public contact");
            return res.status(500).json({ success: false, error: { message: "Erro ao registrar contato." } });
        }
    },

    async updatePublicOpportunity(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            
            // ── Temporary debug log to inspect what the frontend is actually sending ──
            logger.info({ id, body: req.body }, "[Cz Form] Incoming updatePublicOpportunity payload");
            
            // DISCONNECTED
            // const { value, budgetText, message } = req.body as {
            //     value?: number; budgetText?: string | null; message?: string | null;
            // };
            // await leadsService.updatePublicOpportunity(id, { value, budgetText, message });
            
            return res.json({ success: true });
        } catch (err) {
            logger.error({ err }, "[Cz Form] Error updating public opportunity");
            return res.status(500).json({ success: false, error: { message: "Erro ao atualizar oportunidade." } });
        }
    },

    async createPublicOpportunity(req: Request, res: Response) {
        try {
            const { clientId, services } = req.body as { clientId: string; services: string[] };
            if (!clientId) {
                return res.status(400).json({ success: false, error: { message: "clientId é obrigatório." } });
            }
            
            // DISCONNECTED
            // const result = await leadsService.createPublicOpportunity({
            //     clientId,
            //     services: Array.isArray(services) ? services : [],
            // });
            const result = { dealId: "dummy-deal-id-disconnected" };
            
            return res.status(201).json({ success: true, data: result });
        } catch (err) {
            logger.error({ err }, "[Cz Form] Error creating public opportunity");
            return res.status(500).json({ success: false, error: { message: "Erro ao criar oportunidade." } });
        }
    },
};
