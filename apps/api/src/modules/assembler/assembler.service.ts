import { prisma } from "../../config/database.js";
import type { Response } from "express";
import type { Prisma } from "@prisma/client";
import { getOwnerUserId } from "../../lib/get-owner.js";

// ── Type helpers ──────────────────────────────────────────────────────────────

interface ScopeFunctionality { title: string; estimatedHours?: number }
interface ScopeScreen        { title: string; functionalities: ScopeFunctionality[] }
interface ScopeModule        { title: string; screens: ScopeScreen[] }
interface ScopePlatform      { platformName: string; modules: ScopeModule[] }
interface ScopeUser          { userName: string; platforms: ScopePlatform[] }
interface ScopeIntegration   { title: string; estimatedHours?: number }
interface ScopeData {
    id?: string;
    title?: string;
    clientId?: string;
    dealId?: string;
    validityDays?: number;
    projectSummary: string;
    users: ScopeUser[];
    integrations?: ScopeIntegration[];
    mode?: "scope" | "estimate" | "scope_user" | "scope_integrations";
    viewerId?: string;
    publicId?: string;
}

interface MinimaxCredentials { apiKey: string; model?: string }

// ── Service ───────────────────────────────────────────────────────────────────

export class AssemblerService {

    // ── READ ───────────────────────────────────────────────────────────────────

    static async listProposals(userId: string, query?: { clientId?: string, dealId?: string }) {
        const where: Prisma.AssembledProposalWhereInput = { userId };
        
        // If query parameters are provided, apply strict filtering
        if (query?.clientId) where.clientId = query.clientId;
        if (query?.dealId) where.dealId = query.dealId;

        return prisma.assembledProposal.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        email: true,
                        companyRef: { select: { name: true } },
                    },
                },
                viewer: { select: { id: true, name: true, email: true } },
            },
        });
    }

    static async listClientProposals(viewerId: string) {
        // Find the user's email to match with clients
        const user = await prisma.user.findUnique({
            where: { id: viewerId },
            select: { email: true },
        });

        if (!user) return [];

        // Find all client entities that match this email
        const matchedClients = await prisma.client.findMany({
            where: { email: user.email },
            select: { id: true },
        });

        const clientIds = matchedClients.map(c => c.id);

        return prisma.assembledProposal.findMany({
            where: {
                OR: [
                    { viewerId },
                    { clientId: { in: clientIds } },
                    { userId: viewerId },
                ],
            },
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, avatar: true } },
                client: { select: { name: true, company: true } },
            },
        });
    }

    static async getClientProposal(viewerId: string, proposalId: string) {
        const user = await prisma.user.findUnique({
            where: { id: viewerId },
            select: { email: true },
        });
        if (!user) throw new Error("NOT_FOUND");

        const matchedClients = await prisma.client.findMany({
            where: { email: user.email },
            select: { id: true },
        });
        const clientIds = matchedClients.map(c => c.id);

        const proposal = await prisma.assembledProposal.findUnique({
            where: { id: proposalId },
            include: {
                user: {
                    select: {
                        name: true,
                        avatar: true,
                        professionals: {
                            where: { isActive: true },
                        },
                        paymentConditions: {
                            where: { active: true },
                        },
                    },
                },
                client: { select: { name: true, company: true, companyRef: { select: { name: true } } } },
            },
        });
        if (!proposal) throw new Error("NOT_FOUND");

        const hasAccess = proposal.viewerId === viewerId || proposal.userId === viewerId || (proposal.clientId && clientIds.includes(proposal.clientId));
        if (!hasAccess) throw new Error("NOT_FOUND");

        return proposal;
    }

    /** Get the proposal owner's active professionals — for use in the Client Portal */
    static async getProposalTeamForClient(viewerId: string, proposalId: string) {
        const proposal = await AssemblerService.getClientProposal(viewerId, proposalId);
        const professionals = await prisma.professional.findMany({
            where: { userId: proposal.userId, isActive: true },
            orderBy: { createdAt: "asc" },
        });
        return professionals;
    }

    /** Get the proposal owner's active payment conditions — for use in the Client Portal */
    static async getProposalPaymentsForClient(viewerId: string, proposalId: string) {
        const proposal = await AssemblerService.getClientProposal(viewerId, proposalId);
        const conditions = await prisma.paymentCondition.findMany({
            where: { userId: proposal.userId, active: true },
        });
        return conditions;
    }

    static async getProposal(userId: string, id: string) {
        const proposal = await prisma.assembledProposal.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        name: true,
                        avatar: true,
                        professionals: {
                            where: { isActive: true },
                        },
                        paymentConditions: {
                            where: { active: true },
                        },
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        email: true,
                        companyRef: { select: { name: true } },
                    },
                },
            },
        });
        if (!proposal || proposal.userId !== userId) throw new Error("NOT_FOUND");
        return proposal;
    }

    // ── CREATE (new proposal) ────────────────────────────────────────────────

    static async createProposal(userId: string, data: ScopeData) {
        // Use the explicit title from the scope; fall back to projectSummary excerpt
        const title = data.title?.trim()
            ? data.title.trim()
            : data.projectSummary
                ? data.projectSummary.substring(0, 60).trimEnd() + "..."
                : "Nova Proposta";

        const totalHours = AssemblerService.calcTotalHours(data);

        // clientId & dealId: only set when valid and verify they exist in db to avoid FK errors
        let clientId = data.clientId && data.clientId.trim() !== "" ? data.clientId : null;
        let dealId = data.dealId && data.dealId.trim() !== "" ? data.dealId : null;

        if (clientId) {
            const clientExists = await prisma.client.findUnique({ where: { id: clientId } });
            if (!clientExists) {
                clientId = null;
            }
        }

        if (clientId && !dealId) {
            // Find existing open deal
            const existingDeal = await prisma.deal.findFirst({
                where: { clientId, status: "open", userId },
                orderBy: { createdAt: "desc" }
            });

            if (existingDeal) {
                dealId = existingDeal.id;
            } else {
                // Determine a safe stage to create
                const dbUser = await prisma.user.findUnique({ where: { id: userId } });
                const allowedFunnels = (dbUser as any)?.allowedFunnels || [];
                
                const defaultFunnel = await prisma.funnel.findFirst({ where: { userId, isDefault: true } }) 
                    || await prisma.funnel.findFirst({ where: { OR: [{ userId }, { id: { in: allowedFunnels } }] } });
                
                if (defaultFunnel) {
                    const firstStage = await prisma.funnelStage.findFirst({
                        where: { funnelId: defaultFunnel.id },
                        orderBy: { orderIndex: "asc" }
                    });
                    
                    if (firstStage) {
                        const newDeal = await prisma.deal.create({
                            data: {
                                clientId,
                                funnelId: defaultFunnel.id,
                                stageId: firstStage.id,
                                userId: userId,
                                consultantId: userId,
                                title: `Oportunidade gerada pelo Montador`,
                                value: 0,
                                status: "open"
                            }
                        });
                        dealId = newDeal.id;
                    }
                }
            }
        }

        if (dealId) {
            const dealExists = await prisma.deal.findUnique({ where: { id: dealId } });
            if (!dealExists) dealId = null;
        }

        // Strip rawMeta to avoid recursive data bloat in scopeData
        const cleanData = { ...(data as unknown as Record<string, unknown>) };
        delete cleanData.rawMeta;
        delete cleanData.id; // Never store draft/scope IDs in the scope data

        return prisma.assembledProposal.create({
            data: {
                userId,
                title,
                scopeData: cleanData as unknown as Prisma.JsonObject,
                totalHours,
                clientId,
                dealId,
                viewerId: data.viewerId || null,
                // Generate a random publicId for new proposals if not provided
                publicId: data.publicId || Math.random().toString(36).substring(2, 15),
            },
        });
    }

    // ── UPDATE (existing proposal by explicit ID) ─────────────────────────────

    static async updateProposal(userId: string, proposalId: string, data: ScopeData) {
        const existing = await prisma.assembledProposal.findUnique({ where: { id: proposalId } });
        if (!existing || existing.userId !== userId) throw new Error("NOT_FOUND");

        const title = data.title?.trim()
            ? data.title.trim()
            : data.projectSummary
                ? data.projectSummary.substring(0, 60).trimEnd() + "..."
                : "Nova Proposta";

        const totalHours = AssemblerService.calcTotalHours(data);

        // clientId & dealId validation
        let clientId = data.clientId && data.clientId.trim() !== "" ? data.clientId : null;
        let dealId = data.dealId && data.dealId.trim() !== "" ? data.dealId : null;

        if (clientId) {
            const clientExists = await prisma.client.findUnique({ where: { id: clientId } });
            if (!clientExists) clientId = null;
        }

        if (dealId) {
            const dealExists = await prisma.deal.findUnique({ where: { id: dealId } });
            if (!dealExists) dealId = null;
        }

        // Preserve client feedbacks so frontend auto-save doesn't overwrite read states
        const existingScopeData = (existing.scopeData as Record<string, unknown>) || {};
        const preservedFeedbacks = existingScopeData.clientFeedback;

        // Strip rawMeta to avoid recursive data bloat
        const cleanData: Record<string, unknown> = {
            ...(data as unknown as Record<string, unknown>),
        };
        delete cleanData.rawMeta;
        // Keep the real DB ID in scopeData for consistency
        cleanData.id = proposalId;

        if (preservedFeedbacks !== undefined) {
            cleanData.clientFeedback = preservedFeedbacks;
        }

        return prisma.assembledProposal.update({
            where: { id: proposalId },
            data: {
                title,
                scopeData: cleanData as unknown as Prisma.JsonObject,
                totalHours,
                clientId,
                dealId,
                viewerId: data.viewerId || null,
            },
        });
    }

    // ── SCREEN FEEDBACK ────────────────────────────────────────────────────

    static async getScreenFeedback(viewerId: string, proposalId: string) {
        // Client-side: ensure they have access
        const proposal = await AssemblerService.getClientProposal(viewerId, proposalId);
        const scopeData = proposal.scopeData as Record<string, unknown>;
        return (scopeData?.clientFeedback as unknown[]) || [];
    }

    static async addScreenFeedback(
        viewerId: string,
        proposalId: string,
        data: { screenId: string; screenTitle: string; moduleName: string; text: string }
    ) {
        // Verify access
        const proposal = await AssemblerService.getClientProposal(viewerId, proposalId);
        const scopeData = (proposal.scopeData as Record<string, unknown>) || {};
        const feedbacks = ((scopeData.clientFeedback as unknown[]) || []) as Record<string, unknown>[];

        // Get user name for the feedback
        const user = await prisma.user.findUnique({ where: { id: viewerId }, select: { name: true } });

        const newFeedback = {
            id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            screenId: data.screenId,
            screenTitle: data.screenTitle,
            moduleName: data.moduleName,
            text: data.text,
            author: user?.name || "Cliente",
            date: new Date().toISOString(),
            read: false,
        };

        feedbacks.push(newFeedback);

        // Update the scopeData with the new feedback
        await prisma.assembledProposal.update({
            where: { id: proposalId },
            data: {
                scopeData: { ...scopeData, clientFeedback: feedbacks } as unknown as Prisma.JsonObject,
            },
        });

        return newFeedback;
    }

    static async getProposalFeedback(userId: string, proposalId: string) {
        // Consultant-side: verify ownership
        const proposal = await prisma.assembledProposal.findUnique({ where: { id: proposalId } });
        if (!proposal || proposal.userId !== userId) throw new Error("NOT_FOUND");
        const scopeData = proposal.scopeData as Record<string, unknown>;
        return (scopeData?.clientFeedback as unknown[]) || [];
    }

    static async markFeedbackRead(userId: string, proposalId: string, feedbackIds: string[]) {
        // Consultant-side: verify ownership
        const proposal = await prisma.assembledProposal.findUnique({ where: { id: proposalId } });
        if (!proposal || proposal.userId !== userId) throw new Error("NOT_FOUND");

        const scopeData = (proposal.scopeData as Record<string, unknown>) || {};
        const feedbacks = ((scopeData.clientFeedback as unknown[]) || []) as Record<string, unknown>[];

        // Mark specified feedbacks as read
        const idsSet = new Set(feedbackIds);
        const updated = feedbacks.map(f => {
            if (idsSet.has(f.id as string)) return { ...f, read: true };
            return f;
        });

        await prisma.assembledProposal.update({
            where: { id: proposalId },
            data: {
                scopeData: { ...scopeData, clientFeedback: updated } as unknown as Prisma.JsonObject,
            },
        });

        return updated;
    }

    static async deleteProposal(userId: string, id: string) {
        const proposal = await prisma.assembledProposal.findUnique({ where: { id } });
        if (!proposal || proposal.userId !== userId) throw new Error("NOT_FOUND");
        return prisma.assembledProposal.delete({ where: { id } });
    }

    // ── FILA DE APROVAÇÃO (QUEUE) ─────────────────────────────────────────────

    static async getQueue(userId: string) {
        // Obter todas as propostas "in_review" daquele user (que é o dono da conta/agência)
        const queue = await prisma.assembledProposal.findMany({
            where: {
                userId,
                status: "in_review" // Pending approval
            },
            include: {
                user: { select: { id: true, name: true, avatar: true } },
                client: { select: { id: true, name: true, company: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        // A UI do Queue espera esses mappings:
        return queue.map(p => ({
            id: p.id,
            clientName: p.client?.name || "Cliente Desconhecido",
            contactName: p.client?.company || undefined,
            totalValue: this.simulateValue(p.totalHours), // Valor simulado baseado em horas caso não exista real salvo no deal
            totalHours: p.totalHours,
            createdAt: p.createdAt.toISOString(),
            urgency: p.urgency || "media",
            status: p.status,
            projectType: ["Escopo Técnico"],
            scope: p.scopeData,
            reviewHistory: p.reviewHistory || [],
            user: p.user
        }));
    }

    private static simulateValue(hours: number) {
        return hours * 150; // Valor horário genérico apenas para visualização da grade 
    }

    static async reviewProposal(
        userId: string,
        proposalId: string,
        data: { action: "approve" | "adjust" | "reject"; comment: string; by: string }
    ) {
        const proposal = await prisma.assembledProposal.findUnique({ where: { id: proposalId } });
        if (!proposal || proposal.userId !== userId) throw new Error("NOT_FOUND");

        const history = (proposal.reviewHistory as unknown[]) || [];
        const newEntry = {
            id: `rev_${Date.now()}`,
            action: data.action === "approve" ? "Aprovado" : data.action === "adjust" ? "Solicitados Ajustes" : "Rejeitado",
            by: data.by,
            date: new Date().toISOString(),
            comment: data.comment
        };

        const newStatus = data.action === "approve" ? "approved" 
                        : data.action === "adjust" ? "needs_adjustment" 
                        : "rejected";

        const updated = await prisma.assembledProposal.update({
            where: { id: proposalId },
            data: {
                status: newStatus,
                reviewHistory: [...history, newEntry] as unknown as Prisma.JsonObject
            }
        });

        // Grava no Activity Log a intervenção do gerente
        void prisma.activityLog.create({
            data: {
                userId,
                category: "proposal",
                action: `Proposta ${newEntry.action}`,
                description: `A proposta de ${proposal.title} foi ${newEntry.action.toLowerCase()}.`,
                userName: data.by,
                userRole: "Gerência",
                target: proposal.id.slice(0, 8),
                ip: "127.0.0.1",
            }
        }).catch(() => {});

        return updated;
    }

    // ── AI STREAM ─────────────────────────────────────────────────────────────

    static async streamGenerate(userId: string, data: ScopeData, res: Response) {
        // 1. Credentials — use OWNER's global integration
        const ownerId = await getOwnerUserId();
        const setting = ownerId ? await prisma.integrationSetting.findFirst({
            where: { userId: ownerId, provider: "proposal_minimax", isActive: true },
        }) : null;

        if (!setting) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: "Integracao Minimax nao configurada." })}\n\n`);
            res.end();
            return;
        }

        const creds = setting.credentials as unknown as MinimaxCredentials;
        if (!creds?.apiKey) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: "API Key Minimax nao encontrada." })}\n\n`);
            res.end();
            return;
        }

        // 2. Build prompts (KB intentionally not sent - enterprise values inflate estimates)
        const mode = data.mode ?? "scope";
        const { systemPrompt, userPrompt } = mode === "estimate"
            ? AssemblerService.buildEstimatePrompts(data)
            : mode === "scope_integrations"
                ? AssemblerService.buildIntegrationsPrompts(data)
                : AssemblerService.buildScopePrompts(data, mode === "scope");

        // DEBUG: trace the prompt being sent
        const usersInfo = data.users.map(u => `"${u.userName}" (${u.platforms.map(p => p.platformName).join(", ")})`).join("; ");
        console.log(`[ASSEMBLER-API] mode=${mode}, users=[${usersInfo}], userPrompt.length=${userPrompt.length}`);
        console.log(`[ASSEMBLER-API] userPrompt:\n${userPrompt.substring(0, 500)}`);


        // 3. Call Minimax (Anthropic-compatible API)
        try {
            const minResp = await fetch("https://api.minimax.io/anthropic/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": creds.apiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: creds.model ?? "MiniMax-M2.7",
                    max_tokens: mode === "estimate" ? 8192 : 32768,
                    system: systemPrompt,
                    stream: true,
                    messages: [{ role: "user", content: userPrompt }],
                }),
            });

            if (!minResp.ok) {
                const errorBody = await minResp.text();
                res.write(`event: error\ndata: ${JSON.stringify({ message: `Erro Minimax ${minResp.status}: ${minResp.statusText}`, details: errorBody })}\n\n`);
                res.end();
                return;
            }

            if (!minResp.body) {
                res.write(`event: error\ndata: ${JSON.stringify({ message: "Stream Minimax vazio." })}\n\n`);
                res.end();
                return;
            }

            // 4. Pipe SSE stream to client
            const reader = minResp.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let done = false;
            let buffer = "";

            const keepAlive = setInterval(() => {
                if (!res.writableEnded) res.write(": keepalive\n\n");
            }, 20_000);

            try {
                while (!done) {
                    const { value, done: streamDone } = await reader.read();
                    done = streamDone;

                    if (value) {
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split("\n");
                        buffer = lines.pop() ?? "";

                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (!trimmed || trimmed.startsWith("event:")) continue;

                            if (trimmed.startsWith("data: ")) {
                                const dataStr = trimmed.slice(6);
                                if (dataStr === "[DONE]") { done = true; break; }

                                try {
                                    const parsed = JSON.parse(dataStr) as {
                                        type?: string;
                                        delta?: { text?: string };
                                    };
                                    if (
                                        parsed.type === "content_block_delta" &&
                                        parsed.delta?.text
                                    ) {
                                        res.write(`event: message\ndata: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
                                    }
                                } catch { /* incomplete chunk */ }
                            }
                        }
                    }
                }
            } finally {
                clearInterval(keepAlive);
            }

            res.write(`event: end\ndata: ${JSON.stringify({ done: true })}\n\n`);
            res.end();

        } catch (err) {
            const message = err instanceof Error ? err.message : "Falha ao conectar com Minimax.";
            res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
            res.end();
        }
    }

    // ── Prompt Builders ───────────────────────────────────────────────────────

    private static buildScopePrompts(data: ScopeData, includeIntegrations: boolean = false) {
        const integrationsRules = includeIntegrations ? [
            "AO FINAL de todos os perfis, gere OBRIGATORIAMENTE:",
            "",
            "## Integracoes",
            "- **Integracao:** [Nome] | Descricao: [Para que serve] | Horas: [N]",
            "  (onde N e um numero decimal: 0.5, 1, 1.5, 2, 3 etc.)",
            "",
        ].join("\n") : "";

        const integStructureRule = includeIntegrations ? "5. SECAO INTEGRACOES: minimo 2, MAXIMO 5 itens. Apenas APIs externas reais (gateway de pagamento, e-mail transacional, SMS, OAuth de terceiros, mapas, cloud storage)." : "";

        const systemPrompt = [
            "Voce e um Arquiteto de Software senior especializado em escopos tecnicos detalhados para uma software house de PEQUENO PORTE.",
            "",
            "FORMATO OBRIGATORIO (respeite o numero exato de '#' em cada nivel):",
            "",
            "## Perfil: [Nome do Usuario]",
            "### Plataforma: [Nome da Plataforma]",
            "#### Modulo: [Nome do Modulo]",
            "##### Tela: [Nome da Tela]",
            "- **Funcionalidade:** [Titulo] | Descricao: [Descricao tecnica em 1 linha] | Horas: [N]",
            "  (onde N e um numero decimal: 0.5, 1, 1.5, 2, 3 etc. Use incrementos de 0.5)",
            "",
            integrationsRules,
            "REGRAS ESTRUTURAIS:",
            "1. Gere TODOS os perfis e TODAS as plataformas listadas pelo usuario. NAO omita nenhum.",
            "2. Minimo de 3 funcionalidades por tela.",
            "3. Cada definicao em uma unica linha (sem quebra de linha no meio).",
            "4. Sem sub-bullets.",
            "5. GERE TODO O CONTEUDO ESTRITAMENTE EM PORTUGUES DO BRASIL (pt-BR).",
            "6. MANTENHA TODOS OS ACENTOS CORRETAMENTE (á, é, í, ó, ú, ã, õ, ç, etc). NUNCA remova a acentuacao das palavras.",
            integStructureRule,
            "",
            "========================================",
            "TABELA DE HORAS - USE ESTES VALORES COMO TETO",
            "========================================",
            "",
            "Um desenvolvedor senior SOLO implementando cada funcionalidade:",
            "",
            "- Exibir dado/label/badge/icone/status: 0.5h",
            "- Campo de formulario simples com mascara: 0.5h",
            "- Campo com validacao customizada: 1h",
            "- Botao com acao simples (excluir, ativar, copiar): 0.5h",
            "- Listagem simples (tabela ou cards, sem filtros): 1h",
            "- Listagem com filtros + busca + paginacao: 2h",
            "- Tela de detalhe / visualizacao: 1h",
            "- Formulario de cadastro padrao (4-8 campos): 1.5h",
            "- Formulario complexo (10+ campos, condicional): 2h a 3h",
            "- CRUD completo (listagem + form + delete): 3h",
            "- Upload de arquivo com preview: 1h",
            "- Login + JWT + refresh token (implementacao completa): 3h",
            "- Cadastro de usuario + validacao de e-mail: 2h",
            "- Recuperacao de senha (e-mail + reset): 1.5h",
            "- Grafico simples (pizza, barra, linha): 1h",
            "- Dashboard com 4-6 KPIs + graficos: 3h",
            "- Relatorio com exportacao PDF/Excel: 2h",
            "- Wizard multi-etapas (3-5 steps): 3h",
            "- Notificacoes push/e-mail via SDK: 1.5h",
            "- Integracao REST com API externa: 2h",
            "- Integracao gateway de pagamento: 3h",
            "- Mapa com pinos/rotas: 2h",
            "- Chat em tempo real (WebSocket): 3h",
            "",
            "PROIBICOES ABSOLUTAS:",
            "- NUNCA exceda 4h em funcionalidades de UI (listas, forms, filtros, cards, botoes).",
            "- NUNCA atribua mais de 1h para exibir, listar ou filtrar dados.",
            "- MAXIMO ABSOLUTO: 4h por funcionalidade. Se algo precisa de mais, quebre em 2 funcionalidades.",
            "- Funcionalidades repetidas em telas diferentes (ex: CRUD em varias entidades) devem ter horas IGUAIS ou MENORES (reuso de padrao).",
            "- NAO invente complexidade. Estime o que foi pedido, nao o que poderia ser.",
        ].join("\n");

        // Build user prompt with full platform details for EVERY user
        const userLines = data.users
            .map((u) => {
                const platDetails = u.platforms
                    .map((p) => `  - Plataforma: "${p.platformName}"${p.modules.length > 0 ? ` (ja tem ${p.modules.length} modulos)` : ""}`)
                    .join("\n");
                return `- Perfil "${u.userName}":\n${platDetails}`;
            })
            .join("\n");

        const userPrompt = [
            `Projeto: ${data.projectSummary}`,
            "",
            "Estrutura solicitada:",
            userLines,
            "",
            "INSTRUCOES:",
            "1. Gere o escopo COMPLETO para CADA perfil e CADA plataforma listada acima.",
            "2. Para cada plataforma, crie modulos, telas e funcionalidades relevantes.",
            "3. Use a tabela de horas do sistema para estimar. Prefira sempre os valores MENORES da faixa.",
            "4. Aja exatamente conforme a instrucao.",
        ].join("\n");

        return { systemPrompt, userPrompt };
    }

    private static buildIntegrationsPrompts(data: ScopeData) {
        const systemPrompt = [
            "Voce e um Arquiteto de Software senior.",
            "",
            "SUA UNICA FUNCAO E GERAR A SECAO DE INTEGRACOES para o projeto fornecido.",
            "NAO gere perfis, modulos ou funcionalidades locais.",
            "",
            "FORMATO OBRIGATORIO:",
            "## Integracoes",
            "- **Integracao:** [Nome da API] | Descricao: [O que essa integracao faz no sistema] | Horas: [N]",
            "  (onde N e um numero decimal: 1, 1.5, 2, 3 etc. MAXIMO 4h por item)",
            "",
            "REGRAS:",
            "1. Liste apenas APIs de prateleira (gateways de pagamento, despachantes de e-mail, redes sociais para login, emissao de NFe, servicos de nuvem/storage, rastreamento).",
            "2. Minimo de 1 integracao e Maximo de 6.",
            "3. Mantenha descricoes sumarias em 1 linha.",
            "4. GERE EM PORTUGUES DO BRASIL (pt-BR).",
            "5. MANTENHA TODOS OS ACENTOS CORRETAMENTE (á, é, í, ó, ú, ã, õ, ç).",
        ].join("\n");

        const userPrompt = data.projectSummary || "O usuario nao enviou sumario do projeto.";

        return { systemPrompt, userPrompt };
    }

    private static buildEstimatePrompts(data: ScopeData) {
        const systemPrompt = [
            "Voce e um Engenheiro de Software Senior estimando horas para uma software house de PEQUENO PORTE.",
            "",
            "Sua UNICA tarefa e atribuir horas realistas a funcionalidades ja definidas.",
            "",
            "FORMATO (sem nenhum texto adicional - apenas a estrutura abaixo):",
            "## Perfil: [Nome]",
            "### Plataforma: [Nome]",
            "#### Modulo: [Nome]",
            "##### Tela: [Nome]",
            "- **Funcionalidade:** [Titulo Exato] | Horas: [N]",
            "  (onde N e um numero decimal: 0.5, 1, 1.5, 2, 3 etc.)",
            "",
            "## Integracoes",
            "- **Integracao:** [Titulo Exato] | Horas: [N]",
            "  (onde N e um numero decimal: 0.5, 1, 1.5, 2, 3 etc.)",
            "",
            "REGRAS:",
            "1. Copie titulos EXATAMENTE como fornecidos.",
            "2. Sem descricao, sem explicacoes, sem texto extra.",
            "3. Cubra TODOS os perfis e TODAS as plataformas - nao omita nenhum.",
            "4. GERE TODO O CONTEUDO ESTRITAMENTE EM PORTUGUES DO BRASIL (pt-BR) e COM ACENTOS CORRETOS.",
            "5. Use ESTES valores como referencia:",
            "",
            "- Exibir dado/label/icone/status: 0.5h",
            "- Campo de formulario simples: 0.5h",
            "- Campo com validacao complexa: 1h",
            "- Botao com acao: 0.5h",
            "- Listagem simples: 1h",
            "- Listagem com filtros/busca/paginacao: 2h",
            "- Tela de detalhe: 1h",
            "- Formulario padrao (4-8 campos): 1.5h",
            "- Formulario complexo (10+): 2h a 3h",
            "- CRUD completo: 3h",
            "- Upload de arquivo: 1h",
            "- Login + JWT: 3h",
            "- Cadastro de usuario: 2h",
            "- Recuperacao de senha: 1.5h",
            "- Grafico simples: 1h",
            "- Dashboard (4-6 KPIs): 3h",
            "- Relatorio exportavel: 2h",
            "- Wizard multi-etapas: 3h",
            "- Notificacoes push/e-mail: 1.5h",
            "- Integracao REST: 2h",
            "- Gateway de pagamento: 3h",
            "- Mapa com rotas: 2h",
            "",
            "PROIBIDO: mais de 4h em qualquer funcionalidade de UI. MAXIMO ABSOLUTO: 4h por item.",
        ].join("\n");

        const scopeLines: string[] = [];
        for (const u of data.users ?? []) {
            scopeLines.push(`## Perfil: ${u.userName}`);
            for (const p of u.platforms ?? []) {
                scopeLines.push(`### Plataforma: ${p.platformName}`);
                for (const m of p.modules ?? []) {
                    scopeLines.push(`#### Modulo: ${m.title}`);
                    for (const s of m.screens ?? []) {
                        scopeLines.push(`##### Tela: ${s.title}`);
                        for (const f of s.functionalities ?? []) {
                            scopeLines.push(`- **Funcionalidade:** ${f.title}`);
                        }
                    }
                }
            }
        }
        if (data.integrations?.length) {
            scopeLines.push("\n## Integracoes");
            for (const i of data.integrations) {
                scopeLines.push(`- **Integracao:** ${i.title}`);
            }
        }

        const userPrompt = [
            `Projeto: ${data.projectSummary}`,
            "",
            "Escopo para estimar:",
            "",
            scopeLines.join("\n"),
            "",
            "Estime as horas de cada item acima. Cubra TODOS os perfis e plataformas.",
        ].join("\n");

        return { systemPrompt, userPrompt };
    }

    // ── Hour Rollup (for DB persistence) ─────────────────────────────────────

    private static calcTotalHours(data: ScopeData): number {
        let total = 0;
        for (const u of data.users ?? [])
            for (const p of u.platforms ?? [])
                for (const m of p.modules ?? [])
                    for (const s of m.screens ?? [])
                        for (const f of s.functionalities ?? [])
                            total += f.estimatedHours ?? 0;
        for (const i of data.integrations ?? [])
            total += i.estimatedHours ?? 0;
        return total;
    }
}
