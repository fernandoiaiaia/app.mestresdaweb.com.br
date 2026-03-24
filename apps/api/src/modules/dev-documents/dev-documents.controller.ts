import { Request, Response } from "express";
import { devDocumentsService } from "./dev-documents.service.js";
import path from "path";
import fs from "fs";

// ═══════════════════════════════════════
// ProposalAI — Dev Documents Controller
// ═══════════════════════════════════════

class DevDocumentsController {
    /** GET /api/dev-documents/project/:projectId */
    async listByProject(req: Request, res: Response) {
        const docs = await devDocumentsService.listByProject((req.params.projectId as string));
        res.json({ success: true, data: docs });
    }

    /** GET /api/dev-documents/project/:projectId/type/:docType */
    async listByType(req: Request, res: Response) {
        const docs = await devDocumentsService.listByType((req.params.projectId as string), (req.params.docType as string));
        res.json({ success: true, data: docs });
    }

    /** GET /api/dev-documents/project/:projectId/counts */
    async countByType(req: Request, res: Response) {
        const counts = await devDocumentsService.countByType((req.params.projectId as string));
        res.json({ success: true, data: counts });
    }

    /** POST /api/dev-documents/project/:projectId/type/:docType */
    async upload(req: Request, res: Response) {
        const file = (req as any).file;
        if (!file) {
            res.status(400).json({ success: false, error: "Nenhum arquivo enviado" });
            return;
        }
        const user = (req as any).user;
        const doc = await devDocumentsService.create(
            (req.params.projectId as string),
            (req.params.docType as string),
            user.userId,
            {
                title: req.body.title || file.originalname.replace(".pdf", ""),
                notes: req.body.notes,
                fileName: file.originalname,
                storedName: file.filename,
                fileSize: file.size,
                mimeType: file.mimetype,
            }
        );
        res.status(201).json({ success: true, data: doc });
    }

    /** GET /api/dev-documents/:id */
    async getById(req: Request, res: Response) {
        const doc = await devDocumentsService.getById((req.params.id as string));
        if (!doc) { res.status(404).json({ success: false, error: "Documento não encontrado" }); return; }
        res.json({ success: true, data: doc });
    }

    /** DELETE /api/dev-documents/:id */
    async delete(req: Request, res: Response) {
        const doc = await devDocumentsService.getById((req.params.id as string));
        if (doc) {
            const filePath = path.resolve(process.cwd(), "uploads", "project-documents", doc.storedName);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await devDocumentsService.delete((req.params.id as string));
        res.json({ success: true, message: "Documento excluído" });
    }

    /** GET /api/dev-documents/:id/download */
    async download(req: Request, res: Response) {
        const doc = await devDocumentsService.getById((req.params.id as string));
        if (!doc) { res.status(404).json({ success: false, error: "Documento não encontrado" }); return; }
        const filePath = path.resolve(process.cwd(), "uploads", "project-documents", doc.storedName);
        if (!fs.existsSync(filePath)) { res.status(404).json({ success: false, error: "Arquivo não encontrado" }); return; }
        res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.fileName)}"`);
        res.setHeader("Content-Type", doc.mimeType);
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", "*");
        fs.createReadStream(filePath).pipe(res);
    }

    /** POST /api/dev-documents/signatures/:sigId/send-code */
    async sendCode(req: Request, res: Response) {
        const sig = await devDocumentsService.sendCode((req.params.sigId as string));
        res.json({ success: true, data: sig });
    }

    /** POST /api/dev-documents/:id/send-all */
    async sendAllCodes(req: Request, res: Response) {
        const doc = await devDocumentsService.sendAllCodes((req.params.id as string));
        res.json({ success: true, data: doc });
    }

    /** POST /api/dev-documents/signatures/:sigId/validate */
    async validateCode(req: Request, res: Response) {
        try {
            const doc = await devDocumentsService.validateCode((req.params.sigId as string), req.body.code);
            res.json({ success: true, data: doc });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }
}

export const devDocumentsController = new DevDocumentsController();
