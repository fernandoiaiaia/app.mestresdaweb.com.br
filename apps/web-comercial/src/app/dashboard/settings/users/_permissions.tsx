"use client";

import {
    Home,
    Users,
    Kanban,
    Target,
    CheckSquare,
    Package,
    MessageSquare,
    BarChart3,
    Clock,
    Shield,
    Bell,
    Settings,
    PlusCircle,
    Filter,
    Tag,
    Wallet,
    Megaphone,
    Tags,
    FileText,
    Database,
    Landmark,
    Key,
    FileDown,
    Trophy,
    FolderKanban,
    ListTodo,
    Bug,
    Code2,
    Zap,
    TrendingUp,
    CreditCard,
    Calendar,
    Receipt,
    DollarSign,
    PieChart,
    PiggyBank,
    Building2,
    UserCircle,
    Link2,
    Layers,
} from "lucide-react";

export type DataScope = "OWN" | "ALL";

export interface PermissionDef {
    module: string;
    action: string;
    label: string;
    hasDataScope?: boolean;
}

export interface ModuleGroup {
    section: string;
    sectionIcon: React.ReactNode;
    sectionColor: string;
    modules: {
        name: string;
        icon: React.ReactNode;
        permissions: PermissionDef[];
    }[];
}

/* ═══════════════════════════════════════ */
/* GROWTH (Commercial) Permissions         */
/* ═══════════════════════════════════════ */
export const GROWTH_PERMISSIONS: ModuleGroup[] = [
    {
        section: "Principal",
        sectionIcon: <Home size={16} />,
        sectionColor: "text-blue-400",
        modules: [
            {
                name: "Dashboard",
                icon: <Home size={16} />,
                permissions: [
                    { module: "dashboard", action: "view", label: "Visualizar", hasDataScope: true },
                ],
            },
        ],
    },
    {
        section: "CRM",
        sectionIcon: <Users size={16} />,
        sectionColor: "text-blue-400",
        modules: [
            {
                name: "Clientes",
                icon: <Users size={16} />,
                permissions: [
                    { module: "crm.clients", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.clients", action: "create", label: "Criar" },
                    { module: "crm.clients", action: "edit", label: "Editar" },
                    { module: "crm.clients", action: "delete", label: "Excluir" },
                ],
            },
            {
                name: "Pipeline",
                icon: <Kanban size={16} />,
                permissions: [
                    { module: "crm.pipeline", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.pipeline", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Fluxo de Cadência",
                icon: <Zap size={16} />,
                permissions: [
                    { module: "crm.cadence", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.cadence", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Oportunidades",
                icon: <Target size={16} />,
                permissions: [
                    { module: "crm.opportunities", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.opportunities", action: "create", label: "Criar" },
                    { module: "crm.opportunities", action: "edit", label: "Editar" },
                ],
            },
            {
                name: "Tarefas",
                icon: <CheckSquare size={16} />,
                permissions: [
                    { module: "crm.tasks", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.tasks", action: "create", label: "Criar" },
                    { module: "crm.tasks", action: "edit", label: "Editar" },
                    { module: "crm.tasks", action: "delete", label: "Excluir" },
                ],
            },
        ],
    },
    {
        section: "Montador de Proposta",
        sectionIcon: <Package size={16} />,
        sectionColor: "text-purple-400",
        modules: [
            {
                name: "Montador de Proposta",
                icon: <Package size={16} />,
                permissions: [
                    { module: "crm.proposals", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.proposals", action: "create", label: "Criar" },
                    { module: "crm.proposals", action: "edit", label: "Editar" },
                    { module: "crm.proposals", action: "delete", label: "Excluir" },
                    { module: "crm.proposals", action: "mark_paid", label: "Marcar como Pago" },
                ],
            },
        ],
    },
    {
        section: "WhatsApp Web",
        sectionIcon: <MessageSquare size={16} />,
        sectionColor: "text-green-500",
        modules: [
            {
                name: "WhatsApp Web",
                icon: <MessageSquare size={16} />,
                permissions: [
                    { module: "crm.whatsapp", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "crm.whatsapp", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Chatbot",
                icon: <Code2 size={16} />,
                permissions: [
                    { module: "crm.whatsapp.chatbot", action: "view", label: "Visualizar" },
                    { module: "crm.whatsapp.chatbot", action: "manage", label: "Gerenciar" },
                ],
            },
        ],
    },
    {
        section: "Gestão",
        sectionIcon: <BarChart3 size={16} />,
        sectionColor: "text-amber-400",
        modules: [
            {
                name: "Fila de Aprovação",
                icon: <CheckSquare size={16} />,
                permissions: [
                    { module: "manager.queue", action: "view", label: "Visualizar" },
                    { module: "manager.queue", action: "manage", label: "Aprovar/Rejeitar" },
                ],
            },
            {
                name: "Relatórios Gerenciais",
                icon: <BarChart3 size={16} />,
                permissions: [
                    { module: "reports.management", action: "view", label: "Visualizar" },
                ],
            },
            {
                name: "Ranking de Vendas",
                icon: <TrendingUp size={16} />,
                permissions: [
                    { module: "reports.ranking", action: "view", label: "Visualizar" },
                ],
            },
            {
                name: "Log de Atividades",
                icon: <Clock size={16} />,
                permissions: [
                    { module: "reports.activity", action: "view", label: "Visualizar" },
                ],
            },
        ],
    },
    {
        section: "Configurações",
        sectionIcon: <Settings size={16} />,
        sectionColor: "text-slate-400",
        modules: [
            {
                name: "Gestão de Usuários",
                icon: <Shield size={16} />,
                permissions: [
                    { module: "settings.users", action: "view", label: "Visualizar" },
                    { module: "settings.users", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Funis de Venda",
                icon: <Filter size={16} />,
                permissions: [
                    { module: "settings.funnels", action: "view", label: "Visualizar" },
                    { module: "settings.funnels", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Produtos e Serviços",
                icon: <Tag size={16} />,
                permissions: [
                    { module: "settings.products", action: "view", label: "Visualizar" },
                    { module: "settings.products", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Profissionais & Valores-Hora",
                icon: <Users size={16} />,
                permissions: [
                    { module: "settings.professionals", action: "view", label: "Visualizar" },
                    { module: "settings.professionals", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Integrações",
                icon: <PlusCircle size={16} />,
                permissions: [
                    { module: "settings.integrations", action: "view", label: "Visualizar" },
                    { module: "settings.integrations", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Segmentos",
                icon: <Tags size={16} />,
                permissions: [
                    { module: "settings.segments", action: "view", label: "Visualizar" },
                    { module: "settings.segments", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Fontes e Campanhas",
                icon: <Megaphone size={16} />,
                permissions: [
                    { module: "settings.sources", action: "view", label: "Visualizar" },
                    { module: "settings.sources", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Motivos de Perda",
                icon: <BarChart3 size={16} />,
                permissions: [
                    { module: "settings.loss-reasons", action: "view", label: "Visualizar" },
                    { module: "settings.loss-reasons", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Objeções",
                icon: <Shield size={16} />,
                permissions: [
                    { module: "settings.objections", action: "view", label: "Visualizar" },
                    { module: "settings.objections", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Condições de Pagamento",
                icon: <Wallet size={16} />,
                permissions: [
                    { module: "settings.payment-conditions", action: "view", label: "Visualizar" },
                    { module: "settings.payment-conditions", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Checklist de Completude",
                icon: <CheckSquare size={16} />,
                permissions: [
                    { module: "settings.checklist", action: "view", label: "Visualizar" },
                    { module: "settings.checklist", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Base de Conhecimento",
                icon: <Database size={16} />,
                permissions: [
                    { module: "settings.knowledge-base", action: "view", label: "Visualizar" },
                    { module: "settings.knowledge-base", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Configuração Institucional",
                icon: <Landmark size={16} />,
                permissions: [
                    { module: "settings.institutional", action: "view", label: "Visualizar" },
                    { module: "settings.institutional", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Chaves de API",
                icon: <Key size={16} />,
                permissions: [
                    { module: "settings.api", action: "view", label: "Visualizar" },
                    { module: "settings.api", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Backup & Dados",
                icon: <FileDown size={16} />,
                permissions: [
                    { module: "settings.backup", action: "view", label: "Visualizar" },
                    { module: "settings.backup", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Segurança",
                icon: <Shield size={16} />,
                permissions: [
                    { module: "settings.security", action: "view", label: "Visualizar" },
                    { module: "settings.security", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Gamificação",
                icon: <Trophy size={16} />,
                permissions: [
                    { module: "settings.gamification", action: "view", label: "Visualizar" },
                    { module: "settings.gamification", action: "manage", label: "Gerenciar" },
                ],
            },
        ],
    },
    {
        section: "Notificações",
        sectionIcon: <Bell size={16} />,
        sectionColor: "text-pink-400",
        modules: [
            {
                name: "Notificações",
                icon: <Bell size={16} />,
                permissions: [
                    { module: "notifications", action: "view", label: "Visualizar" },
                    { module: "notifications", action: "manage", label: "Gerenciar" },
                ],
            },
        ],
    },
];

/* ═══════════════════════════════════════ */
/* CORPORATE (Admin Hub) Permissions       */
/* ═══════════════════════════════════════ */
export const CORPORATE_PERMISSIONS: ModuleGroup[] = [
    {
        section: "Início",
        sectionIcon: <Home size={16} />,
        sectionColor: "text-blue-400",
        modules: [
            {
                name: "Dashboard",
                icon: <Home size={16} />,
                permissions: [
                    { module: "admin.dashboard", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "admin.dashboard", action: "export", label: "Exportar" },
                ],
            },
            {
                name: "Clientes — Contatos",
                icon: <UserCircle size={16} />,
                permissions: [
                    { module: "admin.clients.contacts", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "admin.clients.contacts", action: "create", label: "Criar" },
                    { module: "admin.clients.contacts", action: "edit", label: "Editar" },
                    { module: "admin.clients.contacts", action: "delete", label: "Excluir" },
                    { module: "admin.clients.contacts", action: "export", label: "Exportar" },
                ],
            },
            {
                name: "Clientes — Empresas",
                icon: <Building2 size={16} />,
                permissions: [
                    { module: "admin.clients.companies", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "admin.clients.companies", action: "create", label: "Criar" },
                    { module: "admin.clients.companies", action: "edit", label: "Editar" },
                    { module: "admin.clients.companies", action: "delete", label: "Excluir" },
                    { module: "admin.clients.companies", action: "export", label: "Exportar" },
                ],
            },
        ],
    },
    {
        section: "Contratos",
        sectionIcon: <FileText size={16} />,
        sectionColor: "text-emerald-400",
        modules: [
            {
                name: "Contratos",
                icon: <FileText size={16} />,
                permissions: [
                    { module: "admin.contracts", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "admin.contracts", action: "create", label: "Criar" },
                    { module: "admin.contracts", action: "edit", label: "Editar" },
                    { module: "admin.contracts", action: "send", label: "Enviar assinatura" },
                    { module: "admin.contracts", action: "models", label: "Modelos" },
                    { module: "admin.contracts", action: "analyze", label: "Análise externa" },
                    { module: "admin.contracts", action: "evidences", label: "Evidências" },
                    { module: "admin.contracts", action: "admin", label: "Administrar" },
                ],
            },
        ],
    },
    {
        section: "Financeiro",
        sectionIcon: <DollarSign size={16} />,
        sectionColor: "text-green-400",
        modules: [
            {
                name: "Transações",
                icon: <DollarSign size={16} />,
                permissions: [
                    { module: "admin.financial.transactions", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "admin.financial.transactions", action: "create", label: "Criar" },
                    { module: "admin.financial.transactions", action: "edit", label: "Editar" },
                    { module: "admin.financial.transactions", action: "delete", label: "Excluir" },
                    { module: "admin.financial.transactions", action: "approve", label: "Aprovar" },
                    { module: "admin.financial.transactions", action: "export", label: "Exportar" },
                ],
            },
            {
                name: "Cartões",
                icon: <CreditCard size={16} />,
                permissions: [
                    { module: "admin.financial.cards", action: "view", label: "Visualizar" },
                    { module: "admin.financial.cards", action: "create", label: "Criar" },
                    { module: "admin.financial.cards", action: "edit", label: "Editar" },
                    { module: "admin.financial.cards", action: "delete", label: "Excluir" },
                ],
            },
            {
                name: "Nota Fiscal",
                icon: <Receipt size={16} />,
                permissions: [
                    { module: "admin.financial.invoices", action: "view", label: "Visualizar" },
                    { module: "admin.financial.invoices", action: "create", label: "Emitir" },
                    { module: "admin.financial.invoices", action: "cancel", label: "Cancelar" },
                    { module: "admin.financial.invoices", action: "export", label: "Exportar" },
                ],
            },
            {
                name: "Calendário Financeiro",
                icon: <Calendar size={16} />,
                permissions: [
                    { module: "admin.financial.calendar", action: "view", label: "Visualizar" },
                    { module: "admin.financial.calendar", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Distribuição de Lucros",
                icon: <PieChart size={16} />,
                permissions: [
                    { module: "admin.financial.profit", action: "view", label: "Visualizar" },
                    { module: "admin.financial.profit", action: "manage", label: "Gerenciar" },
                    { module: "admin.financial.profit", action: "approve", label: "Aprovar" },
                ],
            },
            {
                name: "Investimentos / Reserva",
                icon: <PiggyBank size={16} />,
                permissions: [
                    { module: "admin.financial.investments", action: "view", label: "Visualizar" },
                    { module: "admin.financial.investments", action: "manage", label: "Gerenciar" },
                ],
            },
        ],
    },
    {
        section: "Gestão",
        sectionIcon: <BarChart3 size={16} />,
        sectionColor: "text-amber-400",
        modules: [
            {
                name: "Metas",
                icon: <Target size={16} />,
                permissions: [
                    { module: "admin.management.goals", action: "view", label: "Visualizar" },
                    { module: "admin.management.goals", action: "create", label: "Criar" },
                    { module: "admin.management.goals", action: "edit", label: "Editar" },
                    { module: "admin.management.goals", action: "delete", label: "Excluir" },
                ],
            },
            {
                name: "Relatórios",
                icon: <BarChart3 size={16} />,
                permissions: [
                    { module: "admin.management.reports", action: "view", label: "Visualizar" },
                    { module: "admin.management.reports", action: "export", label: "Exportar" },
                ],
            },
        ],
    },
    {
        section: "Configurações",
        sectionIcon: <Settings size={16} />,
        sectionColor: "text-slate-400",
        modules: [
            {
                name: "Contas Bancárias",
                icon: <Layers size={16} />,
                permissions: [
                    { module: "admin.settings.accounts", action: "view", label: "Visualizar" },
                    { module: "admin.settings.accounts", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Dados da Empresa",
                icon: <Building2 size={16} />,
                permissions: [
                    { module: "admin.settings.company", action: "view", label: "Visualizar" },
                    { module: "admin.settings.company", action: "edit", label: "Editar" },
                ],
            },
            {
                name: "Integrações",
                icon: <Link2 size={16} />,
                permissions: [
                    { module: "admin.settings.integrations", action: "view", label: "Visualizar" },
                    { module: "admin.settings.integrations", action: "manage", label: "Gerenciar" },
                ],
            },
            {
                name: "Gestão de Usuários",
                icon: <Shield size={16} />,
                permissions: [
                    { module: "admin.settings.users", action: "view", label: "Visualizar" },
                    { module: "admin.settings.users", action: "create", label: "Criar" },
                    { module: "admin.settings.users", action: "edit", label: "Editar" },
                    { module: "admin.settings.users", action: "delete", label: "Excluir" },
                ],
            },
        ],
    },
];

/* ═══════════════════════════════════════ */
/* DEV Permissions                         */
/* ═══════════════════════════════════════ */
export const DEV_PERMISSIONS: ModuleGroup[] = [
    {
        section: "Projetos",
        sectionIcon: <FolderKanban size={16} />,
        sectionColor: "text-blue-400",
        modules: [
            {
                name: "Projetos",
                icon: <FolderKanban size={16} />,
                permissions: [
                    { module: "projects", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "projects", action: "create", label: "Criar" },
                    { module: "projects", action: "edit", label: "Editar" },
                    { module: "projects", action: "delete", label: "Excluir" },
                ],
            },
            {
                name: "Backlog",
                icon: <ListTodo size={16} />,
                permissions: [
                    { module: "backlog", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "backlog", action: "create", label: "Criar Tarefa" },
                    { module: "backlog", action: "edit", label: "Editar Tarefa" },
                    { module: "backlog", action: "delete", label: "Excluir Tarefa" },
                ],
            },
            {
                name: "Bugs & Qualidade",
                icon: <Bug size={16} />,
                permissions: [
                    { module: "bugs", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "bugs", action: "report", label: "Reportar Bug" },
                    { module: "bugs", action: "resolve", label: "Resolver Bug" },
                ],
            },
            {
                name: "Comentários",
                icon: <MessageSquare size={16} />,
                permissions: [
                    { module: "comments", action: "view", label: "Visualizar" },
                    { module: "comments", action: "create", label: "Comentar" },
                ],
            },
        ],
    },
    {
        section: "Documentos & Entregas",
        sectionIcon: <FileText size={16} />,
        sectionColor: "text-purple-400",
        modules: [
            {
                name: "Documentos",
                icon: <FileText size={16} />,
                permissions: [
                    { module: "documents", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "documents", action: "create", label: "Criar" },
                    { module: "documents", action: "edit", label: "Editar" },
                    { module: "documents", action: "delete", label: "Excluir" },
                ],
            },
            {
                name: "Entregas",
                icon: <Package size={16} />,
                permissions: [
                    { module: "deliveries", action: "view", label: "Visualizar", hasDataScope: true },
                    { module: "deliveries", action: "create", label: "Criar" },
                    { module: "deliveries", action: "edit", label: "Editar" },
                ],
            },
        ],
    },
    {
        section: "Gestão",
        sectionIcon: <BarChart3 size={16} />,
        sectionColor: "text-amber-400",
        modules: [
            {
                name: "Relatórios",
                icon: <BarChart3 size={16} />,
                permissions: [
                    { module: "dev.reports", action: "view", label: "Visualizar" },
                ],
            },
            {
                name: "Timesheet",
                icon: <Clock size={16} />,
                permissions: [
                    { module: "dev.timesheet", action: "view", label: "Visualizar" },
                    { module: "dev.timesheet", action: "manage", label: "Gerenciar" },
                ],
            },
        ],
    },
    {
        section: "Configurações",
        sectionIcon: <Settings size={16} />,
        sectionColor: "text-slate-400",
        modules: [
            {
                name: "Gestão de Usuários",
                icon: <Shield size={16} />,
                permissions: [
                    { module: "dev.settings.users", action: "manage", label: "Gerenciar" },
                ],
            },
        ],
    },
];

/* ═══════════════════════════════════════ */
/* Helpers                                 */
/* ═══════════════════════════════════════ */
export interface PermState {
    [key: string]: { enabled: boolean; dataScope: DataScope };
}

export function makeKey(module: string, action: string) {
    return `${module}::${action}`;
}

export type UserTeam = "dev" | "growth" | "corporate" | "both" | "growth-corporate" | "dev-corporate" | "all";

export const APP_OPTIONS = [
    { value: "growth", label: "Comercial", color: "green", icon: "TrendingUp" },
    { value: "dev", label: "Dev", color: "blue", icon: "Code2" },
    { value: "corporate", label: "Corporate", color: "orange", icon: "Building2" },
] as const;

export function detectTeam(allowedApps: string[]): UserTeam {
    const hasDev = allowedApps.includes("dev");
    const hasGrowth = allowedApps.includes("growth");
    const hasCorporate = allowedApps.includes("corporate");

    if (hasDev && hasGrowth && hasCorporate) return "all";
    if (hasDev && hasCorporate) return "dev-corporate";
    if (hasGrowth && hasCorporate) return "growth-corporate";
    if (hasDev && hasGrowth) return "both";
    if (hasCorporate) return "corporate";
    if (hasDev) return "dev";
    return "growth";
}

export function teamToAllowedApps(team: UserTeam): string[] {
    switch (team) {
        case "all": return ["growth", "dev", "corporate"];
        case "dev-corporate": return ["dev", "corporate"];
        case "growth-corporate": return ["growth", "corporate"];
        case "both": return ["growth", "dev"];
        case "corporate": return ["corporate"];
        case "dev": return ["dev"];
        default: return ["growth"];
    }
}

export function teamLabel(team: UserTeam): string {
    switch (team) {
        case "all": return "Todos os Times";
        case "dev-corporate": return "Dev + Corporate";
        case "growth-corporate": return "Comercial + Corporate";
        case "both": return "Dev + Comercial";
        case "corporate": return "Corporate";
        case "dev": return "Time Dev";
        default: return "Time Comercial";
    }
}

export function teamColor(team: UserTeam): string {
    switch (team) {
        case "all": return "purple";
        case "dev-corporate": return "cyan";
        case "growth-corporate": return "orange";
        case "both": return "purple";
        case "corporate": return "orange";
        case "dev": return "blue";
        default: return "green";
    }
}

export function accentColor(team: UserTeam): string {
    switch (team) {
        case "all":
        case "dev-corporate":
        case "growth-corporate":
        case "both": return "purple";
        case "corporate": return "orange";
        case "dev": return "blue";
        default: return "green";
    }
}

export type PermissionTeam = "growth" | "dev" | "corporate";

export interface TeamModuleGroup extends ModuleGroup {
    team: PermissionTeam;
}

// Same colors as APP_OPTIONS, reused here so a section's team badge always matches
// the color of its "Aplicativos" toggle button.
export const TEAM_BADGE: Record<PermissionTeam, { label: string; className: string }> = {
    growth: { label: "Comercial", className: "bg-green-500/10 text-green-400 border-green-500/20" },
    dev: { label: "Dev", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    corporate: { label: "Corporate", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
};

export function buildActivePermissions(allowedApps: string[]): TeamModuleGroup[] {
    const groups: TeamModuleGroup[] = [];
    if (allowedApps.includes("growth")) groups.push(...GROWTH_PERMISSIONS.map((g) => ({ ...g, team: "growth" as const })));
    if (allowedApps.includes("dev")) groups.push(...DEV_PERMISSIONS.map((g) => ({ ...g, team: "dev" as const })));
    if (allowedApps.includes("corporate")) groups.push(...CORPORATE_PERMISSIONS.map((g) => ({ ...g, team: "corporate" as const })));
    return groups;
}
