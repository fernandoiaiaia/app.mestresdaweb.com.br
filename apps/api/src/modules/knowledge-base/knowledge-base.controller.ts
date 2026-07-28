import { Request, Response } from "express";
import { KnowledgeBaseService } from "./knowledge-base.service.js";

export const knowledgeBaseController = {
    async list(req: Request, res: Response) {
        const files = await KnowledgeBaseService.getFilesByUser(req.user!.userId);
        res.json({ success: true, data: files });
    },

    async upload(req: Request, res: Response) {
        const file = await KnowledgeBaseService.uploadFile(req.user!.userId, req.body);
        res.status(201).json({ success: true, data: file, message: "Arquivo adicionado à base de conhecimento." });
    },

    async delete(req: Request, res: Response) {
        const id = req.params.id as string;
        await KnowledgeBaseService.deleteFile(req.user!.userId, id);
        res.json({ success: true, message: "Arquivo deletado com sucesso." });
    }
};
