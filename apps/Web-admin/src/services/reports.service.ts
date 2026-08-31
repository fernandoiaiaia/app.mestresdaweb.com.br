import { api } from "@/lib/api";

type DRERow = {
    jan: number; feb: number; mar: number; apr: number; may: number; jun: number;
    jul: number; aug: number; sep: number; oct: number; nov: number; dec: number;
    total: number;
};

type DREGroup = {
    total: DRERow;
    items: Record<string, DRERow>;
};

export type DREData = {
    receitaBruta: DREGroup;
    impostos: DREGroup;
    receitaLiquida: DRERow;
    custos: DREGroup;
    despesas: DREGroup;
    pessoas: DREGroup;
    lucroLiquido: DRERow;
};

export type CashFlowMonth = {
    monthIndex: number;
    saldoInicialRealizado: number;
    saldoInicialProjetado: number;
    entradasRealizadas: number;
    entradasPrevistas: number;
    saidasRealizadas: number;
    saidasPrevistas: number;
    saldoFinalRealizado: number;
    saldoFinalProjetado: number;
};

export type CashFlowData = {
    startOfYearBalance: number;
    months: CashFlowMonth[];
};

export type ProfitabilityRow = {
    costCenter: string;
    receitas: number;
    despesas: number;
    lucro: number;
    margem: number;
    qtdLancamentos: number;
};

export type SalesFunnelData = {
    funnels: { id: string; name: string }[];
    selectedFunnelId: string | null;
    metrics: {
        totalDeals: number;
        wonCount: number;
        wonValue: number;
        lostCount: number;
        lostValue: number;
        winRate: number;
        ticketMedio: number;
        cicloVendasDias: number;
    };
    stagesSnapshot: {
        stageId: string;
        name: string;
        color: string;
        count: number;
        value: number;
    }[];
};

export type ConsultantPerformanceRow = {
    id: string;
    name: string;
    avatar: string | null;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    winRate: number;
    ticketMedio: number;
    cicloVendasDias: number;
};

export type LeadSourceRow = {
    source: string;
    leads: number;
    percent: number;
    wonCount: number;
    wonValue: number;
    totalValue: number;
    previousLeads: number;
    /** null quando o período anterior não teve nenhum lead — não existe variação sobre zero. */
    changePercent: number | null;
};

export type LeadsBySourceData = {
    range: { startDate: string; endDate: string; days: number };
    totals: {
        leads: number;
        previousLeads: number;
        changePercent: number | null;
        wonCount: number;
        wonValue: number;
        sourceCount: number;
    };
    sources: LeadSourceRow[];
    daily: Array<{ date: string; leads: number }>;
};

export type LeadsPeriod =
    | { days: number }
    | { startDate: string; endDate: string };

export type AcquisitionRow = {
    source: string;
    totalLeads: number;
    wonCount: number;
    wonValue: number;
    lostCount: number;
    winRate: number;
    ticketMedio: number;
};

export type ProjectProfitabilityRow = {
    projectId: string;
    projectName: string;
    clientName: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: number;
    hoursEstimated: number;
    hoursLogged: number;
    progress: number;
};

export type ProjectVelocityRow = {
    projectId: string;
    projectName: string;
    clientName: string;
    completedTasks: number;
    totalEstimated: number;
    totalLogged: number;
    avgLeadTime: number;
    estimationDeviation: number;
};

export type ContractsMRRData = {
    timeline: {
        month: number;
        value: number;
        count: number;
    }[];
    activeContractsCount: number;
};

export type ContractsAgingData = {
    avgLeadTime: number;
    healthyPercentage: number;
    buckets: {
        '0-7': number;
        '8-15': number;
        '16-30': number;
        '31+': number;
    };
    agingContracts: Array<{
        id: string;
        number: string;
        contractorName: string;
        status: string;
        ageInDays: number;
        value: number;
    }>;
};

export type ChatbotMetricsData = {
    totalSessions: number;
    retentionRate: number;
    handoffRate: number;
    avgScore: number;
    totalMeetingsScheduled: number;
    timeline: {
        month: number;
        total: number;
        completed: number;
        handedOff: number;
        meetingsScheduled: number;
    }[];
    botPerformances: {
        botName: string;
        totalSessions: number;
        handoffRate: number;
    }[];
};

export type SupportVolumeData = {
    totalVolume: number;
    resolutionRate: number;
    avgResolutionTimeHours: number;
    timeline: {
        month: number;
        total: number;
        resolved: number;
        open: number;
    }[];
    topAgents: {
        name: string;
        profileImage: string | null;
        resolvedCount: number;
    }[];
};

export type ExecutiveSummaryData = {
    finance: {
        expectedIncome: number;
        realizedIncome: number;
        expectedExpense: number;
        realizedExpense: number;
        overdue: number;
        dailyCashFlow: { day: number; income: number; expense: number; }[];
        expenseByCategory: { name: string; value: number; }[];
        recentTransactions: { id: string; description: string; value: number; isIncome: boolean; date: string; status: string; }[];
    };
    sales: {
        dealsCount: number;
        totalValue: number;
        recentDeals: { id: string; title: string; value: number; date: string; }[];
    };
    operations: {
        activeCount: number;
        atRiskCount: number;
        activeProjectsList: { id: string; name: string; progress: number; health: string; phase: string; isAtRisk: boolean; }[];
    };
    legal: {
        stuckContractsCount: number;
        activeMRR: number;
    };
    support: {
        openTicketsCount: number;
    };
};

export const reportsService = {
    async getDRE(year: number, mode: 'caixa' | 'competencia') {
        return api<DREData>(`/api/reports/dre?year=${year}&mode=${mode}`);
    },

    async getCashFlow(year: number) {
        return api<CashFlowData>(`/api/reports/cash-flow?year=${year}`);
    },

    async getProfitability(year: number) {
        return api<ProfitabilityRow[]>(`/api/reports/profitability?year=${year}`);
    },

    async getSalesFunnel(year: number, funnelId?: string) {
        return api<SalesFunnelData>(`/api/reports/sales-funnel?year=${year}${funnelId ? `&funnelId=${funnelId}` : ''}`);
    },

    async getConsultantPerformance(year: number) {
        return api<ConsultantPerformanceRow[]>(`/api/reports/consultant-performance?year=${year}`);
    },

    async getAcquisitionROI(year: number) {
        return api<AcquisitionRow[]>(`/api/reports/acquisition-roi?year=${year}`);
    },

    async getLeadsBySource(period: LeadsPeriod) {
        const query = "days" in period
            ? `days=${period.days}`
            : `startDate=${encodeURIComponent(period.startDate)}&endDate=${encodeURIComponent(period.endDate)}`;
        return api<LeadsBySourceData>(`/api/reports/leads-by-source?${query}`);
    },

    async getProjectProfitability(year: number) {
        return api<ProjectProfitabilityRow[]>(`/api/reports/project-profitability?year=${year}`);
    },

    async getProjectVelocity(year: number) {
        return api<ProjectVelocityRow[]>(`/api/reports/project-velocity?year=${year}`);
    },

    async getContractsMRR(year: number) {
        return api<ContractsMRRData>(`/api/reports/contracts-mrr?year=${year}`);
    },

    async getContractsAging(year: number) {
        return api<ContractsAgingData>(`/api/reports/contracts-aging?year=${year}`);
    },

    async getChatbotMetrics(year: number) {
        return api<ChatbotMetricsData>(`/api/reports/support-chatbot?year=${year}`);
    },

    async getSupportVolume(year: number) {
        return api<SupportVolumeData>(`/api/reports/support-volume?year=${year}`);
    },

    async getExecutiveSummary() {
        return api<ExecutiveSummaryData>(`/api/reports/executive-summary`);
    }
};
