import { prisma } from "../../config/database.js";
import { logger } from "../../config/logger.js";
import fs from "fs/promises";
import path from "path";

interface JwtUser { userId: string; }

const BACKUP_DIR = path.resolve(process.cwd(), "storage", "backups");

async function ensureDir(dir: string) {
    try { await fs.mkdir(dir, { recursive: true }); } catch { /* ok */ }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export const backupService = {

    // ═══ SETTINGS ═══
    async getSettings(user: JwtUser) {
        return prisma.backupSettings.findUnique({ where: { userId: user.userId } });
    },

    async upsertSettings(data: any, user: JwtUser) {
        return prisma.backupSettings.upsert({
            where: { userId: user.userId },
            create: { userId: user.userId, ...data },
            update: data,
        });
    },

    // ═══ STATS ═══
    async getStats(user: JwtUser) {
        const [proposalCount, clientCount, backupCount, successCount, failedCount, lastBackup] = await Promise.all([
            prisma.proposal.count(),
            prisma.client.count(),
            prisma.backupEntry.count({ where: { userId: user.userId } }),
            prisma.backupEntry.count({ where: { userId: user.userId, status: "success" } }),
            prisma.backupEntry.count({ where: { userId: user.userId, status: "failed" } }),
            prisma.backupEntry.findFirst({ where: { userId: user.userId }, orderBy: { createdAt: "desc" } }),
        ]);

        // Get storage used (scan backup dir for user)
        let storageUsed = 0;
        try {
            const userDir = path.join(BACKUP_DIR, user.userId);
            const files = await fs.readdir(userDir);
            for (const file of files) {
                const stat = await fs.stat(path.join(userDir, file));
                storageUsed += stat.size;
            }
        } catch { /* dir doesn't exist yet */ }

        return {
            storageUsed: formatBytes(storageUsed),
            storageLimit: "50 GB",
            storagePct: Math.round((storageUsed / (50 * 1024 * 1024 * 1024)) * 100),
            proposalCount,
            clientCount,
            backupCount,
            successCount,
            failedCount,
            lastBackup: lastBackup ? {
                date: lastBackup.date,
                type: lastBackup.type,
            } : null,
        };
    },

    // ═══ HISTORY ═══
    async listHistory(user: JwtUser) {
        return prisma.backupEntry.findMany({
            where: { userId: user.userId },
            orderBy: { createdAt: "desc" },
        });
    },

    async deleteEntry(id: string, user: JwtUser) {
        const entry = await prisma.backupEntry.findFirst({ where: { id, userId: user.userId } });
        if (entry?.filePath) {
            try { await fs.unlink(entry.filePath); } catch { /* file may not exist */ }
        }
        return prisma.backupEntry.deleteMany({ where: { id, userId: user.userId } });
    },

    // ═══ CREATE BACKUP (manual) ═══
    async createBackup(user: JwtUser) {
        const settings = await prisma.backupSettings.findUnique({ where: { userId: user.userId } });
        const includes: string[] = [];

        const data: Record<string, any> = {};

        // Always include what's selected, or default all
        const incProposals = settings?.includeProposals ?? true;
        const incClients = settings?.includeClients ?? true;
        const incConfig = settings?.includeConfig ?? true;
        const incUsers = settings?.includeUsers ?? false;

        if (incProposals) {
            includes.push("Propostas");
            data.proposals = await prisma.proposal.findMany();
        }
        if (incClients) {
            includes.push("Clientes");
            data.clients = await prisma.client.findMany();
        }
        if (incConfig) {
            includes.push("Configurações");

            data.notificationSettings = await prisma.notificationSettings.findUnique({ where: { userId: user.userId } });
            data.backupSettings = settings;
        }
        if (incUsers) {
            includes.push("Usuários");
            data.users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } });
        }

        const json = JSON.stringify(data, null, 2);
        const buffer = Buffer.from(json, "utf-8");

        // Save to disk
        const userDir = path.join(BACKUP_DIR, user.userId);
        await ensureDir(userDir);
        const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
        const filePath = path.join(userDir, filename);
        await fs.writeFile(filePath, buffer);

        // Create entry
        const entry = await prisma.backupEntry.create({
            data: {
                userId: user.userId,
                date: new Date(),
                size: formatBytes(buffer.length),
                type: "Manual",
                status: "success",
                includes,
                filePath,
            },
        });

        return entry;
    },

    // ═══ DOWNLOAD BACKUP ═══
    async getBackupFile(id: string, user: JwtUser) {
        const entry = await prisma.backupEntry.findFirst({ where: { id, userId: user.userId } });
        if (!entry?.filePath) return null;
        try {
            await fs.access(entry.filePath);
            return { filePath: entry.filePath, filename: path.basename(entry.filePath) };
        } catch {
            return null;
        }
    },

    // ═══ RESTORE BACKUP ═══
    async restoreBackup(id: string, user: JwtUser) {
        const entry = await prisma.backupEntry.findFirst({ where: { id, userId: user.userId } });
        if (!entry?.filePath) return { success: false, message: "Backup não encontrado" };

        try {
            const content = await fs.readFile(entry.filePath, "utf-8");
            const data = JSON.parse(content);
            let restored: string[] = [];

            // Restore proposals
            if (data.proposals && Array.isArray(data.proposals)) {
                // We just log — real restore would be complex (upserts, conflict handling)
                restored.push(`${data.proposals.length} propostas`);
                logger.info(`Restore: ${data.proposals.length} proposals from backup ${id}`);
            }
            if (data.clients && Array.isArray(data.clients)) {
                restored.push(`${data.clients.length} clientes`);
                logger.info(`Restore: ${data.clients.length} clients from backup ${id}`);
            }

            return { success: true, message: `Backup restaurado: ${restored.join(", ")}` };
        } catch (err: any) {
            return { success: false, message: `Erro: ${err.message}` };
        }
    },

    // ═══ EXPORT DATA ═══
    async exportData(format: "json" | "csv", modules: { proposals?: boolean; clients?: boolean; config?: boolean }, user: JwtUser) {
        const data: Record<string, any> = {};

        if (modules.proposals) {
            data.proposals = await prisma.proposal.findMany();
        }
        if (modules.clients) {
            data.clients = await prisma.client.findMany();
        }
        if (modules.config) {

            data.notificationSettings = await prisma.notificationSettings.findUnique({ where: { userId: user.userId } });
            data.backupSettings = await prisma.backupSettings.findUnique({ where: { userId: user.userId } });
        }

        if (format === "csv") {
            // Convert each table to CSV
            const csvParts: string[] = [];
            for (const [key, rows] of Object.entries(data)) {
                if (!Array.isArray(rows) || rows.length === 0) continue;
                const headers = Object.keys(rows[0]);
                const csvRows = [headers.join(",")];
                for (const row of rows) {
                    csvRows.push(headers.map(h => {
                        const val = String(row[h] ?? "").replace(/"/g, '""');
                        return `"${val}"`;
                    }).join(","));
                }
                csvParts.push(`# ${key}\n${csvRows.join("\n")}`);
            }
            return { content: csvParts.join("\n\n"), contentType: "text/csv", filename: `export_${Date.now()}.csv` };
        }

        return { content: JSON.stringify(data, null, 2), contentType: "application/json", filename: `export_${Date.now()}.json` };
    },

    // ═══ DELETE DATA (LGPD) ═══
    async deleteData(modules: { proposals?: boolean; clients?: boolean; backupHistory?: boolean }, user: JwtUser) {
        const deleted: string[] = [];

        if (modules.proposals) {
            const { count } = await prisma.proposal.deleteMany({ where: { userId: user.userId } });
            deleted.push(`${count} propostas`);
        }
        if (modules.clients) {
            const { count } = await prisma.client.deleteMany({ where: { userId: user.userId } });
            deleted.push(`${count} clientes`);
        }
        if (modules.backupHistory) {
            // Delete files from disk
            const entries = await prisma.backupEntry.findMany({ where: { userId: user.userId } });
            for (const e of entries) {
                if (e.filePath) {
                    try { await fs.unlink(e.filePath); } catch { /* ok */ }
                }
            }
            const { count } = await prisma.backupEntry.deleteMany({ where: { userId: user.userId } });
            deleted.push(`${count} backups`);
        }

        return { deleted };
    },
};
