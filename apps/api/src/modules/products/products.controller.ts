import { Request, Response } from "express";
import { productsService } from "./products.service.js";

export const productsController = {
    // ═══ Categories ═══

    async listCategories(req: Request, res: Response) {
        const categories = await productsService.listCategories(req.user!);
        res.json({ success: true, data: categories });
    },

    async createCategory(req: Request, res: Response) {
        const category = await productsService.createCategory(req.body, req.user!);
        res.status(201).json({ success: true, data: category });
    },

    async updateCategory(req: Request, res: Response) {
        const id = req.params.id as string;
        const category = await productsService.updateCategory(id, req.body, req.user!);
        res.json({ success: true, data: category });
    },

    async deleteCategory(req: Request, res: Response) {
        const id = req.params.id as string;
        await productsService.deleteCategory(id, req.user!);
        res.json({ success: true, message: "Categoria excluída" });
    },

    // ═══ Products ═══

    async listProducts(req: Request, res: Response) {
        const products = await productsService.listProducts(req.user!);
        res.json({ success: true, data: products });
    },

    async getProduct(req: Request, res: Response) {
        const id = req.params.id as string;
        const product = await productsService.getProduct(id, req.user!);
        if (!product) {
            res.status(404).json({ success: false, error: { message: "Produto não encontrado" } });
            return;
        }
        res.json({ success: true, data: product });
    },

    async createProduct(req: Request, res: Response) {
        const product = await productsService.createProduct(req.body, req.user!);
        res.status(201).json({ success: true, data: product });
    },

    async updateProduct(req: Request, res: Response) {
        const id = req.params.id as string;
        const product = await productsService.updateProduct(id, req.body, req.user!);
        res.json({ success: true, data: product });
    },

    async deleteProduct(req: Request, res: Response) {
        const id = req.params.id as string;
        await productsService.deleteProduct(id, req.user!);
        res.json({ success: true, message: "Produto excluído" });
    },

    async toggleActive(req: Request, res: Response) {
        const id = req.params.id as string;
        const product = await productsService.toggleActive(id, req.user!);
        res.json({ success: true, data: product });
    },
};
