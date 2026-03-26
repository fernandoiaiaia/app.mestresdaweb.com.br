import { Router, Request, Response } from "express";
import { prisma } from "../../config/database.js";
import { logger } from "../../lib/logger.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { devProjectsService } from "../dev-projects/dev-projects.service.js";
import { hashPassword } from "../../lib/hash.js";

// ═══════════════════════════════════════
// Proposals Module Routes
// ═══════════════════════════════════════

const router = Router();
router.use(authMiddleware);

// ─── Local Types ──────────────────────────────
interface GapItem {
    category: string;
    title: string;
    description: string;
    priority: "alta" | "média" | "baixa";
}

interface AnalyzeGapsResponse {
    gaps: GapItem[];
    summary: string;
    completenessScore: number;
}

interface EstimateLine {
    role: string;
    hours: number;
    rate: number;
}

interface EstimateResult {
    lines: EstimateLine[];
    totalHours: number;
    totalCost: number;
    scopeWithHours?: string;
}

/**
 * POST /api/proposals
 * Creates a new proposal in the database.
 *
 * Body: { title, clientId?, expiresAt?, scopeRaw, gapAnalysis?, estimate? }
 */
router.post("/", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Não autenticado." },
            });
        }

        const { title, clientId, expiresAt, scopeRaw, gapAnalysis, estimate, clientPortalEmail, clientPortalPassword } = req.body as {
            title?: string;
            clientId?: string | null;
            expiresAt?: string;
            scopeRaw?: string;
            gapAnalysis?: any;
            estimate?: any;
            clientPortalEmail?: string;
            clientPortalPassword?: string;
        };

        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: { code: "VALIDATION", message: "O título é obrigatório." },
            });
        }

        if (!scopeRaw || typeof scopeRaw !== "string" || scopeRaw.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: { code: "VALIDATION", message: "O escopo é obrigatório (mínimo 10 caracteres)." },
            });
        }

        let finalViewerId: string | undefined = undefined;

        if (clientPortalEmail && clientPortalPassword) {
            const emailStr = String(clientPortalEmail).trim().toLowerCase();
            const passStr = String(clientPortalPassword).trim();
            const hashedPassword = await hashPassword(passStr);
            
            const userExists = await prisma.user.findUnique({ where: { email: emailStr } });
            if (userExists) {
                await prisma.user.update({
                    where: { id: userExists.id },
                    data: { password: hashedPassword, role: "VIEWER", allowedApps: ["client"] }
                });
                finalViewerId = userExists.id;
            } else {
                const newUser = await prisma.user.create({
                    data: {
                        name: "Cliente",
                        email: emailStr,
                        password: hashedPassword,
                        role: "VIEWER",
                        allowedApps: ["client"]
                    }
                });
                finalViewerId = newUser.id;
            }
        } else if (clientId) {
            const clientEntity = await prisma.client.findUnique({ where: { id: clientId } });
            if (clientEntity?.email) {
                const viewerExists = await prisma.user.findUnique({ where: { email: clientEntity.email } });
                if (viewerExists && viewerExists.role === "VIEWER") {
                    finalViewerId = viewerExists.id;
                }
            }
        }

        const proposal = await prisma.proposal.create({
            data: {
                userId,
                title: title.trim(),
                clientId: clientId || null,
                viewerId: finalViewerId || null,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                scopeRaw: scopeRaw.trim(),
                gapAnalysis: gapAnalysis ?? undefined,
                estimate: estimate ?? undefined,
                status: "draft"
            },
            select: { id: true },
        });

        logger.info({ userId, proposalId: proposal.id }, "Proposal created");

        return res.status(201).json({ success: true, data: { id: proposal.id } });
    } catch (err: any) {
        logger.error({ err }, "Error creating proposal");
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL", message: "Erro interno ao criar proposta: " + (err?.message || String(err)) },
        });
    }
});

/**
 * POST /api/proposals/generate-scope
 * Sends a summary/prompt to MiniMax and returns a highly detailed project scope.
 *
 * Body: { summary: string; title: string }
 */
router.post("/generate-scope", async (req: Request, res: Response) => {
    try {
        req.socket?.setTimeout(600000); // 10 minutes
        res.socket?.setTimeout(600000);
        const userId = (req as any).user?.userId;
        const { summary, title } = req.body as {
            summary: string;
            title: string;
        };

        if (!summary || typeof summary !== "string" || summary.trim().length < 10) {
            return res.status(400).json({
                success: false,
                error: { message: "O resumo deve ter pelo menos 10 caracteres." },
            });
        }

        const integration = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider: "proposal_minimax" } },
        });

        if (!integration || !integration.isActive) {
            return res.status(400).json({
                success: false,
                error: {
                    message:
                        "Integração MiniMax não configurada ou inativa. " +
                        "Ative-a em Configurações → Integrações → MiniMax M2.5 (Propostas).",
                },
            });
        }

        const creds = integration.credentials as Record<string, any>;
        const apiKey = creds?.apiKey as string | undefined;
        const groupId = creds?.groupId as string | undefined;
        const model = (creds?.model as string | undefined) || "MiniMax-M2.5";
        const maxTokens = parseInt(creds?.maxTokens as string, 10) || 8192;

        if (!apiKey || !groupId) {
            return res.status(400).json({
                success: false,
                error: { message: "API Key ou Group ID não encontrados na integração MiniMax." },
            });
        }

        const systemPrompt = `Você é um Analista de Sistemas e Arquiteto de Software Sênior especializado em elicitação e especificação de requisitos funcionais e técnicos.
Sua missão é receber um resumo de um projeto/software de um cliente e devolver o Escopo Detalhado estruturado EXATAMENTE no formato abaixo.
Seja exaustivamente completo, detalhista, profissional e criativo. Descreva painéis administrativos, segurança, relatórios e permissões granulares mesmo se a requisição original for simples.

Use português do Brasil. O formato obrigatório de saída de texto é este:

Escopo de Software — [Nome sugerido]
Versão: 1.0
 Tipo: Documento de Escopo Funcional
 Plataformas: [Lista de plataformas, ex: Mobile (iOS & Android) · Web (Painel) · API]

1. Usuários do Sistema
Perfil | Descrição
[Listar cada perfil na tabela texto]

2. Plataforma
[Descrever cada plataforma do sistema, como 2.1 Aplicativo do Cliente — iOS e Android (React Native)]

3. Módulos / Menu do Sistema
Módulo | Descrição | Plataforma | Perfil
[Listar Módulos gerais com |]

4. Telas e Descrições
[Para cada Plataforma listada na seção 2, documentar exaustivamente todas as Telas:]
Tela: [Nome da Tela]
Plataforma: [Plataforma correspondente]
Descrição: [Detalhes do objetivo da tela]
Funcionalidades:
- [Item 1 e detalhes]
- [Item 2 e detalhes]

5. Integrações
[Serviço externo, ex: Stripe, SendGrid, AWS, Google Maps]: [Motivo e onde será usado]`;

        const userMessage = `Por favor, elabore o escopo completo para o projeto "${title || "Sem título"}".\n\nResumo e Objetivo fornecido pelo cliente:\n"${summary.trim()}"`;

        const miniMaxUrl = `https://api.minimaxi.chat/v1/chat/completions?GroupId=${groupId}`;
        const requestBody = {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            temperature: 0.6,
            max_tokens: maxTokens,
        };

        logger.info({ userId, model, url: miniMaxUrl }, "Calling MiniMax generate-scope");

        const miniMaxRes = await fetch(miniMaxUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!miniMaxRes.ok) {
            const errText = await miniMaxRes.text().catch(() => "");
            let errMsg = `HTTP ${miniMaxRes.status}`;
            try {
                const errBody = JSON.parse(errText) as any;
                errMsg = errBody?.error?.message || errBody?.base_resp?.status_msg || errMsg;
            } catch { /* ignore */ }
            logger.warn({ userId, model, status: miniMaxRes.status, errMsg }, "MiniMax generate-scope failed");
            return res.status(502).json({
                success: false,
                error: { message: `MiniMax retornou um erro: ${errMsg}` },
            });
        }

        const rawText = await miniMaxRes.text();
        let miniMaxData: any;
        try {
            miniMaxData = JSON.parse(rawText);
        } catch {
            return res.status(502).json({
                success: false,
                error: { message: "Resposta do MiniMax inválida. Tente novamente." },
            });
        }

        const rawContent: string =
            miniMaxData?.choices?.[0]?.message?.content ||
            miniMaxData?.reply ||
            "";

        if (!rawContent) {
            return res.status(502).json({
                success: false,
                error: { message: "MiniMax retornou resposta vazia. Tente novamente." },
            });
        }

        let cleaned = rawContent.trim();
        const fenceMatch = cleaned.match(/```(?:text)?\s*\n?([\s\S]*?)\n?\s*```/i);
        if (fenceMatch) {
            cleaned = fenceMatch[1].trim();
        }

        logger.info({ userId, model, generatedLen: cleaned.length }, "generate-scope completed");
        return res.json({ success: true, data: { generatedScope: cleaned } });
    } catch (err: any) {
        logger.error({ err }, "Error in generate-scope");
        return res
            .status(500)
            .json({ success: false, error: { message: "Erro interno ao gerar escopo: " + String(err) } });
    }
});

/**
 * POST /api/proposals/analyze-gaps
 * Sends the current scope to MiniMax 2.5M and returns a structured gap analysis.
 *
 * Body: { scopeText: string; proposalTitle?: string }
 */
router.post("/analyze-gaps", async (req: Request, res: Response) => {
    try {
        req.socket?.setTimeout(600000); // 10 minutes
        res.socket?.setTimeout(600000);
        const userId = (req as any).user?.userId;
        const { scopeText, proposalTitle } = req.body as {
            scopeText: string;
            proposalTitle?: string;
        };

        if (!scopeText || typeof scopeText !== "string" || scopeText.trim().length < 50) {
            return res.status(400).json({
                success: false,
                error: { message: "scopeText inválido ou muito curto." },
            });
        }

        // Fetch the user's proposal_minimax integration
        const integration = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider: "proposal_minimax" } },
        });

        if (!integration || !integration.isActive) {
            return res.status(400).json({
                success: false,
                error: {
                    message:
                        "Integração MiniMax não configurada ou inativa. " +
                        "Ative-a em Configurações → Integrações → MiniMax M2.5 (Propostas).",
                },
            });
        }

        const creds = integration.credentials as Record<string, any>;
        const apiKey = creds?.apiKey as string | undefined;
        const groupId = creds?.groupId as string | undefined;
        const model = (creds?.model as string | undefined) || "MiniMax-M2.5";
        const maxTokens = parseInt(creds?.maxTokens as string, 10) || 8192;

        if (!apiKey || !groupId) {
            return res.status(400).json({
                success: false,
                error: { message: "API Key ou Group ID não encontrados na integração MiniMax." },
            });
        }

        // ── Build the prompt ──────────────────────────────
        const systemPrompt = `Você é um consultor sênior de engenharia de software especializado em análise de escopo de projetos.

Sua tarefa é analisar o escopo de um projeto de software e se perguntar:
1. Falta alguma PLATAFORMA nesse escopo? (Web, Mobile, App, Desktop, API, etc.)
2. Falta algum USUÁRIO nesse escopo? (Perfis/tipos de usuário que deveriam existir)
3. Falta algum MÓDULO nesse escopo? (Áreas funcionais que deveriam existir)
4. Falta alguma TELA nesse escopo? (Páginas/views que estão faltando)
5. Falta alguma FUNCIONALIDADE nesse escopo? (Features que deveriam existir)
6. Falta alguma INTEGRAÇÃO nesse escopo? (Conexões com serviços externos)

Responda SOMENTE com um objeto JSON válido no seguinte formato rigoroso (sem markdown, sem texto extra, sem \`\`\`):
{
  "gaps": [
    {
      "category": "<Plataformas|Usuários|Módulos|Telas|Funcionalidades|Integrações>",
      "title": "<Título curto da lacuna>",
      "description": "<Descrição clara do que está faltando e por quê é importante>",
      "priority": "<alta|média|baixa>",
      "injection": {
        "platform": "<Nome exato da Plataforma alvo do escopo original ou uma Nova>",
        "user": "<Nome exato do Usuário/Perfil alvo ou 'Geral'>",
        "module": "<Nome exato do Módulo alvo ou um Novo>",
        "screen": "<Nome exato da Tela alvo ou uma Nova (se aplicável)>"
      }
    }
  ],
  "summary": "<Resumo em 2-3 frases do estado geral do escopo>",
  "completenessScore": <número inteiro de 0 a 100 indicando o nível de completude>
}

Regras:
- O campo 'injection' é OBRIGATÓRIO. Ele mapeia EXATAMENTE onde essa lacuna deve ser inserida na árvore de escopos.
- Se a lacuna pertencer a uma entidade que já existe no texto, use O MESMO NOME EXATO para 'platform', 'user', 'module', e 'screen'.
- Se for uma categoria inteiramente nova (ex: uma Plataforma nova inteira), preencha o caminho sugerido.
- Retorne de 3 a 15 lacunas relevantes distribuídas entre as 6 categorias.
- Não invente lacunas óbvias que já estão claramente no escopo.
- Seja específico e construtivo. Foque em itens que o cliente provavelmente não pensou.
- Use português do Brasil.`;

        const userMessage = `Proposta: ${proposalTitle || "Sem título"}

ESCOPO DO PROJETO:
${scopeText.trim()}

Analise o escopo acima e identifique lacunas nas 6 categorias: Plataformas, Usuários, Módulos, Telas, Funcionalidades e Integrações.`;

        // ── Call MiniMax (OpenAI-compatible endpoint) ─────
        const miniMaxUrl = `https://api.minimaxi.chat/v1/chat/completions?GroupId=${groupId}`;
        const requestBody = {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            temperature: 0.4,
            max_tokens: maxTokens,
            response_format: { type: "json_object" },
        };

        logger.info(
            { userId, model, url: miniMaxUrl, scopeLen: scopeText.length },
            "Calling MiniMax analyze-gaps"
        );

        const miniMaxRes = await fetch(miniMaxUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!miniMaxRes.ok) {
            const errText = await miniMaxRes.text().catch(() => "");
            let errMsg = `HTTP ${miniMaxRes.status}`;
            try {
                const errBody = JSON.parse(errText) as any;
                errMsg =
                    errBody?.error?.message ||
                    errBody?.base_resp?.status_msg ||
                    errMsg;
            } catch { /* keep default errMsg */ }
            logger.warn(
                { userId, model, status: miniMaxRes.status, errMsg, errText: errText.slice(0, 500) },
                "MiniMax analyze-gaps request failed"
            );
            return res.status(502).json({
                success: false,
                error: { message: `MiniMax retornou um erro: ${errMsg}` },
            });
        }

        const rawText = await miniMaxRes.text();
        logger.info(
            { userId, rawLen: rawText.length, preview: rawText.slice(0, 300) },
            "MiniMax raw response received"
        );

        let miniMaxData: any;
        try {
            miniMaxData = JSON.parse(rawText);
        } catch {
            logger.error(
                { userId, rawText: rawText.slice(0, 1000) },
                "MiniMax response is not valid JSON at all"
            );
            return res.status(502).json({
                success: false,
                error: { message: "Resposta do MiniMax inválida. Tente novamente." },
            });
        }

        // Extract the content from OpenAI-compatible response
        const rawContent: string =
            miniMaxData?.choices?.[0]?.message?.content ||
            miniMaxData?.reply ||
            "";

        if (!rawContent) {
            logger.error(
                { userId, miniMaxData: JSON.stringify(miniMaxData).slice(0, 1000) },
                "MiniMax returned empty content"
            );
            return res.status(502).json({
                success: false,
                error: { message: "MiniMax retornou resposta vazia. Tente novamente." },
            });
        }

        // Robust markdown / text stripping — handles multi-line fences and surrounding text
        let cleaned = rawContent.trim();
        // Remove markdown code fences (```json ... ``` or ``` ... ```)
        const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i);
        if (fenceMatch) {
            cleaned = fenceMatch[1].trim();
        } else {
            // Try to extract JSON object even if surrounded by text
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleaned = jsonMatch[0];
            }
        }

        let parsed: AnalyzeGapsResponse;
        try {
            parsed = JSON.parse(cleaned) as AnalyzeGapsResponse;
        } catch (parseErr) {
            logger.error(
                { userId, rawContent: rawContent.slice(0, 1500), cleaned: cleaned.slice(0, 1500) },
                "Failed to parse MiniMax JSON response"
            );
            return res.status(502).json({
                success: false,
                error: { message: "Resposta da IA inválida. Tente novamente." },
            });
        }

        // Basic validation
        if (!Array.isArray(parsed.gaps)) {
            parsed.gaps = [];
        }

        logger.info(
            { userId, model, gapsCount: parsed.gaps.length, score: parsed.completenessScore },
            "analyze-gaps completed"
        );

        return res.json({ success: true, data: parsed });
    } catch (err) {
        logger.error({ err }, "Error in analyze-gaps");
        return res
            .status(500)
            .json({ success: false, error: { message: "Erro interno ao analisar lacunas." } });
    }
});

/**
 * POST /api/proposals/estimate
 * Calls MiniMax to generate a structured effort estimate from the final scope.
 * Uses the user's registered professionals and their real hourly rates.
 *
 * Body: { scopeText: string; proposalTitle?: string }
 * Returns: { lines: EstimateLine[]; totalHours: number; totalCost: number }
 */
router.post("/estimate", async (req: Request, res: Response) => {
    try {
        req.socket?.setTimeout(600000); // 10 minutes
        res.socket?.setTimeout(600000);
        const userId = (req as any).user?.userId;
        const { scopeText, proposalTitle } = req.body as {
            scopeText: string;
            proposalTitle?: string;
        };

        if (!scopeText || typeof scopeText !== "string" || scopeText.trim().length < 50) {
            return res.status(400).json({
                success: false,
                error: { message: "scopeText inválido ou muito curto." },
            });
        }

        // ── Fetch user's active professionals ─────────────
        const professionals = await prisma.professional.findMany({
            where: { userId, isActive: true },
            select: { role: true, seniority: true, hourlyRate: true },
            orderBy: { role: "asc" },
        });

        if (professionals.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message:
                        "Nenhum profissional ativo cadastrado. " +
                        "Cadastre seus profissionais em Configurações → Profissionais antes de gerar estimativas.",
                },
            });
        }

        // Build a lookup map for post-processing (normalised role → rate)
        const rateByRole = new Map<string, number>();
        const professionalsList: string[] = [];
        for (const p of professionals) {
            const key = p.role.trim().toLowerCase();
            rateByRole.set(key, Number(p.hourlyRate));
            professionalsList.push(
                `- ${p.role}${p.seniority ? ` (${p.seniority})` : ""}: R$ ${Number(p.hourlyRate).toFixed(0)}/h`
            );
        }

        // Fetch user's MiniMax integration
        const integration = await prisma.integrationSetting.findUnique({
            where: { userId_provider: { userId, provider: "proposal_minimax" } },
        });

        if (!integration || !integration.isActive) {
            return res.status(400).json({
                success: false,
                error: {
                    message:
                        "Integração MiniMax não configurada ou inativa. " +
                        "Ative-a em Configurações → Integrações → MiniMax M2.5 (Propostas).",
                },
            });
        }

        const creds = integration.credentials as Record<string, any>;
        const apiKey = creds?.apiKey as string | undefined;
        const groupId = creds?.groupId as string | undefined;
        const model = (creds?.model as string | undefined) || "MiniMax-M2.5";
        const maxTokens = parseInt(creds?.maxTokens as string, 10) || 8192;

        if (!apiKey || !groupId) {
            return res.status(400).json({
                success: false,
                error: { message: "API Key ou Group ID não encontrados na integração MiniMax." },
            });
        }

        // ── Build the prompt (constrained to user's professionals) ──
        const systemPrompt = `Você é um gerente de projetos de software sênior especializado em estimativa de esforço.

Dado o escopo completo de um projeto, você deve estimar as HORAS necessárias por perfil profissional.

IMPORTANTE: Use SOMENTE os profissionais listados abaixo. NÃO invente perfis diferentes.
Os valores/hora (rate) já estão definidos — copie-os EXATAMENTE como informados.

PROFISSIONAIS DISPONÍVEIS:
${professionalsList.join("\n")}

Responda EXATAMENTE neste formato (um bloco JSON seguido do escopo completo editado):

\`\`\`json
{
  "lines": [
    { "role": "<nome EXATO do perfil da lista acima>", "hours": <horas estimadas (inteiro)>, "rate": <valor/hora EXATO da lista acima> }
  ],
  "totalHours": <soma das horas>,
  "totalCost": <soma de hours*rate>
}
\`\`\`

===ESCOPO===
<O texto do ESCOPO COMPLETO, adicionando a linha exata 'Horas: X.X' abaixo de QUALQUER funcionalidade estimando o esforço individual daquela task. Exemplo:\nFuncionalidade: Login\nHoras: 2.5>

Regras:
- O bloco JSON deve conter apenas as propriedades listadas (lines, totalHours, totalCost).
- Inclua apenas os perfis relevantes na tabela JSON.
- Abaixo da tag ===ESCOPO===, transcreva TODO o escopo original intacto, mas adicionando "Horas: X" ao lado de CADA funcionalidade. Os pesos decimais podem ser usados (ex: 0.5).
- A soma das horas das funcionalidades no texto deve bater com 'totalHours'.
- Use português do Brasil.`;

        const userMessage = `Proposta: ${proposalTitle || "Sem título"}

ESCOPO COMPLETO DO PROJETO:
${scopeText.trim()}

Decomponha o esforço estimando HORAS para cada profissional relevante da lista fornecida.`;

        const miniMaxUrl = `https://api.minimaxi.chat/v1/chat/completions?GroupId=${groupId}`;
        const requestBody = {
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            temperature: 0.2,
            max_tokens: maxTokens,
        };

        logger.info(
            { userId, model, url: miniMaxUrl, scopeLen: scopeText.length, professionalsCount: professionals.length },
            "Calling MiniMax estimate (deterministic rates)"
        );

        const miniMaxRes = await fetch(miniMaxUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(requestBody),
        });

        if (!miniMaxRes.ok) {
            const errText = await miniMaxRes.text().catch(() => "");
            let errMsg = `HTTP ${miniMaxRes.status}`;
            try {
                const errBody = JSON.parse(errText) as any;
                errMsg = errBody?.error?.message || errBody?.base_resp?.status_msg || errMsg;
            } catch { /* keep default */ }
            logger.warn(
                { userId, model, status: miniMaxRes.status, errMsg },
                "MiniMax estimate request failed"
            );
            return res.status(502).json({
                success: false,
                error: { message: `MiniMax retornou um erro: ${errMsg}` },
            });
        }

        const rawText = await miniMaxRes.text();
        logger.info({ userId, rawLen: rawText.length }, "MiniMax estimate raw response received");

        try {
            require("fs").writeFileSync("/tmp/minimax_estimate.json", rawText);
        } catch (e) {
            // ignore
        }

        let miniMaxData: any;
        try {
            miniMaxData = JSON.parse(rawText);
        } catch {
            return res.status(502).json({
                success: false,
                error: { message: "Resposta do MiniMax inválida. Tente novamente." },
            });
        }

        const rawContent: string =
            miniMaxData?.choices?.[0]?.message?.content ||
            miniMaxData?.reply ||
            "";

        if (!rawContent) {
            return res.status(502).json({
                success: false,
                error: { message: "MiniMax retornou resposta vazia. Tente novamente." },
            });
        }

        // Splitting Logic
        let cleaned = rawContent.trim();
        let extractedScope = "";

        if (cleaned.includes("===ESCOPO===")) {
            const parts = cleaned.split("===ESCOPO===");
            cleaned = parts[0].trim();
            extractedScope = parts[1].trim();
        } else {
            // Fallback heuristics if AI missed the explicit tag
            const lastBrace = cleaned.lastIndexOf("}");
            if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
                extractedScope = cleaned.substring(lastBrace + 1).trim();
                cleaned = cleaned.substring(0, lastBrace + 1);
            }
        }

        const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/i);
        if (fenceMatch) {
            cleaned = fenceMatch[1].trim();
        } else {
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleaned = jsonMatch[0];
        }

        let parsed: EstimateResult;
        try {
            parsed = JSON.parse(cleaned) as EstimateResult;
        } catch {
            logger.error(
                { userId, rawContent: rawContent.slice(0, 1500) },
                "Failed to parse estimate JSON"
            );
            return res.status(502).json({
                success: false,
                error: { message: "Resposta da IA inválida. Tente novamente." },
            });
        }

        if (!Array.isArray(parsed.lines)) parsed.lines = [];

        // ── Post-process: override rates with registered values ──
        // Fuzzy match: normalise both sides and find the best match
        for (const line of parsed.lines) {
            const aiRole = (line.role || "").trim().toLowerCase();
            // Exact match first
            if (rateByRole.has(aiRole)) {
                line.rate = rateByRole.get(aiRole)!;
            } else {
                // Fuzzy: find the registered role that contains or is contained in the AI role
                let bestMatch: string | null = null;
                for (const [regRole] of rateByRole) {
                    if (aiRole.includes(regRole) || regRole.includes(aiRole)) {
                        bestMatch = regRole;
                        break;
                    }
                }
                if (bestMatch) {
                    line.rate = rateByRole.get(bestMatch)!;
                }
                // If no match at all, keep AI's rate as fallback (edge case)
            }
        }

        if (extractedScope && extractedScope.length > 50) {
            parsed.scopeWithHours = extractedScope;
        }

        // Recalculate totals with corrected rates
        parsed.totalHours = parsed.lines.reduce((s, l) => s + (l.hours || 0), 0);
        parsed.totalCost = parsed.lines.reduce((s, l) => s + (l.hours || 0) * (l.rate || 0), 0);

        logger.info(
            { userId, model, linesCount: parsed.lines.length, totalHours: parsed.totalHours, totalCost: parsed.totalCost },
            "estimate completed (deterministic rates)"
        );

        return res.json({ success: true, data: parsed });
    } catch (err) {
        logger.error({ err }, "Error in estimate");
        return res
            .status(500)
            .json({ success: false, error: { message: "Erro interno ao gerar estimativa." } });
    }
});

/**
 * POST /api/proposals/:id/send-to-dev
 * Converts a Proposal into a DevProject and sets its status to APPROVED.
 */
router.post("/:id/send-to-dev", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const proposalId = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ success: false, error: { message: "Não autenticado." } });
        }

        const existing = await prisma.proposal.findUnique({
            where: { id: proposalId },
            include: { client: true }
        });

        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ success: false, error: { message: "Proposta não encontrada ou acesso negado." } });
        }

        if (existing.status !== "APPROVED") {
            await prisma.proposal.update({
                where: { id: proposalId },
                data: { status: "APPROVED" }
            });
        }

        const role = (req as any).user?.role || "USER";
        const newProject = await devProjectsService.createFromProposal(proposalId, { userId, role });

        logger.info({ userId, proposalId, newProjectId: newProject.id }, "Proposal converted to DevProject via send-to-dev pipeline");

        return res.json({ success: true, data: { projectId: newProject.id } });
    } catch (err: any) {
        logger.error({ err }, "Error sending proposal to dev");
        const msg = err.message || "Erro interno ao enviar para o portal Dev.";
        return res.status(400).json({ success: false, error: { message: msg } });
    }
});

/**
 * PUT /api/proposals/:id
 * Updates an existing proposal for the current user.
 */
router.put("/:id", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const proposalId = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ success: false, error: { message: "Não autenticado." } });
        }

        const existing = await prisma.proposal.findUnique({ where: { id: proposalId } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ success: false, error: { message: "Proposta não encontrada ou acesso negado." } });
        }

        const { title, clientId, expiresAt, scopeRaw, gapAnalysis, estimate, clientPortalEmail, clientPortalPassword } = req.body as any;

        let finalViewerId: string | undefined = undefined;

        if (clientPortalEmail && clientPortalPassword) {
            const emailStr = String(clientPortalEmail).trim().toLowerCase();
            const passStr = String(clientPortalPassword).trim();
            const hashedPassword = await hashPassword(passStr);
            
            const userExists = await prisma.user.findUnique({ where: { email: emailStr } });
            if (userExists) {
                await prisma.user.update({
                    where: { id: userExists.id },
                    data: { password: hashedPassword, role: "VIEWER", allowedApps: ["client"] }
                });
                finalViewerId = userExists.id;
            } else {
                const newUser = await prisma.user.create({
                    data: {
                        name: "Cliente",
                        email: emailStr,
                        password: hashedPassword,
                        role: "VIEWER",
                        allowedApps: ["client"]
                    }
                });
                finalViewerId = newUser.id;
            }
        } else if (clientId) {
            const clientEntity = await prisma.client.findUnique({ where: { id: clientId } });
            if (clientEntity?.email) {
                const viewerExists = await prisma.user.findUnique({ where: { email: clientEntity.email } });
                if (viewerExists && viewerExists.role === "VIEWER") {
                    finalViewerId = viewerExists.id;
                }
            }
        }

        const updated = await prisma.proposal.update({
            where: { id: proposalId },
            data: {
                title: title ? title.trim() : undefined,
                clientId: clientId !== undefined ? clientId : undefined,
                viewerId: finalViewerId !== undefined ? finalViewerId : undefined,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined,
                scopeRaw: scopeRaw ? scopeRaw.trim() : undefined,
                gapAnalysis: gapAnalysis !== undefined ? gapAnalysis : undefined,
                estimate: estimate !== undefined ? estimate : undefined
            },
        });

        logger.info({ userId, proposalId }, "Proposal updated via Wizard Pipeline");

        return res.json({ success: true, data: { id: updated.id } });
    } catch (err: any) {
        logger.error({ err }, "Error updating proposal");
        return res.status(500).json({ success: false, error: { message: "Erro ao atualizar proposta." } });
    }
});

/**
 * GET /api/proposals/client/mine
 * Retrieves all proposals linked strictly to the authenticated Portal Viewer (client mode).
 */
router.get("/client/mine", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: { message: "Não autenticado." } });
        }

        const proposals = await prisma.proposal.findMany({
            where: { viewerId: userId },
            orderBy: { createdAt: "desc" },
            include: {
                client: { select: { name: true, email: true } },
            },
        });

        const formatted = proposals.map((p: any) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            createdAt: p.createdAt,
            expiresAt: p.expiresAt,
            client: p.client,
            totalValue: p.estimate?.totalCost || 0,
            totalHours: p.estimate?.totalHours || 0,
        }));

        return res.status(200).json({ success: true, data: formatted });
    } catch (err: any) {
        logger.error({ err }, "Error fetching client proposals");
        return res.status(500).json({ success: false, error: { message: "Erro interno" } });
    }
});

/**
 * GET /api/proposals/client/:id
 * Retrieves a specific proposal strictly if it belongs to the authenticated Portal Viewer.
 */
router.get("/client/:id", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const id = req.params.id as string;
        
        if (!userId) {
            return res.status(401).json({ success: false, error: { message: "Não autenticado." } });
        }

        const proposal = await prisma.proposal.findUnique({
            where: { id },
            include: { client: true, viewer: { select: { email: true } } }
        });

        if (!proposal || proposal.viewerId !== userId) {
            return res.status(404).json({ success: false, error: { message: "Proposta não encontrada ou acesso negado." } });
        }

        return res.json({ success: true, data: proposal });
    } catch (err: any) {
        logger.error({ err, id: req.params.id }, "Error fetching client proposal details");
        return res.status(500).json({ success: false, error: { message: "Erro ao buscar detalhes da proposta." } });
    }
});

/**
 * GET /api/proposals
 * Lists all proposals for the current user.
 */
router.get("/", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const proposals = await prisma.proposal.findMany({
            where: { userId },
            include: { client: true, viewer: { select: { email: true } } },
            orderBy: { createdAt: "desc" }
        });
        return res.json({ success: true, data: proposals });
    } catch (err: any) {
        logger.error({ err }, "Error listing proposals");
        return res.status(500).json({ success: false, error: { message: "Erro ao listar propostas." } });
    }
});

/**
 * GET /api/proposals/:id
 * Fetches a specific proposal by ID for the current user.
 */
router.get("/:id", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const id = req.params.id as string;
        const proposal = await prisma.proposal.findUnique({
            where: { id },
            include: { client: true, viewer: { select: { email: true } } }
        });

        if (!proposal || proposal.userId !== userId) {
            return res.status(404).json({ success: false, error: { message: "Proposta não encontrada." } });
        }

        return res.json({ success: true, data: proposal });
    } catch (err: any) {
        logger.error({ err }, "Error fetching proposal details");
        return res.status(500).json({ success: false, error: { message: "Erro ao buscar detalhes da proposta." } });
    }
});

/**
 * POST /api/proposals/:id/duplicate
 * Clones a proposal appending ' (Cópia)' to its title.
 */
router.post("/:id/duplicate", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const id = req.params.id as string;

        if (!userId) {
            return res.status(401).json({ success: false, error: { message: "Não autenticado." } });
        }

        const original = await prisma.proposal.findUnique({
            where: { id },
        });

        if (!original || original.userId !== userId) {
            return res.status(404).json({ success: false, error: { message: "Proposta não encontrada ou acesso negado." } });
        }

        const clone = await prisma.proposal.create({
            data: {
                title: `${original.title} (Cópia)`,
                clientId: original.clientId,
                expiresAt: original.expiresAt,
                scopeRaw: original.scopeRaw,
                gapAnalysis: original.gapAnalysis ?? undefined,
                estimate: original.estimate ?? undefined,
                userId: original.userId,
                status: "draft",
            },
        });

        logger.info({ userId, originalId: id, cloneId: clone.id }, "Proposal cloned successfully");

        return res.json({ success: true, data: clone });
    } catch (err: any) {
        logger.error({ err }, "Error duplicating proposal");
        return res.status(500).json({ success: false, error: { message: "Erro ao duplicar proposta." } });
    }
});

/**
 * DELETE /api/proposals/:id
 * Deletes a specific proposal by ID.
 */
router.delete("/:id", async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        const id = req.params.id as string;

        // Ensure user owns it before deleting
        const proposal = await prisma.proposal.findUnique({
            where: { id }
        });

        if (!proposal || proposal.userId !== userId) {
            return res.status(404).json({ success: false, error: { message: "Proposta não encontrada ou sem permissão." } });
        }

        await prisma.proposal.delete({
            where: { id }
        });

        return res.json({ success: true });
    } catch (err: any) {
        logger.error({ err }, "Error deleting proposal");
        return res.status(500).json({ success: false, error: { message: "Erro ao deletar a proposta." } });
    }
});
import multer from "multer";
import path from "path";

const publicRouter = Router();

const publicStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dest = "uploads/proposals";
        if (!require("fs").existsSync(dest)) {
            require("fs").mkdirSync(dest, { recursive: true });
        }
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `comment-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});
const publicUpload = multer({ storage: publicStorage, limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * GET /api/proposals/presentation/:id/comments
 * Fetches all public comments for a given proposal ID.
 */
publicRouter.get("/presentation/:id/comments", async (req: Request, res: Response) => {
    try {
        const proposalId = req.params.id as string;
        const comments = await prisma.proposalComment.findMany({
            where: { proposalId },
            orderBy: { createdAt: "desc" },
        });
        return res.json({ success: true, data: comments });
    } catch (err) {
        logger.error({ err }, "Error fetching proposal comments");
        return res.status(500).json({ success: false, error: { message: "Erro ao buscar comentários." } });
    }
});

/**
 * POST /api/proposals/presentation/:id/comments
 * Creates a new public comment from the presentation scope.
 */
publicRouter.post("/presentation/:id/comments", publicUpload.single("file"), async (req: Request, res: Response) => {
    try {
        const proposalId = req.params.id as string;
        const { screenId, author, content } = req.body;
        const file = req.file;

        if (!screenId || !author || (!content && !file)) {
            return res.status(400).json({ success: false, error: { message: "Dados incompletos." } });
        }

        const comment = await prisma.proposalComment.create({
            data: {
                proposalId,
                screenId,
                author,
                content: content || "",
                fileUrl: file ? `/uploads/proposals/${file.filename}` : null,
                fileName: file ? file.originalname : null,
                fileType: file ? file.mimetype : null,
                fileSize: file ? file.size : null,
            },
        });

        return res.json({ success: true, data: comment });
    } catch (err) {
        logger.error({ err }, "Error creating public comment");
        return res.status(500).json({ success: false, error: { message: "Erro ao criar comentário." } });
    }
});

export function proposalsRoutes(app: Router) {
    app.use("/api/proposals", publicRouter);
    app.use("/api/proposals", router);
}
