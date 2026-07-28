// @ts-nocheck
import { prisma } from "../../config/database.js";
import { logger } from "../../config/logger.js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

// Helper: parse a YYYY-MM-DD string as UTC midnight so the stored date
// always matches the day chosen by the user, regardless of server timezone.
function parseDateInput(dateValue: string | Date): Date {
    if (dateValue instanceof Date) return new Date(Date.UTC(dateValue.getUTCFullYear(), dateValue.getUTCMonth(), dateValue.getUTCDate()));
    if (typeof dateValue !== "string" || !dateValue) return new Date(NaN);
    const [year, month, day] = dateValue.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

export interface TransactionCreateInput {
    description: string;
    client: string;
    value: number;
    typeGroup: string;
    category: string;
    date: string; // ISO String or YYYY-MM-DD
    dueDate: string; // ISO String or YYYY-MM-DD
    status?: string;
    account?: string;
    paymentMethod?: string;
    costCenter?: string;
    notes?: string;
    
    // Installment options
    isInstallment?: boolean;
    installmentsCount?: number;
    installmentInterval?: "Semanal" | "Quinzenal" | "Mensal" | "Bimestral" | "Trimestral" | "Semestral" | "Anual";
    
    // Recurrence options
    isRecurrence?: boolean;
    recurrenceFreq?: "Semanal" | "Mensal" | "Bimestral" | "Trimestral" | "Semestral" | "Anual";
    recurrenceMonths?: number;
}

export const transactionsService = {
    // ═══ List Transactions ═══
    async list(
        query: {
            month?: string;
            year?: string;
            typeGroup?: string;
            category?: string;
            search?: string;
        },
        user: { userId: string }
    ) {
        const { month, year, typeGroup, category, search } = query;
        const whereClause: any = {};

        // Filter by due date range (month & year) — uses UTC boundaries
        if (month && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const startDate = new Date(Date.UTC(y, m - 1, 1));
            const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
            whereClause.dueDate = {
                gte: startDate,
                lte: endDate,
            };
        } else if (year) {
            const y = parseInt(year, 10);
            const startDate = new Date(Date.UTC(y, 0, 1));
            const endDate = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));
            whereClause.dueDate = {
                gte: startDate,
                lte: endDate,
            };
        }

        if (typeGroup && typeGroup !== "Todas") {
            whereClause.typeGroup = typeGroup;
        }

        if (category) {
            whereClause.category = category;
        }

        if (search) {
            whereClause.OR = [
                { description: { contains: search, mode: "insensitive" } },
                { client: { contains: search, mode: "insensitive" } },
            ];
        }

        const list = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                files: {
                    select: {
                        id: true,
                        originalName: true,
                        mimeType: true,
                        size: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: {
                date: "desc",
            },
        });

        return list;
    },

    // ═══ Get Transaction by ID ═══
    async getById(id: string, user: { userId: string }) {
        const tx = await prisma.transaction.findUnique({
            where: { id },
            include: {
                files: {
                    select: {
                        id: true,
                        originalName: true,
                        mimeType: true,
                        size: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!tx) {
            throw new Error("Transação não encontrada.");
        }

        return tx;
    },

    // ═══ Create Transaction ═══
    async create(input: TransactionCreateInput, user: { userId: string }) {
        const {
            description,
            client,
            value,
            typeGroup,
            category,
            date,
            dueDate,
            status = "Previsto",
            account = "Conta Principal",
            paymentMethod = "PIX",
            costCenter = "Comercial",
            notes,
            isInstallment,
            installmentsCount = 1,
            installmentInterval = "Mensal",
            isRecurrence,
            recurrenceFreq = "Mensal",
            recurrenceMonths,
        } = input;

        const baseDate = parseDateInput(date);
        const baseDueDate = parseDateInput(dueDate);

        // 1. Handle Installments (Parcelamento)
        if (isInstallment && installmentsCount > 1) {
            const parentId = crypto.randomUUID();
            const installmentValue = value / installmentsCount;
            const createdTxList = [];

            for (let i = 0; i < installmentsCount; i++) {
                const txDate = this.calculateNextDate(baseDate, installmentInterval, i);
                const txDueDate = this.calculateNextDate(baseDueDate, installmentInterval, i);

                const tx = await prisma.transaction.create({
                    data: {
                        userId: user.userId,
                        description: `${description} (${i + 1}/${installmentsCount})`,
                        client,
                        value: installmentValue,
                        typeGroup,
                        category,
                        date: txDate,
                        dueDate: txDueDate,
                        status,
                        account,
                        paymentMethod,
                        costCenter,
                        notes,
                        installment: `${i + 1}/${installmentsCount}`,
                        parentId,
                    },
                });
                createdTxList.push(tx);
            }
            return createdTxList[0]; // Return the first one
        }

        // 2. Handle Recurrence (Recorrência)
        if (isRecurrence) {
            const parentId = crypto.randomUUID();
            const createdTxList = [];
            const monthsToAdd = recurrenceMonths && recurrenceMonths > 0 ? recurrenceMonths : 12;
            const limitDate = this.calculateNextDate(baseDueDate, "Mensal", monthsToAdd);
            
            // Limit to max 24 occurrences to prevent infinite loops
            const maxOccurrences = 24;
            let currentOccurrence = 0;
            let currentDueDate = new Date(baseDueDate);
            let currentDate = new Date(baseDate);

            while (currentDueDate < limitDate && currentOccurrence < maxOccurrences) {
                const tx = await prisma.transaction.create({
                    data: {
                        userId: user.userId,
                        description: currentOccurrence > 0 ? `${description} (Recorrência #${currentOccurrence + 1})` : description,
                        client,
                        value,
                        typeGroup,
                        category,
                        date: new Date(currentDate),
                        dueDate: new Date(currentDueDate),
                        status,
                        account,
                        paymentMethod,
                        costCenter,
                        notes,
                        parentId,
                    },
                });
                createdTxList.push(tx);

                currentOccurrence++;
                currentDate = this.calculateNextDate(baseDate, recurrenceFreq, currentOccurrence);
                currentDueDate = this.calculateNextDate(baseDueDate, recurrenceFreq, currentOccurrence);
            }
            return createdTxList[0];
        }

        // 3. Simple Single Transaction
        const tx = await prisma.transaction.create({
            data: {
                userId: user.userId,
                description,
                client,
                value,
                typeGroup,
                category,
                date: baseDate,
                dueDate: baseDueDate,
                status,
                account,
                paymentMethod,
                costCenter,
                notes,
            },
        });
        return tx;
    },

    // Helper to calculate date step based on frequency/interval (UTC-safe)
    calculateNextDate(base: Date, interval: string, index: number): Date {
        const next = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
        switch (interval) {
            case "Semanal":
                next.setUTCDate(next.getUTCDate() + index * 7);
                break;
            case "Quinzenal":
                next.setUTCDate(next.getUTCDate() + index * 15);
                break;
            case "Mensal":
                next.setUTCMonth(next.getUTCMonth() + index);
                break;
            case "Bimestral":
                next.setUTCMonth(next.getUTCMonth() + index * 2);
                break;
            case "Trimestral":
                next.setUTCMonth(next.getUTCMonth() + index * 3);
                break;
            case "Semestral":
                next.setUTCMonth(next.getUTCMonth() + index * 6);
                break;
            case "Anual":
                next.setUTCFullYear(next.getUTCFullYear() + index);
                break;
            default:
                next.setUTCMonth(next.getUTCMonth() + index);
        }
        return next;
    },

    // Helper: add months to a UTC date
    addMonths(base: Date, months: number): Date {
        const next = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
        next.setUTCMonth(next.getUTCMonth() + months);
        return next;
    },

    // ═══ Update Transaction ═══
    async update(id: string, body: any, user: { userId: string }) {
        const dataToUpdate: any = {};
        const allowedFields = ["description", "client", "value", "typeGroup", "category", "date", "dueDate", "status", "pendency", "account", "paymentMethod", "costCenter", "notes"];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === "date" || field === "dueDate") {
                    dataToUpdate[field] = parseDateInput(body[field]);
                } else if (field === "value") {
                    dataToUpdate[field] = parseFloat(body[field]);
                } else if (field === "pendency") {
                    dataToUpdate[field] = Boolean(body[field]);
                } else {
                    dataToUpdate[field] = body[field];
                }
            }
        }

        const scope = body.scope; // "this" | "future" | "all"
        const targetTx = await prisma.transaction.findUnique({ where: { id } });
        if (!targetTx) {
            throw new Error("Transação não encontrada.");
        }

        // Apply scoped update for recurring/installment transactions when requested
        if (scope && targetTx.parentId && ["future", "all"].includes(scope)) {
            // Financial transactions are shared org-wide (list() does not filter by userId),
            // so scope the series by parentId only — filtering by the editor's userId would
            // exclude series created by another user and throw "base não encontrada no grupo".
            const whereClause: any = {
                parentId: targetTx.parentId,
            };
            if (scope === "future") {
                whereClause.date = { gte: targetTx.date };
            }

            // Remove id-specific fields from batch update
            delete dataToUpdate.id;

            const shouldRecalculateDates = dataToUpdate.date || dataToUpdate.dueDate;

            if (shouldRecalculateDates) {
                // Recalculate dates for affected transactions preserving monthly spacing
                const related = await prisma.transaction.findMany({
                    where: whereClause,
                    orderBy: { date: "asc" },
                });

                const targetIndex = related.findIndex((r) => r.id === id);
                if (targetIndex === -1) {
                    throw new Error("Transação base não encontrada no grupo.");
                }

                const newBaseDate = dataToUpdate.date ? new Date(dataToUpdate.date) : new Date(targetTx.date);
                const newBaseDueDate = dataToUpdate.dueDate ? new Date(dataToUpdate.dueDate) : new Date(targetTx.dueDate);

                for (const relatedTx of related) {
                    const relatedIndex = related.findIndex((r) => r.id === relatedTx.id);
                    const monthOffset = relatedIndex - targetIndex;

                    const updateData: any = { ...dataToUpdate };
                    if (dataToUpdate.date) {
                        updateData.date = this.addMonths(newBaseDate, monthOffset);
                    }
                    if (dataToUpdate.dueDate) {
                        updateData.dueDate = this.addMonths(newBaseDueDate, monthOffset);
                    }

                    await prisma.transaction.update({
                        where: { id: relatedTx.id },
                        data: updateData,
                    });
                }
                return prisma.transaction.findUnique({ where: { id } });
            }

            await prisma.transaction.updateMany({
                where: whereClause,
                data: dataToUpdate,
            });
            return prisma.transaction.findUnique({ where: { id } });
        }

        const tx = await prisma.transaction.update({
            where: { id },
            data: dataToUpdate,
        });

        return tx;
    },

    // ═══ Delete Transaction ═══
    async delete(id: string, user: { userId: string }, scope: "this" | "future" | "all" = "this") {
        const targetTx = await prisma.transaction.findUnique({
            where: { id },
            include: { files: true },
        });

        if (!targetTx) {
            throw new Error("Transação não encontrada.");
        }

        let idsToDelete: string[] = [id];

        if (scope !== "this" && targetTx.parentId) {
            // Shared org-wide series: scope by parentId only (see update() note).
            const whereClause: any = {
                parentId: targetTx.parentId,
            };
            if (scope === "future") {
                whereClause.date = { gte: targetTx.date };
            }
            const related = await prisma.transaction.findMany({
                where: whereClause,
                select: { id: true },
            });
            idsToDelete = related.map(r => r.id);
        }

        // Find attachments to clean up physical files
        const files = await prisma.transactionFile.findMany({
            where: { transactionId: { in: idsToDelete } },
        });

        for (const file of files) {
            const filePath = path.resolve(process.cwd(), "uploads", "transaction-attachments", file.storedName);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                logger.warn(`Failed to delete transaction file ${filePath}:`, err);
            }
        }

        // Delete from database
        await prisma.transaction.deleteMany({
            where: { id: { in: idsToDelete } },
        });

        return true;
    },

    // ═══ Batch Actions ═══
    async batchPay(ids: string[], user: { userId: string }) {
        await prisma.transaction.updateMany({
            where: { id: { in: ids } },
            // Paying resolves an eventual pendency flag so the row re-enters the forecast
            data: { status: "Pago", pendency: false },
        });
        return true;
    },

    async batchDelete(ids: string[], user: { userId: string }) {
        // Clean up all physical files associated with these transactions
        const files = await prisma.transactionFile.findMany({
            where: { transactionId: { in: ids } },
        });

        for (const file of files) {
            const filePath = path.resolve(process.cwd(), "uploads", "transaction-attachments", file.storedName);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                logger.warn(`Failed to delete batch file ${filePath}:`, err);
            }
        }

        await prisma.transaction.deleteMany({
            where: { id: { in: ids } },
        });
        return true;
    },

    // ═══ Attachments Management ═══
    async addAttachment(
        transactionId: string,
        file: Express.Multer.File,
        user: { userId: string }
    ) {
        const txFile = await prisma.transactionFile.create({
            data: {
                transactionId,
                userId: user.userId,
                originalName: file.originalname,
                storedName: file.filename,
                mimeType: file.mimetype,
                size: file.size,
            },
        });
        return txFile;
    },

    async getAttachment(transactionId: string, fileId: string, user: { userId: string }) {
        const file = await prisma.transactionFile.findFirst({
            where: { id: fileId, transactionId },
        });

        if (!file) return null;

        const filePath = path.resolve(process.cwd(), "uploads", "transaction-attachments", file.storedName);
        return {
            filePath,
            filename: file.originalName,
            mimeType: file.mimeType,
        };
    },

    async deleteAttachment(transactionId: string, fileId: string, user: { userId: string }) {
        const file = await prisma.transactionFile.findFirst({
            where: { id: fileId, transactionId },
        });

        if (!file) return false;

        const filePath = path.resolve(process.cwd(), "uploads", "transaction-attachments", file.storedName);
        try {
            await fs.unlink(filePath);
        } catch (err) {
            logger.warn(`Failed to delete file from disk ${filePath}:`, err);
        }

        await prisma.transactionFile.delete({
            where: { id: fileId },
        });

        return true;
    },
};
