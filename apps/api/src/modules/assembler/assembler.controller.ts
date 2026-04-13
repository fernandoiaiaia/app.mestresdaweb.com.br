import { Request, Response } from "express";
import { AssemblerService } from "./assembler.service.js";

export const assemblerController = {
    async listProposals(req: Request, res: Response) {
        const { clientId, dealId } = req.query;
        const proposals = await AssemblerService.listProposals(req.user!.userId, {
            clientId: clientId as string,
            dealId: dealId as string
        });
        res.json({ success: true, data: proposals });
    },

    async listClientProposals(req: Request, res: Response) {
        const proposals = await AssemblerService.listClientProposals(req.user!.userId);
        res.json({ success: true, data: proposals });
    },

    async getProposal(req: Request, res: Response) {
        try {
            const proposal = await AssemblerService.getProposal(req.user!.userId, req.params.id as string);
            res.json({ success: true, data: proposal });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    async getClientProposal(req: Request, res: Response) {
        try {
            const proposal = await AssemblerService.getClientProposal(req.user!.userId, req.params.id as string);
            res.json({ success: true, data: proposal });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    async getProposalTeam(req: Request, res: Response) {
        try {
            const data = await AssemblerService.getProposalTeamForClient(req.user!.userId, req.params.id as string);
            res.json({ success: true, data });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    async getProposalPayments(req: Request, res: Response) {
        try {
            const data = await AssemblerService.getProposalPaymentsForClient(req.user!.userId, req.params.id as string);
            res.json({ success: true, data });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    // ── SCREEN FEEDBACK (Client → Consultant) ────────────────────────────

    async getScreenFeedback(req: Request, res: Response) {
        try {
            const feedbacks = await AssemblerService.getScreenFeedback(req.user!.userId, req.params.id as string);
            res.json({ success: true, data: feedbacks });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    async postScreenFeedback(req: Request, res: Response) {
        try {
            const { screenId, screenTitle, moduleName, text } = req.body;
            if (!screenId || !text) {
                return res.status(400).json({ success: false, error: "screenId and text are required" });
            }
            const feedback = await AssemblerService.addScreenFeedback(
                req.user!.userId,
                req.params.id as string,
                { screenId, screenTitle: screenTitle || "", moduleName: moduleName || "", text }
            );
            res.json({ success: true, data: feedback });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    // ── Consultant-side: get feedbacks for own proposals ──────────────────

    async getProposalFeedback(req: Request, res: Response) {
        try {
            const feedbacks = await AssemblerService.getProposalFeedback(req.user!.userId, req.params.id as string);
            res.json({ success: true, data: feedbacks });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    async markFeedbackRead(req: Request, res: Response) {
        try {
            const { feedbackIds } = req.body;
            if (!feedbackIds || !Array.isArray(feedbackIds)) {
                return res.status(400).json({ success: false, error: "feedbackIds array is required" });
            }
            const updated = await AssemblerService.markFeedbackRead(req.user!.userId, req.params.id as string, feedbackIds);
            res.json({ success: true, data: updated });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    async saveProposal(req: Request, res: Response) {
        try {
            const proposal = await AssemblerService.saveProposal(req.user!.userId, req.body);
            res.json({ success: true, data: proposal });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    async deleteProposal(req: Request, res: Response) {
        try {
            await AssemblerService.deleteProposal(req.user!.userId, req.params.id as string);
            res.json({ success: true, message: "Deleted successfully" });
        } catch (e: any) {
            if (e.message === "NOT_FOUND") return res.status(404).json({ success: false, error: "Not found" });
            throw e;
        }
    },

    async generate(req: Request, res: Response) {
        try {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            await AssemblerService.streamGenerate(req.user!.userId, req.body, res);
        } catch (e: any) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: e.message || "Internal server error" })}\n\n`);
            res.end();
        }
    }
};
