import { Request, Response } from "express";
import { setupFinancialDefaults } from "./financial-setup.service.js";

export const financialSetupController = {
    async setup(req: Request, res: Response) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Não autenticado" } });
                return;
            }

            const result = await setupFinancialDefaults(req.user.userId);
            res.json({ success: true, data: result, message: "Cadastros financeiros padrão criados com sucesso." });
        } catch (error: any) {
            console.error("[FINANCIAL_SETUP_ERROR]", error);
            res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message || "Erro ao criar cadastros financeiros" } });
        }
    },
};
