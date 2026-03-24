import { prisma } from "../../config/database.js";

// ═══════════════════════════════════════
// ProposalAI — Dev Project Settings Service
// ═══════════════════════════════════════

// ── Default data seeded on first load ──

const DEFAULT_PHASES = [
    { name: "Levantamento de Requisitos", checklist: ["Reunião inicial com cliente", "Mapeamento de funcionalidades", "Documento de requisitos (BRD)"] },
    { name: "Discovery e Design", checklist: ["Pesquisa de referências", "Wireframes aprovados", "Design System definido", "Protótipos de alta fidelidade"] },
    { name: "Desenvolvimento", checklist: ["Setup do repositório", "Ambiente de dev configurado", "Sprints planejados", "Code review em dia"] },
    { name: "Testes", checklist: ["Testes unitários", "Testes de integração", "Testes de usabilidade", "Relatório de bugs"] },
    { name: "Documentação", checklist: ["Documentação técnica", "Manual do usuário", "Guia de deploy"] },
    { name: "Entrega", checklist: ["Deploy em produção", "Treinamento do cliente", "Aceite formal assinado"] },
];

const DEFAULT_ROLES = [
    { name: "Gestor", permissions: ["Acesso total ao sistema", "Gerenciamento de equipe", "Relatórios gerenciais", "Configurações do projeto"] },
    { name: "Tech Lead", permissions: ["Projetos e tarefas", "Sprints e planning", "Code review", "Métricas técnicas"] },
    { name: "PO", permissions: ["Requisitos e backlogs", "Entregas e aceite", "Relatórios de progresso", "Comunicação com cliente"] },
    { name: "Dev", permissions: ["Tarefas atribuídas", "Board Kanban", "Bugs e correções", "Registro de horas"] },
    { name: "QA", permissions: ["Planos de teste", "Bugs e cobertura", "Relatórios de qualidade", "Automação de testes"] },
    { name: "Designer", permissions: ["Discovery e pesquisa", "Protótipos e mockups", "Entregas de design", "Design System"] },
];

const DEFAULT_AI_RULES = [
    { description: "Atraso > 3 dias ativa alerta de risco", threshold: 3, unit: "dias", enabled: true },
    { description: "Velocidade sprint < 80% da média ativa aviso", threshold: 80, unit: "%", enabled: true },
    { description: "Estimativa excedida em 50% gera notificação", threshold: 50, unit: "%", enabled: true },
    { description: "Fase sem entrega em 7 dias gera alerta", threshold: 7, unit: "dias", enabled: true },
];

class DevSettingsService {
    /** Get settings for the authenticated user — returns defaults if none saved */
    async getSettings(userId: string) {
        const settings = await prisma.devProjectSettings.findUnique({ where: { userId } });

        if (settings) return settings;

        // Return virtual defaults (not yet persisted)
        return {
            id: null,
            userId,
            phases: DEFAULT_PHASES,
            roles: DEFAULT_ROLES,
            aiRules: DEFAULT_AI_RULES,
            createdAt: null,
            updatedAt: null,
        };
    }

    /** Upsert settings for the authenticated user */
    async upsertSettings(userId: string, data: { phases?: any[]; roles?: any[]; aiRules?: any[] }) {
        return prisma.devProjectSettings.upsert({
            where: { userId },
            create: {
                userId,
                phases: data.phases ?? DEFAULT_PHASES,
                roles: data.roles ?? DEFAULT_ROLES,
                aiRules: data.aiRules ?? DEFAULT_AI_RULES,
            },
            update: {
                ...(data.phases !== undefined && { phases: data.phases }),
                ...(data.roles !== undefined && { roles: data.roles }),
                ...(data.aiRules !== undefined && { aiRules: data.aiRules }),
            },
        });
    }
}

export const devSettingsService = new DevSettingsService();
