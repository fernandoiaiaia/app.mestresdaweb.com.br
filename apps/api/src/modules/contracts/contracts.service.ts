import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type User = { userId: string; role: string };

export const contractsService = {
    async createContract(data: any, user: User) {
        // Gera número do contrato
        const count = await prisma.contract.count();
        const year = new Date().getFullYear();
        const number = `${year}.${String(count + 1).padStart(3, "0")}`;

        const contract = await prisma.contract.create({
            data: {
                number,
                contractorName: data.contractorName,
                contractorDocument: data.contractorDocument,
                contractedName: data.contractedName,
                contractedDocument: data.contractedDocument,
                objectDescription: data.objectDescription || "",
                value: data.value,
                paymentMethod: data.paymentMethod,
                firstDueDate: data.firstDueDate ? new Date(data.firstDueDate) : null,
                signingDeadline: data.signingDeadline ? new Date(data.signingDeadline) : null,
                templateId: data.templateId,
                emailTemplate: data.emailTemplate,
                dealId: data.dealId,
                signers: {
                    create: data.signers?.map((s: any) => ({
                        name: s.name,
                        email: s.email,
                        role: s.role,
                        status: "pending"
                    })) || []
                },
                installments: {
                    create: data.installmentsList?.map((i: any) => ({
                        dueDate: new Date(i.dueDate),
                        value: i.value
                    })) || []
                }
            },
            include: { signers: true, installments: true }
        });

        return contract;
    },

    async listContracts(page: number, limit: number, search?: string) {
        const where: any = {};
        
        if (search) {
            where.OR = [
                { number: { contains: search, mode: "insensitive" } },
                { contractorName: { contains: search, mode: "insensitive" } },
                { contractorDocument: { contains: search, mode: "insensitive" } },
                { objectDescription: { contains: search, mode: "insensitive" } }
            ];
        }

        const [total, data] = await Promise.all([
            prisma.contract.count({ where }),
            prisma.contract.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { number: "desc" },
                include: { signers: true }
            })
        ]);

        return {
            data,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                current: page
            }
        };
    },

    async getStats() {
        // Obter inícios e finais de mês
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const [total, signing, signedThisMonth, totalValue] = await Promise.all([
            prisma.contract.count(),
            prisma.contract.count({ where: { status: 'signing' } }),
            prisma.contract.count({
                where: {
                    status: 'signed',
                    // Assuming there's a way to know when it was signed, but schema doesn't have signedAt.
                    // We'll use the absence of signedAt to just return all signed for now, or assume it's signingDeadline based logic for now.
                }
            }),
            prisma.contract.aggregate({
                _sum: { value: true }
            })
        ]);

        return {
            total,
            signing,
            signedThisMonth,
            totalValue: totalValue._sum.value || 0
        };
    },

    async searchDeals(query: string) {
        if (!query || query.length < 2) return [];
        
        return await prisma.deal.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                ]
            },
            select: {
                id: true,
                title: true,
                value: true,
            },
            take: 10
        });
    },

    async addAttachment(contractId: string, file: Express.Multer.File, user: User) {
        const fileUrl = `/uploads/${file.filename}`;
        
        const attachment = await prisma.contractAttachment.create({
            data: {
                contractId,
                fileName: file.originalname,
                fileUrl
            }
        });
        
        return attachment;
    }
};
