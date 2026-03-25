// ═══════════════════════════════════════════════════════
// ProposalAI Web Dev — Mock Data for Frontend-Only Mode
// ═══════════════════════════════════════════════════════

export type UserRole = "ADMIN" | "GESTOR" | "TECH_LEAD" | "PO" | "DEV" | "QA" | "DESIGNER";

export interface MockUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar: string;
    cargo: string;
}

export const MOCK_USERS: MockUser[] = [
    { id: "u0", name: "Fernando Oliveira", email: "fernando@cezani.dev", role: "ADMIN", avatar: "F", cargo: "Administrador" },
    { id: "u1", name: "Carlos Mendes", email: "carlos@cezani.dev", role: "GESTOR", avatar: "C", cargo: "Gestor de Projetos" },
    { id: "u2", name: "Ana Oliveira", email: "ana@cezani.dev", role: "TECH_LEAD", avatar: "A", cargo: "Tech Lead" },
    { id: "u3", name: "Rafael Costa", email: "rafael@cezani.dev", role: "PO", avatar: "R", cargo: "Product Owner" },
    { id: "u4", name: "Juliana Santos", email: "juliana@cezani.dev", role: "DEV", avatar: "J", cargo: "Desenvolvedora Full Stack" },
    { id: "u5", name: "Marcos Lima", email: "marcos@cezani.dev", role: "QA", avatar: "M", cargo: "QA Engineer" },
    { id: "u6", name: "Beatriz Nunes", email: "beatriz@cezani.dev", role: "DESIGNER", avatar: "B", cargo: "UI/UX Designer" },
    { id: "u7", name: "Pedro Almeida", email: "pedro@cezani.dev", role: "DEV", avatar: "P", cargo: "Desenvolvedor Backend" },
];

export type ProjectHealth = "on_track" | "at_risk" | "delayed";
export type ProjectPhase = "requirements" | "discovery" | "development" | "testing" | "documentation" | "delivery";

export interface MockProject {
    id: string;
    name: string;
    client: string;
    phase: ProjectPhase;
    phaseLabel: string;
    progress: number;
    health: ProjectHealth;
    techLead: string;
    po: string;
    startDate: string;
    deadline: string;
    hoursEstimated: number;
    hoursUsed: number;
    tasksTotal: number;
    tasksDone: number;
    archived: boolean;
}

export const PHASE_LABELS: Record<ProjectPhase, string> = {
    requirements: "Levantamento de Requisitos",
    discovery: "Discovery e Design",
    development: "Desenvolvimento",
    testing: "Testes",
    documentation: "Documentação",
    delivery: "Entrega",
};

export const MOCK_PROJECTS: MockProject[] = [
    {
        id: "p1", name: "App E-commerce Luxe", client: "Luxe Fashion", phase: "development", phaseLabel: "Desenvolvimento",
        progress: 45, health: "on_track", techLead: "Ana Oliveira", po: "Rafael Costa",
        startDate: "2026-01-15", deadline: "2026-05-30", hoursEstimated: 1200, hoursUsed: 540,
        tasksTotal: 86, tasksDone: 39, archived: false
    },
    {
        id: "p2", name: "Portal Financeiro B2B", client: "FinCorp S.A.", phase: "testing", phaseLabel: "Testes",
        progress: 72, health: "at_risk", techLead: "Ana Oliveira", po: "Rafael Costa",
        startDate: "2025-11-01", deadline: "2026-03-15", hoursEstimated: 800, hoursUsed: 680,
        tasksTotal: 54, tasksDone: 41, archived: false
    },
    {
        id: "p3", name: "Plataforma SaaS HealthTech", client: "MedConnect", phase: "requirements", phaseLabel: "Levantamento de Requisitos",
        progress: 12, health: "on_track", techLead: "Ana Oliveira", po: "Rafael Costa",
        startDate: "2026-02-20", deadline: "2026-08-30", hoursEstimated: 2000, hoursUsed: 240,
        tasksTotal: 120, tasksDone: 14, archived: false
    },
    {
        id: "p4", name: "App Delivery Gourmet", client: "Sabor Express", phase: "discovery", phaseLabel: "Discovery e Design",
        progress: 25, health: "on_track", techLead: "Ana Oliveira", po: "Rafael Costa",
        startDate: "2026-02-01", deadline: "2026-06-15", hoursEstimated: 600, hoursUsed: 150,
        tasksTotal: 42, tasksDone: 10, archived: false
    },
    {
        id: "p5", name: "CRM Imobiliário", client: "ImóvelTop", phase: "delivery", phaseLabel: "Entrega",
        progress: 95, health: "on_track", techLead: "Ana Oliveira", po: "Rafael Costa",
        startDate: "2025-08-01", deadline: "2026-02-28", hoursEstimated: 900, hoursUsed: 870,
        tasksTotal: 68, tasksDone: 65, archived: false
    },
    {
        id: "p6", name: "Sistema de Gestão Escolar", client: "EduPrime", phase: "documentation", phaseLabel: "Documentação",
        progress: 88, health: "delayed", techLead: "Ana Oliveira", po: "Rafael Costa",
        startDate: "2025-09-15", deadline: "2026-01-31", hoursEstimated: 700, hoursUsed: 750,
        tasksTotal: 50, tasksDone: 47, archived: false
    },
    {
        id: "p7", name: "App Fitness Tracker", client: "VitaFit", phase: "delivery", phaseLabel: "Entrega",
        progress: 100, health: "on_track", techLead: "Ana Oliveira", po: "Rafael Costa",
        startDate: "2025-06-01", deadline: "2025-12-15", hoursEstimated: 500, hoursUsed: 480,
        tasksTotal: 38, tasksDone: 38, archived: true
    },
];

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface MockTask {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee: string;
    estimatedHours: number;
    loggedHours: number;
    epic: string;
    story: string;
    deadline: string;
    tags: string[];
    blocked: boolean;
    createdAt: string;
}

export const MOCK_TASKS: MockTask[] = [
    { id: "t1", projectId: "p1", title: "Implementar carrinho de compras", description: "Desenvolver o componente de carrinho com adição/remoção de itens, cálculo de totais e cupons.", status: "in_progress", priority: "high", assignee: "Juliana Santos", estimatedHours: 16, loggedHours: 10, epic: "Módulo de Compras", story: "Como usuário, quero adicionar produtos ao carrinho", deadline: "2026-03-15", tags: ["frontend", "react"], blocked: false, createdAt: "2026-02-10" },
    { id: "t2", projectId: "p1", title: "API de pagamentos com Stripe", description: "Integrar API de pagamentos usando Stripe SDK para processar transações.", status: "todo", priority: "critical", assignee: "Pedro Almeida", estimatedHours: 24, loggedHours: 0, epic: "Módulo de Pagamentos", story: "Como usuário, quero pagar com cartão de crédito", deadline: "2026-03-20", tags: ["backend", "integração"], blocked: false, createdAt: "2026-02-12" },
    { id: "t3", projectId: "p1", title: "Tela de listagem de produtos", description: "Grid responsivo de produtos com filtros por categoria, preço e avaliação.", status: "done", priority: "medium", assignee: "Juliana Santos", estimatedHours: 12, loggedHours: 11, epic: "Catálogo", story: "Como usuário, quero ver todos os produtos disponíveis", deadline: "2026-03-01", tags: ["frontend"], blocked: false, createdAt: "2026-01-20" },
    { id: "t4", projectId: "p1", title: "Sistema de notificações push", description: "Implementar push notifications para novos pedidos e promoções.", status: "todo", priority: "low", assignee: "Pedro Almeida", estimatedHours: 8, loggedHours: 0, epic: "Notificações", story: "Como usuário, quero receber alertas de promoções", deadline: "2026-04-01", tags: ["backend", "mobile"], blocked: false, createdAt: "2026-02-15" },
    { id: "t5", projectId: "p1", title: "Design do checkout mobile", description: "Criar wireframes e protótipo do fluxo de checkout para dispositivos móveis.", status: "review", priority: "high", assignee: "Beatriz Nunes", estimatedHours: 10, loggedHours: 9, epic: "Módulo de Compras", story: "Como usuário, quero finalizar compras pelo celular", deadline: "2026-03-10", tags: ["design", "mobile"], blocked: false, createdAt: "2026-02-08" },
    { id: "t6", projectId: "p2", title: "Dashboard de relatórios financeiros", description: "Criar dashboard com gráficos de receita, despesas e projeções.", status: "in_progress", priority: "high", assignee: "Juliana Santos", estimatedHours: 20, loggedHours: 14, epic: "Relatórios", story: "Como gestor, quero ver métricas financeiras em tempo real", deadline: "2026-03-12", tags: ["frontend", "recharts"], blocked: false, createdAt: "2026-01-25" },
    { id: "t7", projectId: "p2", title: "API de conciliação bancária", description: "Endpoint para importar e conciliar extratos bancários automaticamente.", status: "in_progress", priority: "critical", assignee: "Pedro Almeida", estimatedHours: 32, loggedHours: 28, epic: "Financeiro", story: "Como contador, quero importar extratos bancários", deadline: "2026-03-08", tags: ["backend"], blocked: true, createdAt: "2026-01-18" },
    { id: "t8", projectId: "p2", title: "Testes de regressão do módulo de faturas", description: "Executar suite de testes de regressão no módulo de faturas.", status: "todo", priority: "medium", assignee: "Marcos Lima", estimatedHours: 8, loggedHours: 0, epic: "Qualidade", story: "Como QA, quero validar que faturas são geradas corretamente", deadline: "2026-03-14", tags: ["qa", "testes"], blocked: false, createdAt: "2026-02-20" },
    { id: "t9", projectId: "p3", title: "Refinamento de user stories — Módulo Pacientes", description: "Refinar e documentar user stories do módulo de gestão de pacientes.", status: "in_progress", priority: "high", assignee: "Rafael Costa", estimatedHours: 6, loggedHours: 3, epic: "Pacientes", story: "Refinamento de requisitos", deadline: "2026-03-10", tags: ["requisitos"], blocked: false, createdAt: "2026-02-22" },
    { id: "t10", projectId: "p3", title: "Mapeamento de integrações com sistemas legados", description: "Documentar todas as integrações necessárias com o sistema atual do cliente.", status: "todo", priority: "medium", assignee: "Ana Oliveira", estimatedHours: 12, loggedHours: 0, epic: "Integrações", story: "Levantamento técnico", deadline: "2026-03-18", tags: ["requisitos", "integração"], blocked: false, createdAt: "2026-02-25" },
];

export interface MockSprint {
    id: string;
    projectId: string;
    name: string;
    startDate: string;
    endDate: string;
    status: "active" | "completed" | "planned";
    capacity: number;
    tasksPlanned: number;
    tasksDone: number;
    velocity: number;
}

export const MOCK_SPRINTS: MockSprint[] = [
    { id: "s1", projectId: "p1", name: "Sprint 5", startDate: "2026-03-03", endDate: "2026-03-14", status: "active", capacity: 80, tasksPlanned: 8, tasksDone: 3, velocity: 34 },
    { id: "s2", projectId: "p1", name: "Sprint 4", startDate: "2026-02-17", endDate: "2026-02-28", status: "completed", capacity: 80, tasksPlanned: 10, tasksDone: 9, velocity: 42 },
    { id: "s3", projectId: "p2", name: "Sprint 12", startDate: "2026-03-03", endDate: "2026-03-14", status: "active", capacity: 60, tasksPlanned: 6, tasksDone: 2, velocity: 28 },
];

export interface MockDelivery {
    id: string;
    projectId: string;
    name: string;
    description: string;
    phase: ProjectPhase;
    status: "draft" | "pending_approval" | "approved" | "revision_requested";
    registeredBy: string;
    registeredAt: string;
    linkedTasks: string[];
}

export const MOCK_DELIVERIES: MockDelivery[] = [
    { id: "d1", projectId: "p1", name: "Protótipo do Checkout Mobile", description: "Wireframes completos do fluxo de checkout mobile no Figma.", phase: "discovery", status: "approved", registeredBy: "Beatriz Nunes", registeredAt: "2026-02-28", linkedTasks: ["t5"] },
    { id: "d2", projectId: "p1", name: "Módulo de Catálogo v1.0", description: "Tela de listagem com filtros e busca implementados.", phase: "development", status: "pending_approval", registeredBy: "Juliana Santos", registeredAt: "2026-03-05", linkedTasks: ["t3"] },
    { id: "d3", projectId: "p2", name: "Dashboard Financeiro Beta", description: "Versão beta do dashboard com 5 tipos de gráficos.", phase: "development", status: "revision_requested", registeredBy: "Juliana Santos", registeredAt: "2026-03-04", linkedTasks: ["t6"] },
    { id: "d4", projectId: "p5", name: "Entrega Final — CRM Imobiliário", description: "Versão final do sistema com todas as funcionalidades.", phase: "delivery", status: "approved", registeredBy: "Ana Oliveira", registeredAt: "2026-02-25", linkedTasks: [] },
];

export interface MockBug {
    id: string;
    projectId: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "in_progress" | "resolved" | "closed";
    assignee: string;
    relatedTask: string;
    createdAt: string;
}

export const MOCK_BUGS: MockBug[] = [
    { id: "b1", projectId: "p2", title: "Erro ao exportar relatório PDF", description: "O sistema retorna 500 ao tentar exportar relatório com mais de 100 linhas.", severity: "high", status: "open", assignee: "Pedro Almeida", relatedTask: "t6", createdAt: "2026-03-06" },
    { id: "b2", projectId: "p2", title: "Formatação de moeda incorreta", description: "Valores acima de R$ 1.000 não exibem ponto separador de milhar.", severity: "medium", status: "in_progress", assignee: "Juliana Santos", relatedTask: "t6", createdAt: "2026-03-05" },
    { id: "b3", projectId: "p1", title: "Carrinho não persiste entre sessões", description: "Ao fechar o navegador e reabrir, o carrinho está vazio mesmo logado.", severity: "high", status: "open", assignee: "Juliana Santos", relatedTask: "t1", createdAt: "2026-03-07" },
];

export interface MockDocument {
    id: string;
    projectId: string;
    name: string;
    category: "technical" | "manual" | "contract" | "report" | "design" | "other";
    version: string;
    visibleToClient: boolean;
    uploadedBy: string;
    uploadedAt: string;
    size: string;
}

export const MOCK_DOCUMENTS: MockDocument[] = [
    { id: "doc1", projectId: "p1", name: "Arquitetura do Sistema", category: "technical", version: "2.0", visibleToClient: false, uploadedBy: "Ana Oliveira", uploadedAt: "2026-02-15", size: "2.4 MB" },
    { id: "doc2", projectId: "p1", name: "Manual do Usuário — Catálogo", category: "manual", version: "1.0", visibleToClient: true, uploadedBy: "Beatriz Nunes", uploadedAt: "2026-03-02", size: "1.8 MB" },
    { id: "doc3", projectId: "p2", name: "Especificação de API — Financeiro", category: "technical", version: "3.1", visibleToClient: false, uploadedBy: "Pedro Almeida", uploadedAt: "2026-02-20", size: "890 KB" },
    { id: "doc4", projectId: "p2", name: "Relatório de Progresso — Semana 10", category: "report", version: "1.0", visibleToClient: true, uploadedBy: "Rafael Costa", uploadedAt: "2026-03-07", size: "560 KB" },
    { id: "doc5", projectId: "p5", name: "Termo de Aceite Final", category: "contract", version: "1.0", visibleToClient: true, uploadedBy: "Carlos Mendes", uploadedAt: "2026-02-26", size: "320 KB" },
];

export interface MockAIAlert {
    id: string;
    projectId: string;
    type: "delay_projected" | "task_blocked" | "estimate_deviation" | "sprint_velocity" | "phase_no_delivery";
    description: string;
    suggestedAction: string;
    status: "active" | "resolved" | "ignored";
    detectedAt: string;
}

export const AI_ALERT_LABELS: Record<MockAIAlert["type"], string> = {
    delay_projected: "Atraso Projetado",
    task_blocked: "Tarefa Bloqueada",
    estimate_deviation: "Desvio de Estimativa",
    sprint_velocity: "Velocidade Abaixo",
    phase_no_delivery: "Fase sem Entrega",
};

export const MOCK_AI_ALERTS: MockAIAlert[] = [
    { id: "a1", projectId: "p2", type: "delay_projected", description: "Projeto 'Portal Financeiro B2B' tem 85% de probabilidade de atraso de 2 semanas.", suggestedAction: "Realocar 1 desenvolvedor adicional ou renegociar prazo com o cliente.", status: "active", detectedAt: "2026-03-07" },
    { id: "a2", projectId: "p2", type: "task_blocked", description: "Tarefa 'API de conciliação bancária' está bloqueada há 3 dias sem atualização.", suggestedAction: "Tech Lead deve investigar o bloqueio e definir plano de ação.", status: "active", detectedAt: "2026-03-06" },
    { id: "a3", projectId: "p1", type: "estimate_deviation", description: "Tarefa 'Carrinho de Compras' excedeu 60% da estimativa original.", suggestedAction: "Revisar complexidade e reavaliar estimativa.", status: "active", detectedAt: "2026-03-05" },
    { id: "a4", projectId: "p6", type: "delay_projected", description: "Projeto 'Sistema de Gestão Escolar' ultrapassou o prazo em 36 dias.", suggestedAction: "Priorizar a conclusão da documentação e agendar entrega.", status: "active", detectedAt: "2026-03-01" },
    { id: "a5", projectId: "p1", type: "sprint_velocity", description: "Sprint 5 tem velocidade 20% abaixo da média dos últimos 3 sprints.", suggestedAction: "Avaliar se há tarefas bloqueadas ou impedimentos externos.", status: "active", detectedAt: "2026-03-08" },
];

export interface MockNotification {
    id: string;
    type: "task_assigned" | "comment_mention" | "task_blocked" | "sprint_completed" | "delivery_approved" | "delivery_revision" | "ai_alert" | "report_pending" | "deadline_risk" | "acceptance_signed";
    title: string;
    description: string;
    read: boolean;
    createdAt: string;
    link: string;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
    { id: "n1", type: "task_assigned", title: "Nova tarefa atribuída", description: "Você foi atribuído à tarefa 'API de pagamentos com Stripe'.", read: false, createdAt: "2026-03-08T14:30:00", link: "/dashboard/projects/p1/tasks/t2" },
    { id: "n2", type: "ai_alert", title: "Alerta de IA: Atraso projetado", description: "Projeto 'Portal Financeiro B2B' tem risco de atraso de 2 semanas.", read: false, createdAt: "2026-03-07T18:00:00", link: "/dashboard/ai" },
    { id: "n3", type: "delivery_revision", title: "Ajuste solicitado na entrega", description: "Cliente solicitou ajustes no 'Dashboard Financeiro Beta'.", read: false, createdAt: "2026-03-07T10:15:00", link: "/dashboard/projects/p2/deliveries" },
    { id: "n4", type: "task_blocked", title: "Tarefa bloqueada há 3 dias", description: "Tarefa 'API de conciliação bancária' sem atualização.", read: true, createdAt: "2026-03-06T09:00:00", link: "/dashboard/projects/p2/board" },
    { id: "n5", type: "sprint_completed", title: "Sprint 4 concluído", description: "Sprint 4 do projeto 'App E-commerce Luxe' foi finalizado.", read: true, createdAt: "2026-03-01T17:00:00", link: "/dashboard/projects/p1/board" },
    { id: "n6", type: "comment_mention", title: "Menção em comentário", description: "Ana Oliveira mencionou você em um comentário na tarefa 'Carrinho de compras'.", read: true, createdAt: "2026-02-28T11:30:00", link: "/dashboard/projects/p1/tasks/t1" },
    { id: "n7", type: "delivery_approved", title: "Entrega aprovada", description: "Protótipo do Checkout Mobile foi aprovado pelo cliente.", read: true, createdAt: "2026-02-28T16:00:00", link: "/dashboard/projects/p1/deliveries" },
    { id: "n8", type: "report_pending", title: "Relatório pendente de revisão", description: "Relatório semanal do projeto 'Portal Financeiro B2B' aguarda sua aprovação.", read: false, createdAt: "2026-03-07T17:00:00", link: "/dashboard/ai/reports" },
];

// Helper functions
export function getProjectById(id: string) {
    return MOCK_PROJECTS.find(p => p.id === id);
}

export function getTasksByProject(projectId: string) {
    return MOCK_TASKS.filter(t => t.projectId === projectId);
}

export function getDeliveriesByProject(projectId: string) {
    return MOCK_DELIVERIES.filter(d => d.projectId === projectId);
}

export function getDocumentsByProject(projectId: string) {
    return MOCK_DOCUMENTS.filter(d => d.projectId === projectId);
}

export function getBugsByProject(projectId: string) {
    return MOCK_BUGS.filter(b => b.projectId === projectId);
}

export function getAlertsByProject(projectId: string) {
    return MOCK_AI_ALERTS.filter(a => a.projectId === projectId);
}

export function getSprintsByProject(projectId: string) {
    return MOCK_SPRINTS.filter(s => s.projectId === projectId);
}

export function getHealthColor(health: ProjectHealth) {
    switch (health) {
        case "on_track": return "text-green-400";
        case "at_risk": return "text-amber-400";
        case "delayed": return "text-red-400";
    }
}

export function getHealthBg(health: ProjectHealth) {
    switch (health) {
        case "on_track": return "bg-green-500/10 border-green-500/20";
        case "at_risk": return "bg-amber-500/10 border-amber-500/20";
        case "delayed": return "bg-red-500/10 border-red-500/20";
    }
}

export function getHealthLabel(health: ProjectHealth) {
    switch (health) {
        case "on_track": return "No Prazo";
        case "at_risk": return "Em Risco";
        case "delayed": return "Atrasado";
    }
}

export function getPriorityColor(priority: TaskPriority) {
    switch (priority) {
        case "low": return "text-slate-400 bg-slate-500/10";
        case "medium": return "text-blue-400 bg-blue-500/10";
        case "high": return "text-amber-400 bg-amber-500/10";
        case "critical": return "text-red-400 bg-red-500/10";
    }
}

export function getPriorityLabel(priority: TaskPriority) {
    switch (priority) {
        case "low": return "Baixa";
        case "medium": return "Média";
        case "high": return "Alta";
        case "critical": return "Crítica";
    }
}

export function getStatusLabel(status: TaskStatus) {
    switch (status) {
        case "todo": return "A Fazer";
        case "in_progress": return "Em Andamento";
        case "review": return "Em Revisão";
        case "done": return "Concluída";
    }
}

export function getDeliveryStatusLabel(status: MockDelivery["status"]) {
    switch (status) {
        case "draft": return "Rascunho";
        case "pending_approval": return "Aguardando Aprovação";
        case "approved": return "Aprovada";
        case "revision_requested": return "Ajuste Solicitado";
    }
}

export function getDeliveryStatusColor(status: MockDelivery["status"]) {
    switch (status) {
        case "draft": return "text-slate-400 bg-slate-500/10 border-slate-500/20";
        case "pending_approval": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
        case "approved": return "text-green-400 bg-green-500/10 border-green-500/20";
        case "revision_requested": return "text-red-400 bg-red-500/10 border-red-500/20";
    }
}

export function getCategoryLabel(category: MockDocument["category"]) {
    switch (category) {
        case "technical": return "Técnico";
        case "manual": return "Manual";
        case "contract": return "Contrato";
        case "report": return "Relatório";
        case "design": return "Design";
        case "other": return "Outro";
    }
}
