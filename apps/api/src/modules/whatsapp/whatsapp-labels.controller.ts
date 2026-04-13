import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/whatsapp/labels
 * List all tags configured by the user
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const labels = await prisma.whatsappLabel.findMany({
            where: { userId },
            orderBy: { name: "asc" }
        });
        res.json({ success: true, data: labels });
    } catch (err) {
        logger.error({ err }, "Error listing whatsapp labels");
        res.status(500).json({ success: false, error: { message: "Erro ao listar etiquetas" } });
    }
});

/**
 * POST /api/whatsapp/labels
 * Create a new tag
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { name, color } = req.body;

        const label = await prisma.whatsappLabel.create({
            data: {
                userId,
                name,
                color: color || "bg-blue-500"
            }
        });
        res.json({ success: true, data: label });
    } catch (err) {
        logger.error({ err }, "Error creating whatsapp label");
        res.status(500).json({ success: false, error: { message: "Erro ao criar etiqueta" } });
    }
});

/**
 * PUT /api/whatsapp/labels/:id
 * Edit an existing tag
 */
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;
        const { name, color } = req.body;

        // Verify ownership
        const existing = await prisma.whatsappLabel.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ success: false, error: { message: "Etiqueta não encontrada" } });
        }

        const label = await prisma.whatsappLabel.update({
            where: { id },
            data: { name, color }
        });
        res.json({ success: true, data: label });
    } catch (err) {
        logger.error({ err }, "Error updating whatsapp label");
        res.status(500).json({ success: false, error: { message: "Erro ao atualizar etiqueta" } });
    }
});

/**
 * DELETE /api/whatsapp/labels/:id
 * Remove a tag
 */
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const { id } = req.params;

        const existing = await prisma.whatsappLabel.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ success: false, error: { message: "Etiqueta não encontrada" } });
        }

        await prisma.whatsappLabel.delete({
            where: { id }
        });

        res.json({ success: true, message: "Etiqueta removida" });
    } catch (err) {
        logger.error({ err }, "Error deleting whatsapp label");
        res.status(500).json({ success: false, error: { message: "Erro ao excluir etiqueta" } });
    }
});

export function whatsappLabelsRoutes(app: Router) {
    app.use("/api/whatsapp/labels", router);
}
