import { prisma } from "../../config/database.js";

interface JwtUser { userId: string; }

export const activityService = {

    // ═══ LIST LOGS ═══
    async listLogs(query: {
        search?: string;
        category?: string;
        userName?: string;
        limit?: number;
        offset?: number;
    }) {
        const where: any = {};

        if (query.category && query.category !== "all") {
            where.category = query.category;
        }
        if (query.userName && query.userName !== "all") {
            where.userName = query.userName;
        }
        if (query.search) {
            where.OR = [
                { action: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
            ];
        }

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: query.limit || 100,
                skip: query.offset || 0,
            }),
            prisma.activityLog.count({ where }),
        ]);

        return { logs, total };
    },

    // ═══ GET STATS ═══
    async getStats() {
        const [proposal, auth, settings, client, system, total] = await Promise.all([
            prisma.activityLog.count({ where: { category: "proposal" } }),
            prisma.activityLog.count({ where: { category: "auth" } }),
            prisma.activityLog.count({ where: { category: "settings" } }),
            prisma.activityLog.count({ where: { category: "client" } }),
            prisma.activityLog.count({ where: { category: "system" } }),
            prisma.activityLog.count(),
        ]);
        return { proposal, auth, settings, client, system, total };
    },

    // ═══ GET UNIQUE USERS ═══
    async getUsers() {
        const raw = await prisma.activityLog.findMany({
            select: { userName: true },
            distinct: ["userName"],
            orderBy: { userName: "asc" },
        });
        return raw.map(r => r.userName);
    },

    // ═══ LOG AN ACTION (utility for other modules) ═══
    async log(data: {
        userId?: string;
        action: string;
        description: string;
        userName?: string;
        userRole?: string;
        target?: string;
        category?: string;
        ip?: string;
    }) {
        return prisma.activityLog.create({
            data: {
                userId: data.userId || null,
                action: data.action,
                description: data.description,
                userName: data.userName || "Sistema",
                userRole: data.userRole || "Sistema",
                target: data.target || "",
                category: data.category || "system",
                ip: data.ip || "",
            },
        });
    },

    // ═══ EXPORT LOGS (CSV) ═══
    async exportLogs(query: { category?: string; userName?: string }) {
        const where: any = {};
        if (query.category && query.category !== "all") where.category = query.category;
        if (query.userName && query.userName !== "all") where.userName = query.userName;

        const logs = await prisma.activityLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        const headers = ["Data", "Ação", "Descrição", "Usuário", "Cargo", "Alvo", "Categoria", "IP"];
        const rows = logs.map(l => [
            new Date(l.createdAt).toLocaleString("pt-BR"),
            l.action,
            l.description,
            l.userName,
            l.userRole,
            l.target,
            l.category,
            l.ip,
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

        return [headers.join(","), ...rows].join("\n");
    },

    // ═══ SEED INITIAL LOGS (for demo) ═══
    async seedIfEmpty(userId: string) {
        const count = await prisma.activityLog.count();
        if (count > 0) return;

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, role: true } });
        const name = user?.name || "Admin";
        const role = user?.role || "OWNER";

        const logs = [
            { action: "Proposta Aprovada", description: "Gestor aprovou a proposta 'Plataforma SaaS de Gestão' v2.1", userName: name, userRole: "Gestor", target: "Proposta #1042", category: "proposal", ip: "189.34.xxx.xxx" },
            { action: "Proposta Enviada", description: "Proposta 'App de Delivery' enviada para ana@foodtech.com.br", userName: "Maria Santos", userRole: "Consultor", target: "Proposta #1041", category: "proposal", ip: "189.34.xxx.xxx" },
            { action: "Login Realizado", description: "Acesso ao sistema via Chrome / MacOS", userName: "João Silva", userRole: "Consultor", target: "Sistema", category: "auth", ip: "189.34.xxx.xxx" },
            { action: "Comentário do Cliente", description: "Cliente adicionou comentário na seção 'Dashboard' da proposta", userName: "Fernando Costa", userRole: "Cliente", target: "Proposta #1042", category: "client", ip: "177.22.xxx.xxx" },
            { action: "Proposta Criada", description: "Nova proposta 'ERP Industrial com IoT' criada via IA", userName: "João Silva", userRole: "Consultor", target: "Proposta #1043", category: "proposal", ip: "189.34.xxx.xxx" },
            { action: "Configuração Alterada", description: "Valor-hora de 'Desenvolvedor Backend Sênior' alterado: R$180 → R$200", userName: name, userRole: "Gestor", target: "Configurações", category: "settings", ip: "189.34.xxx.xxx" },
            { action: "Tentativa de Login Falhou", description: "2 tentativas de login falharam para o e-mail admin@mestres.com", userName: "Desconhecido", userRole: "N/A", target: "Sistema", category: "auth", ip: "45.67.xxx.xxx" },
            { action: "Usuário Cadastrado", description: "Novo consultor 'Roberta Alves' cadastrado no sistema", userName: name, userRole: "Gestor", target: "Usuários", category: "settings", ip: "189.34.xxx.xxx" },
            { action: "Proposta Rejeitada", description: "Gestor rejeitou proposta 'Portal Clínica Vida' — escopo insuficiente", userName: name, userRole: "Gestor", target: "Proposta #1039", category: "proposal", ip: "189.34.xxx.xxx" },
            { action: "Proposta Aprovada pelo Cliente", description: "Cliente aprovou proposta 'App Marketplace' com assinatura digital", userName: "Julia Santos", userRole: "Cliente", target: "Proposta #1038", category: "client", ip: "200.150.xxx.xxx" },
            { action: "PDF Exportado", description: "PDF da proposta 'E-commerce B2B' baixado pelo consultor", userName: "Maria Santos", userRole: "Consultor", target: "Proposta #1037", category: "proposal", ip: "189.34.xxx.xxx" },
            { action: "Integração Conectada", description: "Google Calendar integrado com sucesso", userName: name, userRole: "Gestor", target: "Integrações", category: "system", ip: "189.34.xxx.xxx" },
        ];

        // Spread them across last few days
        const now = Date.now();
        for (let i = 0; i < logs.length; i++) {
            const daysAgo = Math.floor(i / 3);
            const hoursAgo = (i % 3) * 3 + Math.floor(Math.random() * 3);
            const date = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000);
            await prisma.activityLog.create({
                data: {
                    userId,
                    ...logs[i],
                    createdAt: date,
                },
            });
        }
    },
};
