import { Request, Response } from "express";
import { devSettingsService } from "./dev-settings.service.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Project Settings Controller
// ═══════════════════════════════════════

class DevSettingsController {
    /** GET /api/dev-settings */
    async get(req: Request, res: Response) {
        const user = (req as any).user;
        const settings = await devSettingsService.getSettings(user.userId);
        res.json({ success: true, data: settings });
    }

    /** PUT /api/dev-settings */
    async upsert(req: Request, res: Response) {
        const user = (req as any).user;
        const { phases, roles, aiRules } = req.body;
        const settings = await devSettingsService.upsertSettings(user.userId, { phases, roles, aiRules });
        res.json({ success: true, data: settings });
    }
}

export const devSettingsController = new DevSettingsController();
