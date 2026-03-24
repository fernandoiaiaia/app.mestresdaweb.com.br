import { prisma } from "../../config/database.js";

interface JwtUser {
    userId: string;
    role: string;
}

export const productsService = {
    // ═══ Categories ═══

    async listCategories(user: JwtUser) {
        return prisma.productCategory.findMany({
            where: { userId: user.userId },
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { createdAt: "asc" },
        });
    },

    async createCategory(data: { name: string; color?: string }, user: JwtUser) {
        return prisma.productCategory.create({
            data: {
                name: data.name,
                color: data.color || "#3b82f6",
                userId: user.userId,
            },
        });
    },

    async updateCategory(id: string, data: { name?: string; color?: string }, user: JwtUser) {
        return prisma.productCategory.update({
            where: { id, userId: user.userId },
            data,
        });
    },

    async deleteCategory(id: string, user: JwtUser) {
        const fallback = await prisma.productCategory.findFirst({
            where: { userId: user.userId, id: { not: id } },
        });

        if (fallback) {
            await prisma.product.updateMany({
                where: { categoryId: id, userId: user.userId },
                data: { categoryId: fallback.id },
            });
        }

        return prisma.productCategory.delete({
            where: { id, userId: user.userId },
        });
    },

    // ═══ Products ═══

    async listProducts(user: JwtUser) {
        return prisma.product.findMany({
            where: { userId: user.userId },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy: { usageCount: "desc" },
        });
    },

    async getProduct(id: string, user: JwtUser) {
        return prisma.product.findFirst({
            where: { id, userId: user.userId },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        });
    },

    async createProduct(data: any, user: JwtUser) {
        return prisma.product.create({
            data: {
                name: data.name,
                internalCode: data.internalCode || null,
                description: data.description || null,
                detailedDescription: data.detailedDescription || null,
                type: data.type || "servico",
                categoryId: data.categoryId,
                priceMin: data.priceMin || 0,
                priceMax: data.priceMax || 0,
                billingModel: data.billingModel || "unico",
                setupFee: data.setupFee || 0,
                marginPercent: data.marginPercent || 0,
                discountMax: data.discountMax || 0,
                warrantyMonths: data.warrantyMonths ?? 3,
                complexity: data.complexity || "medium",
                estimatedHours: data.estimatedHours || null,
                slaResponse: data.slaResponse || null,
                slaResolution: data.slaResolution || null,
                deliverables: data.deliverables || [],
                techStack: data.techStack || [],
                active: data.active ?? true,
                showInProposals: data.showInProposals ?? true,
                featured: data.featured ?? false,
                userId: user.userId,
            },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        });
    },

    async updateProduct(id: string, data: any, user: JwtUser) {
        return prisma.product.update({
            where: { id, userId: user.userId },
            data,
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        });
    },

    async deleteProduct(id: string, user: JwtUser) {
        return prisma.product.delete({
            where: { id, userId: user.userId },
        });
    },

    async toggleActive(id: string, user: JwtUser) {
        const product = await prisma.product.findFirst({
            where: { id, userId: user.userId },
        });
        if (!product) throw new Error("Produto não encontrado");

        return prisma.product.update({
            where: { id, userId: user.userId },
            data: { active: !product.active },
            include: {
                category: {
                    select: { id: true, name: true, color: true },
                },
            },
        });
    },
};
