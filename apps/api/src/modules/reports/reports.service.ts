import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const reportsService = {
    async getDRE(year: number, mode: 'caixa' | 'competencia') {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        // Definimos as condições de busca baseadas no regime
        const dateField = mode === 'caixa' ? 'date' : 'dueDate';
        
        const whereClause: any = {
            [dateField]: {
                gte: startDate,
                lte: endDate
            }
        };

        if (mode === 'caixa') {
            whereClause.status = "Pago"; // No regime de caixa, apenas o que foi liquidado
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            select: {
                value: true,
                typeGroup: true,
                category: true,
                date: true,
                dueDate: true
            }
        });

        // Estrutura inicial dos 12 meses + total para cada linha do DRE
        const createEmptyRow = () => ({
            jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0, 
            jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0, total: 0
        });

        const dre = {
            receitaBruta: { total: createEmptyRow(), items: {} as Record<string, ReturnType<typeof createEmptyRow>> },
            impostos: { total: createEmptyRow(), items: {} as Record<string, ReturnType<typeof createEmptyRow>> },
            receitaLiquida: createEmptyRow(),
            custos: { total: createEmptyRow(), items: {} as Record<string, ReturnType<typeof createEmptyRow>> },
            despesas: { total: createEmptyRow(), items: {} as Record<string, ReturnType<typeof createEmptyRow>> },
            pessoas: { total: createEmptyRow(), items: {} as Record<string, ReturnType<typeof createEmptyRow>> },
            lucroLiquido: createEmptyRow(),
        };

        const monthMap = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;

        transactions.forEach(t => {
            const dateVal = mode === 'caixa' ? t.date : t.dueDate;
            if (!dateVal) return;
            const monthIdx = dateVal.getMonth();
            const monthKey = monthMap[monthIdx];
            const val = t.value || 0;
            const cat = t.category || 'Outros';

            // Agrega Receita Bruta (Recebimentos)
            if (t.typeGroup === 'Recebimentos') {
                if (!dre.receitaBruta.items[cat]) dre.receitaBruta.items[cat] = createEmptyRow();
                dre.receitaBruta.items[cat][monthKey] += val;
                dre.receitaBruta.items[cat].total += val;
                dre.receitaBruta.total[monthKey] += val;
                dre.receitaBruta.total.total += val;
            } 
            // Agrega Impostos
            else if (t.typeGroup === 'Impostos') {
                if (!dre.impostos.items[cat]) dre.impostos.items[cat] = createEmptyRow();
                dre.impostos.items[cat][monthKey] += val;
                dre.impostos.items[cat].total += val;
                dre.impostos.total[monthKey] += val;
                dre.impostos.total.total += val;
            }
            // Agrega Custos e Despesas Variáveis
            else if (t.typeGroup === 'Despesas variáveis') {
                if (!dre.custos.items[cat]) dre.custos.items[cat] = createEmptyRow();
                dre.custos.items[cat][monthKey] += val;
                dre.custos.items[cat].total += val;
                dre.custos.total[monthKey] += val;
                dre.custos.total.total += val;
            }
            // Agrega Despesas Fixas
            else if (t.typeGroup === 'Despesas fixas') {
                if (!dre.despesas.items[cat]) dre.despesas.items[cat] = createEmptyRow();
                dre.despesas.items[cat][monthKey] += val;
                dre.despesas.items[cat].total += val;
                dre.despesas.total[monthKey] += val;
                dre.despesas.total.total += val;
            }
            // Agrega Pessoas (Folha/Pró-labore)
            else if (t.typeGroup === 'Pessoas') {
                if (!dre.pessoas.items[cat]) dre.pessoas.items[cat] = createEmptyRow();
                dre.pessoas.items[cat][monthKey] += val;
                dre.pessoas.items[cat].total += val;
                dre.pessoas.total[monthKey] += val;
                dre.pessoas.total.total += val;
            }
        });

        // Calcula Totais Finais (Receita Líquida e Lucro Líquido)
        monthMap.forEach(m => {
            dre.receitaLiquida[m] = dre.receitaBruta.total[m] - dre.impostos.total[m];
            dre.lucroLiquido[m] = dre.receitaLiquida[m] - dre.custos.total[m] - dre.despesas.total[m] - dre.pessoas.total[m];
        });
        
        dre.receitaLiquida.total = dre.receitaBruta.total.total - dre.impostos.total.total;
        dre.lucroLiquido.total = dre.receitaLiquida.total - dre.custos.total.total - dre.despesas.total.total - dre.pessoas.total.total;

        return dre;
    },

    async getCashFlow(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        // 1. Calcular Saldo Bancário Inicial Absoluto (até 31 de dezembro do ano anterior)
        const bankAccounts = await prisma.bankAccount.findMany({ select: { initialBalance: true } });
        const sumInitialBalances = bankAccounts.reduce((acc, b) => acc + (b.initialBalance || 0), 0);

        const pastTransactions = await prisma.transaction.findMany({
            where: {
                date: { lt: startDate },
                status: 'Pago' // Saldo real só considera o que já foi pago no passado
            },
            select: { value: true, typeGroup: true }
        });

        let pastInflows = 0;
        let pastOutflows = 0;

        pastTransactions.forEach(t => {
            const val = t.value || 0;
            if (t.typeGroup === 'Recebimentos') {
                pastInflows += val;
            } else if (t.typeGroup !== 'Transferência') {
                pastOutflows += val;
            }
        });

        const startOfYearBalance = sumInitialBalances + pastInflows - pastOutflows;

        // 2. Buscar todas as transações do ano atual
        const yearTransactions = await prisma.transaction.findMany({
            where: {
                // Aqui usamos OR porque podemos ter contas previstas (dueDate) ou já pagas (date) no ano.
                // Na prática, consideramos dueDate para projetado, e date para realizado.
                // Mas para garantir que varremos tudo, buscamos por ambas as datas no ano.
                OR: [
                    { dueDate: { gte: startDate, lte: endDate } },
                    { date: { gte: startDate, lte: endDate } }
                ]
            },
            select: { value: true, typeGroup: true, status: true, date: true, dueDate: true }
        });

        // 3. Estruturar meses
        const months = Array.from({ length: 12 }, (_, i) => ({
            monthIndex: i,
            saldoInicialRealizado: 0,
            saldoInicialProjetado: 0,
            entradasRealizadas: 0,
            entradasPrevistas: 0,
            saidasRealizadas: 0,
            saidasPrevistas: 0,
            saldoFinalRealizado: 0,
            saldoFinalProjetado: 0
        }));

        // Agrupar no mês correto
        yearTransactions.forEach(t => {
            const val = t.value || 0;
            if (t.typeGroup === 'Transferência') return;

            const isIncome = t.typeGroup === 'Recebimentos';
            const isPaid = t.status === 'Pago';

            // Onde essa transação entra?
            // Se já foi paga, ela afeta o Realizado no mês da coluna `date`
            if (isPaid && t.date && t.date >= startDate && t.date <= endDate) {
                const m = t.date.getMonth();
                if (isIncome) months[m].entradasRealizadas += val;
                else months[m].saidasRealizadas += val;
            }

            // A projeção usa `dueDate`
            if (t.dueDate && t.dueDate >= startDate && t.dueDate <= endDate) {
                const m = t.dueDate.getMonth();
                if (isIncome) {
                    if (!isPaid) months[m].entradasPrevistas += val; // Se não tá pago, é previsto pra esse mês
                    // Se estiver pago, no fluxo "Projetado" a gente considera o "Previsto + Realizado" para ter a visão completa
                } else {
                    if (!isPaid) months[m].saidasPrevistas += val;
                }
            }
        });

        // 4. Calcular Efeito Cascata
        let currentRealizado = startOfYearBalance;
        // O projetado começa igual ao realizado
        let currentProjetado = startOfYearBalance;

        for (let i = 0; i < 12; i++) {
            const m = months[i];
            
            // Saldo Inicial
            m.saldoInicialRealizado = currentRealizado;
            m.saldoInicialProjetado = currentProjetado;

            // Fechamento Realizado
            m.saldoFinalRealizado = currentRealizado + m.entradasRealizadas - m.saidasRealizadas;
            currentRealizado = m.saldoFinalRealizado;

            // Fechamento Projetado (assume que tudo o que estava previsto VAI acontecer, 
            // e o que já foi pago JÁ entrou na conta. Então é Inicial + Realizadas + Previstas)
            m.saldoFinalProjetado = currentProjetado 
                + m.entradasRealizadas + m.entradasPrevistas 
                - m.saidasRealizadas - m.saidasPrevistas;
            
            currentProjetado = m.saldoFinalProjetado;
        }

        return {
            startOfYearBalance,
            months
        };
    },

    async getProfitability(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        const transactions = await prisma.transaction.findMany({
            where: {
                date: { gte: startDate, lte: endDate },
                status: 'Pago', // Rentabilidade real baseada no que foi de fato pago no ano
            },
            select: { value: true, typeGroup: true, costCenter: true }
        });

        const centerMap: Record<string, { receitas: number; despesas: number; lucro: number; margem: number; qtdLancamentos: number }> = {};

        transactions.forEach(t => {
            if (t.typeGroup === 'Transferência') return;
            
            const cc = t.costCenter || 'Não Classificado';
            const val = t.value || 0;
            const isIncome = t.typeGroup === 'Recebimentos';

            if (!centerMap[cc]) {
                centerMap[cc] = { receitas: 0, despesas: 0, lucro: 0, margem: 0, qtdLancamentos: 0 };
            }

            centerMap[cc].qtdLancamentos++;

            if (isIncome) {
                centerMap[cc].receitas += val;
            } else {
                centerMap[cc].despesas += val;
            }
        });

        // Calcular Lucro e Margem para cada um e retornar como array
        const results = Object.entries(centerMap).map(([name, data]) => {
            const lucro = data.receitas - data.despesas;
            const margem = data.receitas > 0 ? (lucro / data.receitas) * 100 : (lucro < 0 ? -100 : 0);
            
            return {
                costCenter: name,
                ...data,
                lucro,
                margem
            };
        });

        // Ordenar do maior lucro pro menor
        results.sort((a, b) => b.lucro - a.lucro);

        return results;
    },

    async getSalesFunnel(year: number, funnelId?: string) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        // 1. Obter todos os funis para o filtro da tela
        const funnels = await prisma.funnel.findMany({
            select: { id: true, name: true }
        });

        const targetFunnelId = funnelId || (funnels.length > 0 ? funnels[0].id : null);

        // Se não tiver nenhum funil, retorna tudo zerado
        if (!targetFunnelId) {
            return {
                funnels,
                selectedFunnelId: null,
                metrics: { totalDeals: 0, wonCount: 0, wonValue: 0, lostCount: 0, lostValue: 0, winRate: 0, ticketMedio: 0, cicloVendasDias: 0 },
                stagesSnapshot: []
            };
        }

        // 2. Buscar Deals do Funil selecionado no Ano selecionado
        const deals = await prisma.deal.findMany({
            where: {
                funnelId: targetFunnelId,
                createdAt: { gte: startDate, lte: endDate } // Negócios gerados neste ano
            },
            select: { value: true, status: true, stageId: true, createdAt: true, updatedAt: true }
        });

        // Métricas Globais
        let totalDeals = deals.length;
        let wonCount = 0;
        let wonValue = 0;
        let lostCount = 0;
        let lostValue = 0;
        let totalCycleMs = 0;

        const openDealsByStage: Record<string, { count: number; value: number }> = {};

        deals.forEach(d => {
            if (d.status === 'won') {
                wonCount++;
                wonValue += d.value;
                totalCycleMs += d.updatedAt.getTime() - d.createdAt.getTime();
            } else if (d.status === 'lost') {
                lostCount++;
                lostValue += d.value;
            } else if (d.status === 'open') {
                if (!openDealsByStage[d.stageId]) {
                    openDealsByStage[d.stageId] = { count: 0, value: 0 };
                }
                openDealsByStage[d.stageId].count++;
                openDealsByStage[d.stageId].value += d.value;
            }
        });

        const closedDeals = wonCount + lostCount;
        const winRate = closedDeals > 0 ? (wonCount / closedDeals) * 100 : 0;
        const ticketMedio = wonCount > 0 ? wonValue / wonCount : 0;
        const cicloVendasDias = wonCount > 0 ? (totalCycleMs / wonCount) / (1000 * 60 * 60 * 24) : 0;

        // 3. Buscar nomes dos estágios para o Snapshot do Funil
        const stages = await prisma.funnelStage.findMany({
            where: { funnelId: targetFunnelId },
            orderBy: { orderIndex: 'asc' },
            select: { id: true, name: true, color: true }
        });

        const stagesSnapshot = stages.map(s => ({
            stageId: s.id,
            name: s.name,
            color: s.color,
            count: openDealsByStage[s.id]?.count || 0,
            value: openDealsByStage[s.id]?.value || 0
        }));

        return {
            funnels,
            selectedFunnelId: targetFunnelId,
            metrics: {
                totalDeals,
                wonCount,
                wonValue,
                lostCount,
                lostValue,
                winRate,
                ticketMedio,
                cicloVendasDias
            },
            stagesSnapshot
        };
    },

    async getConsultantPerformance(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        const deals = await prisma.deal.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            select: { 
                value: true, 
                status: true, 
                createdAt: true, 
                updatedAt: true,
                consultantId: true,
                consultant: {
                    select: {
                        name: true,
                        avatar: true
                    }
                }
            }
        });

        const consultantMap: Record<string, {
            id: string;
            name: string;
            avatar: string | null;
            wonCount: number;
            wonValue: number;
            lostCount: number;
            lostValue: number;
            totalCycleMs: number;
        }> = {};

        deals.forEach(d => {
            const id = d.consultantId || 'unassigned';
            const name = d.consultant?.name || 'Não Atribuído';
            const avatar = d.consultant?.avatar || null;

            if (!consultantMap[id]) {
                consultantMap[id] = { id, name, avatar, wonCount: 0, wonValue: 0, lostCount: 0, lostValue: 0, totalCycleMs: 0 };
            }

            if (d.status === 'won') {
                consultantMap[id].wonCount++;
                consultantMap[id].wonValue += d.value;
                consultantMap[id].totalCycleMs += d.updatedAt.getTime() - d.createdAt.getTime();
            } else if (d.status === 'lost') {
                consultantMap[id].lostCount++;
                consultantMap[id].lostValue += d.value;
            }
        });

        const results = Object.values(consultantMap).map(c => {
            const closedDeals = c.wonCount + c.lostCount;
            const winRate = closedDeals > 0 ? (c.wonCount / closedDeals) * 100 : 0;
            const ticketMedio = c.wonCount > 0 ? c.wonValue / c.wonCount : 0;
            const cicloVendasDias = c.wonCount > 0 ? (c.totalCycleMs / c.wonCount) / (1000 * 60 * 60 * 24) : 0;

            return {
                id: c.id,
                name: c.name,
                avatar: c.avatar,
                wonCount: c.wonCount,
                wonValue: c.wonValue,
                lostCount: c.lostCount,
                winRate,
                ticketMedio,
                cicloVendasDias
            };
        });

        // Ordenar pelo que mais trouxe dinheiro (wonValue)
        results.sort((a, b) => b.wonValue - a.wonValue);

        return results;
    },

    async getAcquisitionROI(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        const deals = await prisma.deal.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            select: { 
                value: true, 
                status: true,
                source: true
            }
        });

        const channelMap: Record<string, {
            source: string;
            totalLeads: number;
            wonCount: number;
            wonValue: number;
            lostCount: number;
        }> = {};

        deals.forEach(d => {
            const source = d.source || 'Desconhecida';

            if (!channelMap[source]) {
                channelMap[source] = { source, totalLeads: 0, wonCount: 0, wonValue: 0, lostCount: 0 };
            }

            channelMap[source].totalLeads++;

            if (d.status === 'won') {
                channelMap[source].wonCount++;
                channelMap[source].wonValue += d.value;
            } else if (d.status === 'lost') {
                channelMap[source].lostCount++;
            }
        });

        const results = Object.values(channelMap).map(c => {
            const closedDeals = c.wonCount + c.lostCount;
            const winRate = closedDeals > 0 ? (c.wonCount / closedDeals) * 100 : 0;
            const ticketMedio = c.wonCount > 0 ? c.wonValue / c.wonCount : 0;

            return {
                source: c.source,
                totalLeads: c.totalLeads,
                wonCount: c.wonCount,
                wonValue: c.wonValue,
                lostCount: c.lostCount,
                winRate,
                ticketMedio
            };
        });

        // Ordenar pelo canal que mais gerou receita
        results.sort((a, b) => b.wonValue - a.wonValue);

        return results;
    },

    async getProjectProfitability(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        // 1. Buscar a taxa/hora de todos os profissionais para calcular o custo das horas trabalhadas
        const professionals = await prisma.professional.findMany({
            select: { userId: true, hourlyRate: true }
        });

        const hourlyRates: Record<string, number> = {};
        professionals.forEach(p => {
            hourlyRates[p.userId] = p.hourlyRate;
        });

        const DEFAULT_HOURLY_RATE = 50; // Caso um dev lance hora mas não tenha cadastro de taxa

        // 2. Buscar projetos criados no ano selecionado
        const projects = await prisma.devProject.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            select: {
                id: true,
                name: true,
                client: true,
                hoursEstimated: true,
                hoursUsed: true,
                progress: true,
                assembledProposal: {
                    select: {
                        deal: { select: { value: true } }
                    }
                },
                tasks: {
                    select: {
                        timeLogs: {
                            select: {
                                userId: true,
                                hours: true
                            }
                        }
                    }
                }
            }
        });

        // 3. Processar custo e receita
        const results = projects.map(p => {
            let totalCost = 0;
            let totalHoursLogged = 0;

            p.tasks.forEach(task => {
                task.timeLogs.forEach(log => {
                    totalHoursLogged += log.hours;
                    const rate = hourlyRates[log.userId] || DEFAULT_HOURLY_RATE;
                    totalCost += log.hours * rate;
                });
            });

            // Receita vendida (via Deal > AssembledProposal)
            const revenue = p.assembledProposal?.deal?.value || 0;
            const profit = revenue - totalCost;
            const margin = revenue > 0 ? (profit / revenue) * 100 : (totalCost > 0 ? -100 : 0);

            return {
                projectId: p.id,
                projectName: p.name,
                clientName: p.client,
                revenue,
                cost: totalCost,
                profit,
                margin,
                hoursEstimated: p.hoursEstimated,
                hoursLogged: totalHoursLogged,
                progress: p.progress
            };
        });

        // Ordenar pelos projetos mais lucrativos no topo
        results.sort((a, b) => b.profit - a.profit);

        return results;
    },

    async getProjectVelocity(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        // Buscar projetos com tarefas marcadas como concluídas (done)
        const projects = await prisma.devProject.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            select: {
                id: true,
                name: true,
                client: true,
                tasks: {
                    where: { status: 'done' },
                    select: {
                        estimatedHours: true,
                        loggedHours: true,
                        createdAt: true,
                        updatedAt: true
                    }
                }
            }
        });

        const MS_IN_DAY = 1000 * 60 * 60 * 24;

        const results = projects.map(p => {
            let totalEstimated = 0;
            let totalLogged = 0;
            let totalLeadTimeDays = 0;
            const completedTasks = p.tasks.length;

            p.tasks.forEach(t => {
                totalEstimated += t.estimatedHours;
                totalLogged += t.loggedHours;
                
                const leadTimeMs = t.updatedAt.getTime() - t.createdAt.getTime();
                totalLeadTimeDays += (leadTimeMs / MS_IN_DAY);
            });

            const avgLeadTime = completedTasks > 0 ? (totalLeadTimeDays / completedTasks) : 0;
            
            // Se gastou 15 e estimou 10, o desvio é 50%. (15 / 10 - 1) * 100
            const estimationDeviation = totalEstimated > 0 
                ? ((totalLogged / totalEstimated) - 1) * 100 
                : 0;

            return {
                projectId: p.id,
                projectName: p.name,
                clientName: p.client,
                completedTasks,
                totalEstimated,
                totalLogged,
                avgLeadTime,
                estimationDeviation
            };
        });

        // Ordenar por volume de entregas (mais tarefas completadas primeiro)
        results.sort((a, b) => b.completedTasks - a.completedTasks);

        return results;
    },

    async getContractsMRR(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        // Buscar todas as parcelas de contratos assinados ou em andamento no ano
        const installments = await prisma.contractInstallment.findMany({
            where: {
                dueDate: { gte: startDate, lte: endDate },
                contract: {
                    status: { notIn: ['draft', 'cancelled', 'archived'] }
                }
            },
            include: {
                contract: {
                    select: { id: true, value: true }
                }
            }
        });

        const monthsData: Record<number, { month: number; value: number; count: number }> = {};
        for (let i = 1; i <= 12; i++) {
            monthsData[i] = { month: i, value: 0, count: 0 };
        }

        const uniqueContracts = new Set<string>();

        installments.forEach(inst => {
            const month = inst.dueDate.getMonth() + 1;
            monthsData[month].value += inst.value;
            monthsData[month].count++;
            uniqueContracts.add(inst.contractId);
        });

        const timeline = Object.values(monthsData).sort((a, b) => a.month - b.month);

        return {
            timeline,
            activeContractsCount: uniqueContracts.size
        };
    },

    async getContractsAging(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        // Buscar todos os contratos do ano
        const contracts = await prisma.contract.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            select: {
                id: true,
                number: true,
                contractorName: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                value: true
            }
        });

        const MS_IN_DAY = 1000 * 60 * 60 * 24;
        const now = new Date();

        let totalSignedLeadTime = 0;
        let signedCount = 0;

        const buckets = {
            '0-7': 0,
            '8-15': 0,
            '16-30': 0,
            '31+': 0
        };

        const agingContracts: Array<{
            id: string;
            number: string;
            contractorName: string;
            status: string;
            ageInDays: number;
            value: number;
        }> = [];

        contracts.forEach(contract => {
            // Se o contrato já foi assinado, calcular o tempo que levou (createdAt até updatedAt)
            if (contract.status === 'signed') {
                const leadTimeMs = contract.updatedAt.getTime() - contract.createdAt.getTime();
                totalSignedLeadTime += (leadTimeMs / MS_IN_DAY);
                signedCount++;
            } 
            // Para contratos não finalizados/arquivados, medir o tempo que estão no pipeline
            else if (contract.status !== 'archived' && contract.status !== 'cancelled') {
                const ageInDays = Math.floor((now.getTime() - contract.createdAt.getTime()) / MS_IN_DAY);

                if (ageInDays <= 7) buckets['0-7']++;
                else if (ageInDays <= 15) buckets['8-15']++;
                else if (ageInDays <= 30) buckets['16-30']++;
                else buckets['31+']++;

                agingContracts.push({
                    id: contract.id,
                    number: contract.number,
                    contractorName: contract.contractorName,
                    status: contract.status,
                    ageInDays,
                    value: contract.value
                });
            }
        });

        // Ordenar os contratos mais atrasados primeiro
        agingContracts.sort((a, b) => b.ageInDays - a.ageInDays);

        const avgLeadTime = signedCount > 0 ? (totalSignedLeadTime / signedCount) : 0;
        const healthyPercentage = agingContracts.length > 0 
            ? ((buckets['0-7'] + buckets['8-15']) / agingContracts.length) * 100 
            : 100;

        return {
            avgLeadTime,
            healthyPercentage,
            buckets,
            agingContracts
        };
    },

    async getChatbotMetrics(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        const sessions = await prisma.chatbotSession.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            include: {
                chatbot: { select: { botName: true } },
                conversation: {
                    include: {
                        contact: { select: { leadId: true } }
                    }
                }
            }
        });

        const leadIds = sessions.map(s => s.conversation?.contact?.leadId).filter(Boolean) as string[];
        
        let meetings: any[] = [];
        if (leadIds.length > 0) {
            meetings = await prisma.scheduledMeeting.findMany({
                where: {
                    leadId: { in: leadIds },
                    createdAt: { gte: startDate, lte: endDate }
                },
                select: { id: true, leadId: true, createdAt: true }
            });
        }

        let totalSessions = sessions.length;
        let totalCompleted = 0;
        let totalHandedOff = 0;
        let totalScore = 0;
        let scoredSessionsCount = 0;
        let totalMeetingsScheduled = 0;

        const monthsData: Record<number, { 
            month: number; 
            total: number; 
            completed: number; 
            handedOff: number; 
            meetingsScheduled: number;
        }> = {};

        for (let i = 1; i <= 12; i++) {
            monthsData[i] = { month: i, total: 0, completed: 0, handedOff: 0, meetingsScheduled: 0 };
        }

        const botsData: Record<string, { total: number; handedOff: number }> = {};

        sessions.forEach(session => {
            const month = session.createdAt.getMonth() + 1;
            monthsData[month].total++;

            if (session.status === 'completed') {
                totalCompleted++;
                monthsData[month].completed++;
            } else if (session.status === 'handed_off') {
                totalHandedOff++;
                monthsData[month].handedOff++;
            }

            if (session.qualificationScore > 0) {
                totalScore += session.qualificationScore;
                scoredSessionsCount++;
            }

            // Verify if there is any meeting for this session's lead created after the session started
            const leadId = session.conversation?.contact?.leadId;
            let hasMeeting = false;
            
            // Also check qualificationData as a fallback
            const qualData = typeof session.qualificationData === 'object' && session.qualificationData !== null 
                ? (session.qualificationData as Record<string, any>) 
                : {};
                
            if (qualData.meetingScheduled || qualData.is_scheduled || qualData.agendamento) {
                hasMeeting = true;
            } else if (leadId) {
                // Find if there is a meeting created within 24 hours of the session
                const MS_IN_24H = 1000 * 60 * 60 * 24;
                const sessionTime = session.createdAt.getTime();
                hasMeeting = meetings.some(m => 
                    m.leadId === leadId && 
                    m.createdAt.getTime() >= sessionTime && 
                    (m.createdAt.getTime() - sessionTime) <= MS_IN_24H
                );
            }

            if (hasMeeting) {
                totalMeetingsScheduled++;
                monthsData[month].meetingsScheduled++;
            }

            const botName = session.chatbot?.botName || "Unknown Bot";
            if (!botsData[botName]) {
                botsData[botName] = { total: 0, handedOff: 0 };
            }
            botsData[botName].total++;
            if (session.status === 'handed_off') botsData[botName].handedOff++;
        });

        const retentionRate = totalSessions > 0 ? (totalCompleted / totalSessions) * 100 : 0;
        const handoffRate = totalSessions > 0 ? (totalHandedOff / totalSessions) * 100 : 0;
        const avgScore = scoredSessionsCount > 0 ? (totalScore / scoredSessionsCount) : 0;

        const timeline = Object.values(monthsData).sort((a, b) => a.month - b.month);

        const botPerformances = Object.entries(botsData).map(([botName, stats]) => {
            return {
                botName,
                totalSessions: stats.total,
                handoffRate: stats.total > 0 ? (stats.handedOff / stats.total) * 100 : 0
            };
        });

        return {
            totalSessions,
            retentionRate,
            handoffRate,
            avgScore,
            totalMeetingsScheduled,
            timeline,
            botPerformances
        };
    },

    async getSupportVolume(year: number) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

        const conversations = await prisma.whatsappConversation.findMany({
            where: {
                createdAt: { gte: startDate, lte: endDate }
            },
            include: {
                assignee: { select: { name: true, avatar: true } }
            }
        });

        let totalVolume = conversations.length;
        let totalResolved = 0;
        let totalResolutionTimeMs = 0;

        const monthsData: Record<number, { 
            month: number; 
            total: number; 
            resolved: number; 
            open: number; 
        }> = {};

        for (let i = 1; i <= 12; i++) {
            monthsData[i] = { month: i, total: 0, resolved: 0, open: 0 };
        }

        const agentsData: Record<string, { 
            name: string; 
            profileImage: string | null; 
            resolvedCount: number; 
        }> = {};

        const MS_IN_HOUR = 1000 * 60 * 60;

        conversations.forEach(conv => {
            const month = conv.createdAt.getMonth() + 1;
            monthsData[month].total++;

            if (conv.status === 'resolved') {
                totalResolved++;
                monthsData[month].resolved++;
                
                const resolutionTime = conv.updatedAt.getTime() - conv.createdAt.getTime();
                totalResolutionTimeMs += resolutionTime;

                if (conv.assignee) {
                    const agentId = conv.assigneeId!;
                    if (!agentsData[agentId]) {
                        agentsData[agentId] = {
                            name: conv.assignee.name,
                            profileImage: conv.assignee.avatar,
                            resolvedCount: 0
                        };
                    }
                    agentsData[agentId].resolvedCount++;
                }
            } else {
                monthsData[month].open++;
            }
        });

        const resolutionRate = totalVolume > 0 ? (totalResolved / totalVolume) * 100 : 0;
        const avgResolutionTimeHours = totalResolved > 0 ? (totalResolutionTimeMs / totalResolved) / MS_IN_HOUR : 0;

        const timeline = Object.values(monthsData).sort((a, b) => a.month - b.month);

        const topAgents = Object.values(agentsData)
            .sort((a, b) => b.resolvedCount - a.resolvedCount)
            .slice(0, 5); // Top 5 agents

        return {
            totalVolume,
            resolutionRate,
            avgResolutionTimeHours,
            timeline,
            topAgents
        };
    },

    async getExecutiveSummary() {
        const now = new Date();
        const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // --- 1. FINANCEIRO ---
        const transactions = await prisma.transaction.findMany({
            where: {
                date: { gte: startOfMonthDate, lte: endOfMonthDate }
            },
            orderBy: { date: 'desc' }
        });

        let expectedIncome = 0;
        let realizedIncome = 0;
        let expectedExpense = 0;
        let realizedExpense = 0;
        let overdue = 0;

        const dailyCashFlowMap = new Map<number, { day: number; income: number; expense: number }>();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            dailyCashFlowMap.set(i, { day: i, income: 0, expense: 0 });
        }

        const expenseCategoriesMap = new Map<string, number>();

        transactions.forEach(t => {
            const isIncome = t.typeGroup === 'Recebimentos';
            const day = t.date.getDate();
            const dayData = dailyCashFlowMap.get(day);

            if (isIncome) {
                if (t.status === 'Pago') {
                    realizedIncome += t.value;
                    if (dayData) dayData.income += t.value;
                } else expectedIncome += t.value;
                
                if (t.status !== 'Pago' && t.dueDate < now) overdue += t.value;
            } else {
                if (t.status === 'Pago') {
                    realizedExpense += t.value;
                    if (dayData) dayData.expense += t.value;
                    
                    const cat = t.category || 'Outros';
                    expenseCategoriesMap.set(cat, (expenseCategoriesMap.get(cat) || 0) + t.value);
                } else expectedExpense += t.value;
            }
        });

        const dailyCashFlow = Array.from(dailyCashFlowMap.values());
        const expenseByCategory = Array.from(expenseCategoriesMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        const recentTransactions = transactions.slice(0, 8).map(t => ({
            id: t.id,
            description: t.description,
            value: t.value,
            isIncome: t.typeGroup === 'Recebimentos',
            date: t.date,
            status: t.status
        }));

        const finance = { expectedIncome, realizedIncome, expectedExpense, realizedExpense, overdue, dailyCashFlow, expenseByCategory, recentTransactions };

        // --- 2. COMERCIAL ---
        const dealsWon = await prisma.deal.findMany({
            where: {
                status: 'won',
                updatedAt: { gte: startOfMonthDate, lte: endOfMonthDate }
            },
            orderBy: { updatedAt: 'desc' }
        });
        
        const recentDeals = dealsWon.slice(0, 5).map(d => ({
            id: d.id,
            title: d.title,
            value: d.value || 0,
            date: d.updatedAt
        }));

        const sales = {
            dealsCount: dealsWon.length,
            totalValue: dealsWon.reduce((acc, d) => acc + (d.value || 0), 0),
            recentDeals
        };

        // --- 3. OPERAÇÕES (PROJETOS) ---
        const activeProjectsQuery = await prisma.devProject.findMany({
            where: { archived: false },
            include: { tasks: { select: { estimatedHours: true, loggedHours: true } } }
        });
        
        let projectsAtRisk = 0;
        const activeProjectsList = activeProjectsQuery.map(p => {
            let est = 0; let log = 0;
            p.tasks.forEach(t => { est += t.estimatedHours; log += t.loggedHours; });
            const isAtRisk = (log > est && est > 0) || p.health === 'at_risk';
            if (isAtRisk) projectsAtRisk++;
            return {
                id: p.id,
                name: p.name,
                progress: p.progress,
                health: p.health,
                phase: p.phase,
                isAtRisk
            };
        });

        const operations = {
            activeCount: activeProjectsQuery.length,
            atRiskCount: projectsAtRisk,
            activeProjectsList
        };

        // --- 4. CONTRATOS E GARGALOS ---
        const MS_IN_15_DAYS = 15 * 24 * 60 * 60 * 1000;
        const stuckContracts = await prisma.contract.count({
            where: {
                status: { in: ['draft', 'review', 'sent'] },
                createdAt: { lt: new Date(now.getTime() - MS_IN_15_DAYS) }
            }
        });
        
        const mrrAggregation = await prisma.contract.aggregate({
            _sum: { value: true },
            where: { status: 'signed' } // Simplified MRR active
        });

        const legal = { 
            stuckContractsCount: stuckContracts,
            activeMRR: mrrAggregation._sum.value || 0
        };

        // --- 5. SUPORTE ---
        const openTickets = await prisma.whatsappConversation.count({
            where: { status: 'open' }
        });

        return {
            finance,
            sales,
            operations,
            legal,
            support: { openTicketsCount: openTickets }
        };
    }
};
