import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { dealsService } from "./deals.service.js";
import { prisma } from "../../config/database.js";

// Ensure uploads dir exists
const uploadsDir = path.resolve(process.cwd(), "uploads", "deal-files");
fs.mkdirSync(uploadsDir, { recursive: true });

export const dealsController = {
    async list(req: Request, res: Response) {
        const query = {
            funnelId: typeof req.query.funnelId === 'string' ? req.query.funnelId : undefined,
            search: typeof req.query.search === 'string' ? req.query.search : undefined
        };
        const deals = await dealsService.list(req.user!, query);
        res.json({ success: true, data: deals });
    },

    async get(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const deal = await dealsService.getById(id, req.user!);
            res.json({ success: true, data: deal });
        } catch (error: any) {
            res.status(404).json({ success: false, error: error.message || "Não encontrado" });
        }
    },

    async create(req: Request, res: Response) {
        const deal = await dealsService.create(req.body, req.user!);
        res.status(201).json({ success: true, data: deal });
    },

    async update(req: Request, res: Response) {
        const id = req.params.id as string;
        const deal = await dealsService.update(id, req.body, req.user!);
        res.json({ success: true, data: deal });
    },

    async updateStage(req: Request, res: Response) {
        const id = req.params.id as string;
        const stageId = req.body.stageId as string;
        const deal = await dealsService.updateStage(id, stageId, req.user!);
        res.json({ success: true, data: deal });
    },

    async changeFunnel(req: Request, res: Response) {
        const id = req.params.id as string;
        const funnelId = req.body.funnelId as string;
        try {
            const deal = await dealsService.changeFunnel(id, funnelId, req.user!);
            res.json({ success: true, data: deal });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    async getNotes(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const notes = await dealsService.getNotes(id, req.user!);
            res.json({ success: true, data: notes });
        } catch (error: any) {
            res.status(404).json({ success: false, error: error.message });
        }
    },

    async addNote(req: Request, res: Response) {
        const id = req.params.id as string;
        try {
            const note = await dealsService.addNote(id, req.body, req.user!);
            res.status(201).json({ success: true, data: note });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await dealsService.delete(id, req.user!);
        res.json({ success: true, message: "Negócio deletado com sucesso" });
    },

    // ═══ File CRUD ═══
    async listFiles(req: Request, res: Response) {
        const dealId = req.params.id as string;
        const files = await prisma.dealFile.findMany({
            where: { dealId },
            orderBy: { createdAt: "desc" },
            select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
        });
        res.json({ success: true, data: files });
    },

    async uploadFile(req: Request, res: Response) {
        const dealId = req.params.id as string;
        const file = (req as any).file;
        if (!file) {
            res.status(400).json({ success: false, error: "Nenhum arquivo enviado" });
            return;
        }
        const record = await prisma.dealFile.create({
            data: {
                dealId,
                userId: req.user!.userId,
                originalName: file.originalname,
                storedName: file.filename,
                mimeType: file.mimetype,
                size: file.size,
            },
            select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true },
        });
        res.status(201).json({ success: true, data: record });
    },

    async deleteFile(req: Request, res: Response) {
        const fileId = req.params.fileId as string;
        const file = await prisma.dealFile.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ success: false, error: "Arquivo não encontrado" });
            return;
        }
        // Delete physical file
        const filePath = path.join(uploadsDir, file.storedName);
        try { fs.unlinkSync(filePath); } catch { }
        await prisma.dealFile.delete({ where: { id: fileId } });
        res.json({ success: true, message: "Arquivo excluído" });
    },

    async downloadFile(req: Request, res: Response) {
        const fileId = req.params.fileId as string;
        const file = await prisma.dealFile.findUnique({ where: { id: fileId } });
        if (!file) {
            res.status(404).json({ success: false, error: "Arquivo não encontrado" });
            return;
        }
        const filePath = path.join(uploadsDir, file.storedName);
        if (!fs.existsSync(filePath)) {
            res.status(404).json({ success: false, error: "Arquivo físico não encontrado" });
            return;
        }
        res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`);
        res.setHeader("Content-Type", file.mimeType);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    },
};
