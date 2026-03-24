import type { Request, Response } from "express";
import { devReportsService } from "./dev-reports.service.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Reports Controller
// ═══════════════════════════════════════

export const devReportsController = {

    /** GET /team — team performance report */
    async teamReport(_req: Request, res: Response) {
        const data = await devReportsService.teamReport();
        res.json({ success: true, data });
    },
};
