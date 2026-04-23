/**
 * ═════════════════════════════════════════════════
 * PROPOSTAS — Replicated from Web Cliente
 * Full proposal list + detail view with tabs
 * ═════════════════════════════════════════════════
 */
import { useEffect, useState, useRef } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    StyleSheet, TouchableOpacity, Modal, Dimensions, Animated,
    TextInput, KeyboardAvoidingView, Platform, Alert, Image, Linking
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    FileText, Calendar, DollarSign, ArrowLeft, ArrowRight,
    Clock, ScrollText, ChevronRight, ChevronLeft, Layers,
    ShieldCheck, Sparkles, Monitor, Smartphone, Terminal,
    CheckCircle, X, Users, Globe, MessageCircle, Send, Download,
    MessageSquare, Package, Headphones
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { api } from "../../src/lib/api";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
const { width: SCREEN_W } = Dimensions.get("window");

// ── Design tokens ──
const B = "#0a0a0a";
const C1 = "#111111";
const GRN = "#22ffb5";
const BLU = "#22ffb5";
const PUR = "#a020f0";
const WHT = "#ffffff";
const MUT = "rgba(255,255,255,0.40)";
const MUT2 = "#86868b";
const MUT3 = "rgba(255,255,255,0.06)";

// ── Status map ──
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    SENT:         { label: "Enviada",           color: "#60a5fa", bg: "rgba(59,130,246,0.10)" },
    APPROVED:     { label: "Aprovada",          color: "#22ffb5", bg: "rgba(34,255,181,0.10)" },
    REJECTED:     { label: "Rejeitada",         color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
    SENT_TO_DEVS: { label: "Em Desenvolvimento",color: "#c084fc", bg: "rgba(168,85,247,0.10)" },
    IN_REVIEW:    { label: "Em Revisão",        color: "#fbbf24", bg: "rgba(245,158,11,0.10)" },
};

// ── Types ──
interface MockFeature { title: string; description: string; }
interface MockScreen { id: string; title: string; description: string; features: MockFeature[]; complexity: string; hours: number; module: string; platformId: string; }
interface MockTeamMember { role: string; description: string; }
interface MockPayment { name: string; installments: number; discount: number; }
interface MockProposal {
    id: string; title: string; status: string;
    totalValue?: number; totalHours?: number; totalScreens?: number;
    totalPlatforms?: number; totalProfiles?: number; validityDays?: number;
    client?: { name: string; };
    clientName?: string;
    projectSummary?: string; createdAt: string; sentAt: string;
    platforms: { id: string; name: string; icon: string; screenCount: number; }[];
    screens: MockScreen[];
    team: MockTeamMember[];
    payments: MockPayment[];
    timeline: string;
}

// ── Helpers ──
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateLong = (d: string) => d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "—";

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════

export default function ProposalsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [proposals, setProposals] = useState<MockProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<MockProposal | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "scope" | "team" | "investment">("overview");
    const [screenIdx, setScreenIdx] = useState(0);

    // Feedback state
    const [feedbacks, setFeedbacks] = useState<{ id: string; screenId: string; text: string; date: string; author?: string; }[]>([]);
    const [commentText, setCommentText] = useState("");
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [isSavingComment, setIsSavingComment] = useState(false);

    const fetchProposals = async () => {
        setLoading(true);
        const res = await api<any>("/api/proposals/client/mine");
        if (res?.success && res.data) {
            setProposals(res.data);
        } else {
            setProposals([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    const [detailLoading, setDetailLoading] = useState(false);

    // ── Helper: descrição da equipe (idêntica ao Web Comercial presentation) ──
    const getRoleDescription = (role: string): string => {
        const r = role.toLowerCase();
        if (r.includes('ui/ux') || r.includes('designer')) return 'Desenha telas, fluxos de navegação e garante a melhor usabilidade (UX).';
        if (r.includes('front end') || r.includes('frontend')) return 'Engenheiro da camada visual, transformando o design em código de alta performance.';
        if (r.includes('back end') || r.includes('backend')) return 'Engenheiro focado no banco de dados, regras de negócio complexas, segurança e rotas de API.';
        if (r.includes('full stack') || r.includes('fullstack')) return 'Engenheiro versátil capaz de atuar de ponta a ponta na aplicação, do frontend ao banco.';
        if (r.includes('mobile') || r.includes('ios') || r.includes('android')) return 'Especialista em aplicativos nativos ou cross-platform arquitetados para iOS e Android.';
        if (r.includes('qa') || r.includes('quality') || r.includes('tester')) return 'Analista responsável por mapear, validar e blindar o software contra bugs em produção.';
        if (r.includes('devops') || r.includes('infra')) return 'Arquiteta servidores cloud e integrações contínuas (CI/CD) para sustentar tráfego.';
        if (r.includes('scrum') || r.includes('agile') || r.includes('product owner') || r.includes('po ') || r.includes('manager')) return 'Gestor estratégico do produto, priorizando tarefas da equipe focando em valor para o negócio.';
        if (r.includes('tech lead') || r.includes('arquiteto') || r.includes('architect')) return 'Líder visionário que desenha arquiteturas hiper escaláveis para previnir código legado.';
        if (r.includes('data') || r.includes('dados') || r.includes('intelligence')) return 'Especialista analítico em cruzar banco de dados para extrair inteligência e relatórios.';
        return 'Profissional especializado escalado ativamente para focar na entrega de excelência do projeto.';
    };

    const [isPdfBusy, setIsPdfBusy] = useState(false);

    // ── Gera HTML A4 Apple DS (réplica exata do PrintLayout do presentation) ──
    const buildProposalHtml = (p: MockProposal): string => {
        const clientName = p.clientName || p.client?.name || "Cliente";
        const todayDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
        const totalScreens = p.totalScreens || 0;
        const totalProfiles = p.totalProfiles || 1;
        const totalPlatforms = p.totalPlatforms || 0;
        const totalHours = p.totalHours || 0;
        const totalValue = p.totalValue || 0;
        const timeline = p.timeline || "A definir";
        const validity = p.validityDays || 15;

        // CSS base (Apple DS tokens)
        const css = `
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; color: #1d1d1f; background: #fff; font-size: 10pt; line-height: 1.55; -webkit-font-smoothing: antialiased; }
            .page { padding: 48px 56px; page-break-after: always; }
            .page:last-child { page-break-after: auto; }
            .eyebrow { font-size: 7pt; color: #86868b; text-transform: uppercase; letter-spacing: 0.18em; font-weight: 700; margin-bottom: 5px; }
            .section-title { font-size: 19pt; font-weight: 600; letter-spacing: -0.025em; color: #000; line-height: 1.1; }
            .section-header { padding-bottom: 14px; border-bottom: 1.5px solid #1d1d1f; margin-bottom: 22px; }
            .stat-row { display: flex; gap: 28px; align-items: center; margin-top: 4px; }
            .stat { text-align: center; }
            .stat-value { font-size: 15pt; font-weight: 600; color: #000; line-height: 1; }
            .stat-label { font-size: 6.5pt; color: #86868b; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 3px; }
            .stat-divider { width: 1px; height: 28px; background: #d2d2d7; }
            .module-tag { display: flex; align-items: center; gap: 8px; padding: 6px 11px; border-radius: 7px; background: #f5f5f7; border-left: 2.5px solid #1d1d1f; margin-bottom: 9px; }
            .module-tag-title { font-size: 9.5pt; font-weight: 600; color: #1d1d1f; }
            .module-tag-count { font-size: 7pt; color: #86868b; margin-left: auto; }
            .screen-card { margin-bottom: 7px; padding: 10px 12px; border: 1px solid #d2d2d7; border-radius: 8px; }
            .screen-title { font-size: 9.5pt; font-weight: 600; color: #1d1d1f; }
            .hours-badge { font-size: 7.5pt; font-weight: 600; color: #0071e3; background: rgba(0,113,227,0.08); padding: 1px 8px; border-radius: 100px; margin-left: 10px; }
            .func-row { display: flex; align-items: flex-start; gap: 6px; margin-top: 3px; }
            .func-check { color: #0071e3; font-size: 7.5pt; margin-top: 2px; font-weight: 700; }
            .func-title { font-size: 8pt; font-weight: 500; color: #1d1d1f; }
            .func-desc { font-size: 7pt; color: #86868b; margin-left: 5px; }
            .func-hours { font-size: 7pt; color: #86868b; margin-left: auto; white-space: nowrap; }
            .team-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
            .team-card { padding: 12px 14px; border: 1px solid #d2d2d7; border-radius: 9px; }
            .team-role { font-size: 9pt; font-weight: 600; color: #1d1d1f; margin-bottom: 4px; }
            .team-desc { font-size: 7.5pt; color: #86868b; line-height: 1.5; }
            .invest-value { font-size: 36pt; font-weight: 600; letter-spacing: -0.03em; color: #000; line-height: 1; }
            .invest-currency { font-size: 12pt; color: #86868b; font-weight: 500; }
            .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .kpi-card { padding: 14px 16px; background: #f5f5f7; border-radius: 10px; }
            .kpi-label { font-size: 7pt; color: #86868b; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 700; margin-bottom: 5px; }
            .kpi-value { font-size: 11.5pt; font-weight: 600; color: #1d1d1f; }
            .pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .pay-card { padding: 11px 13px; border: 1px solid #d2d2d7; border-radius: 8px; }
            .pay-name { font-size: 9pt; font-weight: 600; color: #1d1d1f; margin-bottom: 3px; }
            .pay-info { font-size: 8pt; color: #86868b; }
            .footer { display: flex; justify-content: space-between; align-items: center; padding-top: 14px; border-top: 1px solid #d2d2d7; margin-top: 24px; font-size: 7pt; color: #86868b; }
            .legal { padding: 14px 16px; background: #f5f5f7; border-radius: 9px; margin-bottom: 20px; font-size: 7.5pt; color: #86868b; line-height: 1.65; }
        `;

        // CAPA
        let html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>`;
        html += `<div class="page" style="display:flex;flex-direction:column;min-height:250mm;">`;
        html += `<div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:1px solid #d2d2d7;">`;
        html += `<span class="eyebrow">Proposta Técnica Exclusiva</span>`;
        html += `<span style="font-size:7.5pt;color:#86868b;">${todayDate}</span></div>`;
        html += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px 32px 40px;gap:28px;">`;
        html += `<p style="font-size:8.5pt;color:#86868b;">Para: <strong style="color:#1d1d1f;font-weight:600;">${clientName}</strong></p>`;
        html += `<div style="width:48px;height:1px;background:#0071e3;opacity:0.4;"></div>`;
        html += `<h1 style="font-size:30pt;font-weight:600;letter-spacing:-0.03em;color:#000;line-height:1.06;">${p.title || "Proposta Técnica 360°"}</h1>`;
        if (p.projectSummary) {
            const summary = p.projectSummary.length > 280 ? p.projectSummary.substring(0, 280) + "…" : p.projectSummary;
            html += `<p style="font-size:10.5pt;color:#86868b;font-weight:300;line-height:1.65;">${summary}</p>`;
        }
        html += `<div class="stat-row">`;
        html += `<div class="stat"><div class="stat-value">${totalScreens}</div><div class="stat-label">Telas</div></div>`;
        html += `<div class="stat-divider"></div>`;
        html += `<div class="stat"><div class="stat-value">${totalProfiles}</div><div class="stat-label">Perfis</div></div>`;
        html += `<div class="stat-divider"></div>`;
        html += `<div class="stat"><div class="stat-value">${totalPlatforms}</div><div class="stat-label">Plataformas</div></div>`;
        if (totalHours > 0) {
            html += `<div class="stat-divider"></div>`;
            html += `<div class="stat"><div class="stat-value">${totalHours}h</div><div class="stat-label">Estimadas</div></div>`;
        }
        if (validity) {
            html += `<div class="stat-divider"></div>`;
            html += `<div class="stat"><div class="stat-value">${validity}</div><div class="stat-label">Dias válida</div></div>`;
        }
        html += `</div></div>`;
        html += `<div class="footer"><span>Proposta Técnica 360° · Mestres da Web</span><span>1</span></div></div>`;

        // ESCOPO — uma página por plataforma
        (p.platforms || []).forEach((plat, pIdx) => {
            const platScreens = (p.screens || []).filter(s => s.platformId === plat.id);
            if (platScreens.length === 0) return;

            // Agrupar telas por módulo
            const modules: Record<string, typeof platScreens> = {};
            platScreens.forEach(s => {
                if (!modules[s.module]) modules[s.module] = [];
                modules[s.module].push(s);
            });

            html += `<div class="page">`;
            html += `<div class="section-header"><div style="display:flex;justify-content:space-between;align-items:flex-start;">`;
            html += `<div><div class="eyebrow">Escopo Técnico</div><div class="section-title">${plat.name}</div></div>`;
            html += `<div style="display:flex;gap:16px;text-align:right;">`;
            html += `<div><div style="font-size:12pt;font-weight:600;color:#1d1d1f;line-height:1;">${platScreens.length}</div><div class="stat-label">Telas</div></div>`;
            const platHours = platScreens.reduce((a, s) => a + (s.hours || 0), 0);
            if (platHours > 0) {
                html += `<div><div style="font-size:12pt;font-weight:600;color:#0071e3;line-height:1;">${platHours}h</div><div class="stat-label">Estimadas</div></div>`;
            }
            html += `</div></div></div>`;

            Object.entries(modules).forEach(([modTitle, modScreens]) => {
                html += `<div class="module-tag"><span class="module-tag-title">${modTitle}</span><span class="module-tag-count">${modScreens.length} tela${modScreens.length !== 1 ? "s" : ""}</span></div>`;
                modScreens.forEach(scr => {
                    html += `<div class="screen-card">`;
                    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">`;
                    html += `<span class="screen-title">${scr.title}</span>`;
                    if (scr.hours > 0) html += `<span class="hours-badge">${scr.hours}h</span>`;
                    html += `</div>`;
                    if (scr.description) html += `<p style="font-size:8pt;color:#86868b;margin:0 0 6px;line-height:1.5;font-weight:300;">${scr.description}</p>`;
                    if (scr.features.length > 0) {
                        html += `<div style="border-top:1px solid #f5f5f7;padding-top:5px;">`;
                        scr.features.forEach(f => {
                            html += `<div class="func-row"><span class="func-check">✓</span><span class="func-title">${f.title}</span>`;
                            if (f.description) html += `<span class="func-desc">${f.description}</span>`;
                            html += `</div>`;
                        });
                        html += `</div>`;
                    }
                    html += `</div>`;
                });
            });

            html += `<div class="footer"><span>Proposta Técnica 360° · Mestres da Web</span><span>${pIdx + 2}</span></div></div>`;
        });

        // EQUIPE
        if ((p.team || []).length > 0) {
            html += `<div class="page">`;
            html += `<div class="section-header"><div class="eyebrow">Time Alocado</div><div class="section-title">Equipe Global</div></div>`;
            html += `<div class="team-grid">`;
            (p.team || []).forEach(m => {
                html += `<div class="team-card"><div class="team-role">${m.role}</div><p class="team-desc">${m.description}</p></div>`;
            });
            html += `</div>`;
            html += `<div class="footer"><span>Proposta Técnica 360° · Mestres da Web</span><span>—</span></div></div>`;
        }

        // INVESTIMENTO
        html += `<div class="page">`;
        html += `<div class="section-header"><div class="eyebrow">Orçamento · Algoritmo IA Ad-Hoc</div><div class="section-title">Investimento Total</div></div>`;
        html += `<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #d2d2d7;">`;
        html += `<span class="invest-currency">R$</span>`;
        html += `<span class="invest-value">${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span></div>`;
        html += `<div class="kpi-grid">`;
        html += `<div class="kpi-card"><div class="kpi-label">Cronograma Estimado</div><div class="kpi-value">${timeline}</div></div>`;
        html += `<div class="kpi-card"><div class="kpi-label">Volume do Escopo</div><div class="kpi-value">${totalHours} horas alocadas</div></div></div>`;
        if ((p.payments || []).length > 0) {
            html += `<h3 style="font-size:10.5pt;font-weight:600;color:#1d1d1f;margin-bottom:10px;">Condições de Pagamento</h3>`;
            html += `<div class="pay-grid">`;
            (p.payments || []).forEach(pay => {
                const parcelas = pay.installments > 1 ? `${pay.installments}x` : pay.installments === 0 ? "Mensal" : "À vista";
                const desc = pay.discount > 0 ? ` · ${pay.discount}% de desconto` : "";
                html += `<div class="pay-card"><div class="pay-name">${pay.name}</div><div class="pay-info">${parcelas}${desc}</div></div>`;
            });
            html += `</div>`;
        }
        html += `<div class="legal">Os valores e cronogramas apresentados são estimativas geradas via Algoritmo IA Ad-Hoc e podem ser refinados junto ao arquiteto de software responsável durante sessões técnicas de alinhamento de prioridades. Esta proposta tem validade de <strong style="color:#6e6e73;">${validity} dias</strong> a partir da data de emissão.</div>`;
        html += `<div class="footer"><span>Proposta Técnica 360° · Mestres da Web</span><span>—</span></div></div>`;
        html += `</body></html>`;

        return html;
    };

    const handleDownloadPDF = async () => {
        if (!selected || isPdfBusy) return;
        setIsPdfBusy(true);
        try {
            const html = buildProposalHtml(selected);
            const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
            } else {
                Alert.alert("PDF Gerado", "O arquivo foi salvo em: " + uri);
            }
        } catch (err) {
            Alert.alert("Erro", "Não foi possível gerar o PDF.");
            console.error("PDF Error:", err);
        } finally {
            setIsPdfBusy(false);
        }
    };
    const openProposal = async (p: MockProposal) => {
        setDetailLoading(true);

        // Busca em paralelo: proposta completa + equipe + pagamentos + feedbacks
        const [proposalRes, teamRes, paymentsRes, fbRes] = await Promise.all([
            api<any>(`/api/proposals/client/a/${p.id}`),
            api<any>(`/api/proposals/client/a/${p.id}/team`),
            api<any>(`/api/proposals/client/a/${p.id}/payments`),
            api<any>(`/api/proposals/client/a/${p.id}/feedback`),
        ]);

        setDetailLoading(false);

        // Feedbacks
        setFeedbacks(fbRes?.success && Array.isArray(fbRes.data) ? fbRes.data : []);

        if (!proposalRes?.success || !proposalRes.data) {
            setSelected({ ...p, platforms: [], screens: [], team: [], payments: [] });
            setActiveTab("overview");
            setScreenIdx(0);
            return;
        }

        const raw = proposalRes.data;
        const sData: any = raw.scopeData || {};
        const users: any[] = sData.users || [];

        // ══════════════════════════════════════════════════════════
        // PLATAFORMAS & TELAS — mesmo mapeamento do presentation
        // ══════════════════════════════════════════════════════════

        const inferIcon = (name: string): string => {
            const t = (name || "").toLowerCase();
            if (t.includes("mobile") || t.includes("app") || t.includes("ios") || t.includes("android")) return "smartphone";
            if (t.includes("web") || t.includes("painel") || t.includes("dashboard")) return "globe";
            if (t.includes("api") || t.includes("backend")) return "terminal";
            return "monitor";
        };

        const mappedPlatforms: any[] = [];
        const mappedScreens: any[] = [];

        // Cada combinação usuário + plataforma é uma entrada separada
        // (idêntico ao flatMap do presentation: title = `${platformName} - ${userName}`)
        users.forEach((u: any, uIdx: number) => {
            (u.platforms || []).forEach((plat: any, pIdx: number) => {
                const platId = `p-${uIdx}-${pIdx}`;
                let screenCount = 0;

                (plat.modules || []).forEach((mod: any) => {
                    (mod.screens || []).forEach((scr: any) => {
                        screenCount += 1;
                        const screenHours = (scr.functionalities || []).reduce(
                            (acc: number, f: any) => acc + (f.estimatedHours || 0), 0
                        );
                        mappedScreens.push({
                            id: `scr_${mappedScreens.length}`,
                            title: scr.title,
                            description: scr.description || "",
                            features: (scr.functionalities || []).map((f: any) => ({
                                title: f.title,
                                description: f.description || "",
                            })),
                            complexity: screenHours > 24 ? "very_high" : screenHours > 16 ? "high" : screenHours > 8 ? "medium" : "low",
                            hours: screenHours,
                            module: mod.title,
                            platformId: platId,
                        });
                    });
                });

                if (screenCount > 0) {
                    mappedPlatforms.push({
                        id: platId,
                        name: `${plat.platformName} - ${u.userName}`,
                        icon: inferIcon(plat.platformName),
                        screenCount,
                    });
                }
            });
        });

        // ══════════════════════════════════════════════════════════
        // HORAS, VALOR & CRONOGRAMA — lógica idêntica ao presentation
        // totalHours = funcionalidades + integrações
        // totalValue = totalHours * 150
        // timeline   = Math.ceil(totalHours / 160) meses
        // ══════════════════════════════════════════════════════════

        const baseHours = users.reduce((acc: number, u: any) =>
            acc + (u.platforms || []).reduce((acc2: number, pl: any) =>
                acc2 + (pl.modules || []).reduce((acc3: number, m: any) =>
                    acc3 + (m.screens || []).reduce((acc4: number, s: any) =>
                        acc4 + (s.functionalities || []).reduce((acc5: number, f: any) =>
                            acc5 + (f.estimatedHours || 0), 0), 0), 0), 0), 0);

        const integrationHours = (sData.integrations || []).reduce(
            (acc: number, i: any) => acc + (i.estimatedHours || 0), 0
        );
        const totalHours = baseHours + integrationHours;
        const totalValue = totalHours * 150;
        const timeline = totalHours > 0
            ? `Aproximadamente ${Math.ceil(totalHours / 160)} meses`
            : "A definir";

        // ══════════════════════════════════════════════════════════
        // EQUIPE — filtrada por tipo de plataforma (igual presentation)
        // ══════════════════════════════════════════════════════════

        const hasMobile = mappedPlatforms.some(pl => {
            const t = (pl.name || "").toLowerCase();
            return t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("app");
        });
        const hasWeb = mappedPlatforms.some(pl => {
            const t = (pl.name || "").toLowerCase();
            return t.includes("web") || t.includes("ecommerce") || t.includes("site") || t.includes("painel");
        });

        let rawTeam: any[] = teamRes?.success && Array.isArray(teamRes.data) ? teamRes.data : [];

        // Filtrar por plataforma (mesmo critério do presentation)
        let filteredTeam = rawTeam.filter((prof: any) => prof.isActive !== false).filter((prof: any) => {
            const r = (prof.role || "").toLowerCase();
            if (r.includes("front end mobile") || r.includes("frontend mobile")) return hasMobile;
            if (r.includes("front end desktop") || r.includes("frontend desktop")) return false;
            if (r.includes("front end") || r.includes("frontend")) return hasWeb;
            return true;
        });

        // Fallback hard-coded (idêntico ao presentation)
        if (filteredTeam.length === 0) {
            filteredTeam = [
                { role: "Product Owner", seniority: "Sênior" },
                { role: "UX/UI Designer", seniority: "Pleno" },
                { role: "Tech Lead", seniority: "Especialista" },
                { role: "QA Engineer", seniority: "Pleno" },
                { role: "Back End Engineer", seniority: "Sênior" },
            ];
            if (hasMobile) filteredTeam.push({ role: "Engenheiro Mobile", seniority: "Sênior" });
            if (hasWeb) filteredTeam.push({ role: "Front End Engineer", seniority: "Sênior" });
        }

        // Ordenar por senioridade (mesmo do presentation)
        const order: Record<string, number> = { "Junior": 1, "Pleno": 2, "Sênior": 3, "Especialista": 4 };
        filteredTeam.sort((a: any, b: any) => (order[b.seniority] || 0) - (order[a.seniority] || 0));

        const mappedTeam = filteredTeam.map((prof: any) => ({
            role: prof.role,
            description: getRoleDescription(prof.role),
        }));

        // ══════════════════════════════════════════════════════════
        // PAGAMENTOS — direto da tabela PaymentCondition
        // ══════════════════════════════════════════════════════════

        const rawPayments: any[] = paymentsRes?.success && Array.isArray(paymentsRes.data) ? paymentsRes.data : [];
        const mappedPayments = rawPayments.filter((pay: any) => pay.active !== false).map((pay: any) => ({
            name: pay.name,
            installments: pay.installments ?? 1,
            discount: pay.discount ?? 0,
        }));

        // ══════════════════════════════════════════════════════════
        // MONTAR PROPOSTA FINAL
        // ══════════════════════════════════════════════════════════

        const fullProposal: MockProposal = {
            ...p,
            totalHours,
            totalValue,
            totalScreens: mappedScreens.length,
            totalPlatforms: mappedPlatforms.length,
            totalProfiles: users.length || 1,
            validityDays: sData.validityDays || raw.validityDays || 15,
            projectSummary: sData.projectSummary || p.projectSummary || "",
            platforms: mappedPlatforms,
            screens: mappedScreens,
            team: mappedTeam,
            payments: mappedPayments,
            timeline,
        };

        setSelected(fullProposal);
        setActiveTab("overview");
        setScreenIdx(0);
    };

    if (loading) {
        return <View style={[styles.center, { backgroundColor: B }]}><ActivityIndicator size="large" color={GRN} /></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: B }}>
            {/* ═══ PROPOSAL LIST ═══ */}
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: 16 }]} showsVerticalScrollIndicator={false}>
                <View style={styles.pageHeader}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.08)", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 100, alignSelf: "flex-start", marginBottom: 16 }}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={20} color="#fff" />
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>Voltar</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageTitle}>Propostas</Text>
                    <Text style={styles.pageSubtitle}>Visualize as propostas comerciais dos seus projetos.</Text>
                </View>

                {detailLoading && (
                    <View style={{ padding: 20, alignItems: "center" }}>
                        <ActivityIndicator size="large" color={GRN} />
                        <Text style={{ color: "#94a3b8", marginTop: 12, fontSize: 13 }}>Sincronizando Escopo Completo...</Text>
                    </View>
                )}

                {proposals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}><ScrollText size={28} color="#475569" /></View>
                        <Text style={styles.emptyTitle}>Nenhuma proposta encontrada</Text>
                        <Text style={styles.emptyDesc}>Suas propostas aparecerão aqui assim que forem enviadas.</Text>
                    </View>
                ) : (
                    proposals.map((p, i) => {
                        const st = STATUS[p.status] || STATUS.SENT;
                        return (
                            <TouchableOpacity key={p.id} style={styles.card} activeOpacity={0.7} onPress={() => openProposal(p)}>
                                <View style={styles.cardInner}>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <View style={styles.cardTitleRow}>
                                            <Text style={styles.cardTitle} numberOfLines={1}>{p.title || "Proposta Comercial"}</Text>
                                            <View style={[styles.badge, { backgroundColor: st.bg }]}>
                                                <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.cardClient}>{p.clientName || p.client?.name || "Cliente"}</Text>
                                        <View style={styles.metaRow}>
                                            <View style={styles.metaItem}>
                                                <Calendar size={12} color={MUT2} />
                                                <Text style={styles.metaText}>{fmtDate(p.sentAt || p.createdAt)}</Text>
                                            </View>
                                            {(p.totalValue || 0) > 0 && (
                                                <View style={styles.metaItem}>
                                                    <DollarSign size={12} color={MUT2} />
                                                    <Text style={styles.metaText}>{fmt(p.totalValue || 0)}</Text>
                                                </View>
                                            )}
                                            {(p.totalHours || 0) > 0 && (
                                                <View style={styles.metaItem}>
                                                    <Clock size={12} color={MUT2} />
                                                    <Text style={styles.metaText}>{p.totalHours || 0}h</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.cardArrow}>
                                        <Text style={styles.cardArrowLabel}>Ver</Text>
                                        <ArrowRight size={16} color={MUT2} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })
                )}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ═══ DETAIL MODAL ═══ */}
            <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
                {selected && (
                    <View style={[styles.detailContainer, { paddingTop: insets.top }]}>
                        {/* Header */}
                        <View style={styles.detailHeader}>
                            <TouchableOpacity onPress={() => setSelected(null)} style={styles.headerBtn}>
                                <ArrowLeft size={18} color={MUT} />
                            </TouchableOpacity>
                            <View style={{ flex: 1, marginHorizontal: 12 }}>
                                <View style={styles.headerEyebrow}>
                                    <Sparkles size={10} color={BLU} />
                                    <Text style={styles.headerEyebrowText}>PADRÃO OURO DE ENGENHARIA</Text>
                                </View>
                                <Text style={styles.headerTitle} numberOfLines={1}>{selected.title}</Text>
                                <TouchableOpacity onPress={() => Linking.openURL('http://localhost:1100/presentation-mestres')} 
                                    style={{ 
                                        flexDirection: 'row', alignItems: 'center', gap: 6, 
                                        backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 16, 
                                        borderRadius: 100, alignSelf: 'flex-start', marginTop: 8, 
                                        borderWidth: 1, borderColor: '#334155',
                                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3
                                    }}>
                                    <Sparkles size={14} color="#2997ff" />
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#f8fafc' }}>Conheça a Mestres</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={styles.headerClientLabel}>Para: {selected.clientName}</Text>
                                <Text style={styles.headerDate}>{fmtDateLong(selected.createdAt)}</Text>
                            </View>
                        </View>

                        <View style={styles.tabBar}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarInner}>
                                {(["overview", "scope", "team", "tracking", "investment"] as const).map(t => (
                                    <TouchableOpacity key={t} onPress={() => { setActiveTab(t); setScreenIdx(0); }}
                                        style={[styles.tabItem, activeTab === t && styles.tabItemActive]}>
                                        <Text style={[styles.tabLabel, activeTab === t && styles.tabLabelActive]}>
                                            {t === "overview" ? "Visão Geral" : t === "scope" ? "Escopo" : t === "team" ? "Equipe" : t === "tracking" ? "Acompanhamento" : "Investimento"}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Tab content */}
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

                            {/* OVERVIEW */}
                            {activeTab === "overview" && (
                                <View style={styles.tabContent}>
                                    {/* Client avatar */}
                                    <View style={styles.overviewHero}>
                                        <View style={styles.avatarOuter}>
                                            <View style={styles.avatarInner}>
                                                <Text style={styles.avatarLetter}>{(selected.clientName || selected.client?.name || "C").charAt(0).toUpperCase()}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.overviewEyebrow}>PROPOSTA TÉCNICA EXCLUSIVA</Text>
                                        <Text style={styles.overviewClient}>{selected.clientName || selected.client?.name || "Cliente"}</Text>

                                        <View style={styles.dividerLine} />

                                        <Text style={styles.overviewTitle}>{selected.title || "Proposta Comercial"}</Text>
                                        {selected.projectSummary ? (
                                            <Text style={styles.overviewSummary}>{selected.projectSummary}</Text>
                                        ) : null}

                                        {/* Stats row */}
                                        <View style={styles.statsRow}>
                                            <View style={styles.statItem}>
                                                <Layers size={14} color={BLU} />
                                                <Text style={styles.statText}>{selected.totalScreens} Telas</Text>
                                            </View>
                                            <View style={styles.statDivider} />
                                            <View style={styles.statItem}>
                                                <Users size={14} color={PUR} />
                                                <Text style={styles.statText}>{selected.totalProfiles} Perfis</Text>
                                            </View>
                                            <View style={styles.statDivider} />
                                            <View style={styles.statItem}>
                                                <ShieldCheck size={14} color={GRN} />
                                                <Text style={styles.statText}>Válida por {selected.validityDays} dias</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Platforms summary */}
                                    <View style={styles.sectionBlock}>
                                        <Text style={styles.sectionLabel}>PLATAFORMAS</Text>
                                        {(selected.platforms || []).map(pl => {
                                            const Icon = pl.icon === "smartphone" ? Smartphone : pl.icon === "terminal" ? Terminal : pl.icon === "globe" ? Globe : Monitor;
                                            return (
                                                <View key={pl.id} style={styles.platformRow}>
                                                    <Icon size={16} color={BLU} />
                                                    <Text style={styles.platformName}>{pl.name}</Text>
                                                    <Text style={styles.platformCount}>{pl.screenCount} telas</Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* SCOPE */}
                            {activeTab === "scope" && (selected.screens || []).length > 0 && (() => {
                                const screen = (selected.screens || [])[screenIdx] || (selected.screens || [])[0];
                                const cLabel = screen.complexity === "very_high" ? "Muito Alta" : screen.complexity === "high" ? "Alta" : "Média";
                                const cColor = screen.complexity === "very_high" ? "#ff3b30" : BLU;
                                return (
                                    <View style={styles.tabContent}>
                                        {/* Platform pills */}
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
                                            {(selected.platforms || []).map(pl => {
                                                const isActive = screen.platformId === pl.id;
                                                return (
                                                    <TouchableOpacity key={pl.id} style={[styles.platformPill, isActive && styles.platformPillActive]}
                                                        onPress={() => {
                                                            const idx = (selected.screens || []).findIndex(s => s.platformId === pl.id);
                                                            if (idx >= 0) setScreenIdx(idx);
                                                        }}>
                                                        <Text style={[styles.platformPillText, isActive && styles.platformPillTextActive]}>{pl.name}</Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </ScrollView>

                                        {/* Screen card */}
                                        <View style={styles.scopeCard}>
                                            <View style={styles.scopeTopRow}>
                                                <View style={[styles.complexityBadge, { backgroundColor: cColor + "18" }]}>
                                                    <Text style={[styles.complexityText, { color: cColor }]}>{cLabel}</Text>
                                                </View>
                                                {screen.hours > 0 && (
                                                    <View style={styles.hoursBadge}>
                                                        <Text style={styles.hoursText}>{screen.hours}h</Text>
                                                    </View>
                                                )}
                                                <Text style={styles.slideCounter}>{screenIdx + 1}/{(selected.screens || []).length}</Text>
                                            </View>

                                            <Text style={styles.scopeModuleLabel}>{screen.module}</Text>
                                            <Text style={styles.scopeTitle}>{screen.title}</Text>
                                            {screen.description ? <Text style={styles.scopeDesc}>{screen.description}</Text> : null}

                                            {/* Features */}
                                            <View style={styles.featuresList}>
                                                {screen.features.map((f, i) => (
                                                    <View key={i} style={styles.featureItem}>
                                                        <CheckCircle size={18} color={BLU} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.featureTitle}>{f.title}</Text>
                                                            {f.description ? <Text style={styles.featureDesc}>{f.description}</Text> : null}
                                                        </View>
                                                    </View>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Nav buttons */}
                                        <View style={styles.navRow}>
                                            <TouchableOpacity style={styles.navBtn} onPress={() => setScreenIdx(i => i === 0 ? (selected.screens || []).length - 1 : i - 1)}>
                                                <ChevronLeft size={18} color={WHT} />
                                                <Text style={styles.navBtnText}>Anterior</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.navBtnPrimary} onPress={() => setScreenIdx(i => i === (selected.screens || []).length - 1 ? 0 : i + 1)}>
                                                <Text style={styles.navBtnPrimaryText}>Avançar</Text>
                                                <ChevronRight size={18} color={B} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })()}

                            {/* TEAM */}
                            {activeTab === "team" && (
                                <View style={styles.tabContent}>
                                    <Text style={styles.teamHeroTitle}>Engenharia de{"\n"}<Text style={{ color: BLU }}>Alta Performance.</Text></Text>
                                    <Text style={styles.teamHeroDesc}>Especialistas escalados rigorosamente para garantir a execução primorosa do seu projeto.</Text>

                                    {(selected.team || []).map((m, i) => (
                                        <View key={i} style={styles.teamCard}>
                                            <View style={styles.teamIconWrap}>
                                                <Terminal size={22} color="#e2e8f0" />
                                            </View>
                                            <Text style={styles.teamRole}>{m.role}</Text>
                                            <Text style={styles.teamDesc}>{m.description}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* TRACKING */}
                            {activeTab === "tracking" && (
                                <View style={styles.tabContent}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0, gap: 16, paddingBottom: 24 }} snapToInterval={SCREEN_W * 0.85 + 16} decelerationRate="fast">
                                        
                                        {/* Intro card */}
                                        <View style={{ width: SCREEN_W * 0.85 }}>
                                            <Text style={{ fontSize: 36, fontWeight: "800", color: WHT, marginBottom: 16, lineHeight: 40, letterSpacing: -1 }}>
                                                Como acompanhar{"\n"}
                                                <Text style={{ color: "#30d158" }}>meu projeto?</Text>
                                            </Text>
                                            <Text style={{ fontSize: 15, color: MUT2, lineHeight: 22, marginBottom: 24, fontWeight: "400" }}>
                                                Através do nosso Software e App interativo, você acompanha todo o desenvolvimento em tempo real. Todos os módulos ficam disponíveis simultaneamente para sua consulta.
                                            </Text>
                                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#30d158" }} />
                                                <Text style={{ fontSize: 12, fontWeight: "700", color: MUT2, textTransform: "uppercase", letterSpacing: 0.5 }}>Software + App</Text>
                                                <Text style={{ fontSize: 12, color: MUT }}>• Deslize para explorar →</Text>
                                            </View>
                                        </View>

                                        {/* Modules */}
                                        {[
                                            {
                                                title: "Proposta Comercial", subtitle: "Visualização & Impressão",
                                                desc: "Consulte sua proposta técnica completa com escopo detalhado, investimento e condições a qualquer momento. Visualize, imprima ou baixe em PDF — tudo organizado e sempre acessível.",
                                                img: require("../../assets/Proposta.png"), icon: FileText, color: "#2997ff"
                                            },
                                            {
                                                title: "Dashboard do Projeto", subtitle: "Visão Geral & Métricas",
                                                desc: "Acompanhe o progresso geral do seu projeto com gráficos intuitivos, indicadores de performance e status em tempo real. Saiba exatamente em que ponto cada entrega se encontra.",
                                                img: require("../../assets/Dashboard.png"), icon: Layers, color: "#30d158"
                                            },
                                            {
                                                title: "Telas & Funcionalidades", subtitle: "Acompanhamento Granular",
                                                desc: "Visualize cada tela e funcionalidade individualmente. Envie feedbacks contextualizados, solicite ajustes e aprove entregas — tudo organizado por módulo e tela.",
                                                img: require("../../assets/Telas e Funcionalidades.png"), icon: Monitor, color: "#a020f0"
                                            },
                                            {
                                                title: "Documentos", subtitle: "Central de Documentação",
                                                desc: "Acesse todos os documentos do projeto: contratos, briefings, wireframes, atas de reunião e materiais de referência — centralizados e sempre atualizados.",
                                                img: require("../../assets/Documentos.png"), icon: FileText, color: "#ff9f0a"
                                            },
                                            {
                                                title: "Entregas", subtitle: "Registro & Validação",
                                                desc: "Cada entrega é documentada com detalhes, prints e registros. Além das reuniões online de apresentação, tudo fica registrado no software e app para consulta futura.",
                                                img: require("../../assets/Entrega.png"), icon: Package, color: "#ff375f"
                                            },
                                        ].map((m, i) => (
                                            <View key={i} style={{ width: SCREEN_W * 0.85, backgroundColor: "rgba(30,41,59,0.3)", borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
                                                <View style={{ height: 2, backgroundColor: m.color, opacity: 0.8 }} />
                                                <View style={{ height: 200, backgroundColor: "#000" }}>
                                                    <Image source={m.img} style={{ width: "100%", height: "100%", opacity: 0.9 }} resizeMode="cover" />
                                                    <View style={{ position: "absolute", top: 16, left: 16, flexDirection: "row", alignItems: "center", backgroundColor: m.color, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
                                                        <m.icon size={12} color="#fff" />
                                                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", marginLeft: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.title}</Text>
                                                    </View>
                                                </View>
                                                <View style={{ padding: 24 }}>
                                                    <Text style={{ fontSize: 10, fontWeight: "700", color: MUT2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{m.subtitle}</Text>
                                                    <Text style={{ fontSize: 22, fontWeight: "700", color: WHT, marginBottom: 12, letterSpacing: -0.5 }}>{m.title}</Text>
                                                    <Text style={{ fontSize: 14, color: MUT2, lineHeight: 22 }}>{m.desc}</Text>
                                                </View>
                                            </View>
                                        ))}

                                        {/* WhatsApp */}
                                        <View style={{ width: SCREEN_W * 0.85, backgroundColor: "rgba(30,41,59,0.3)", borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "rgba(37,211,102,0.2)" }}>
                                            <View style={{ height: 2, backgroundColor: "#25D366", opacity: 0.8 }} />
                                            <View style={{ height: 200, backgroundColor: "rgba(37,211,102,0.05)", alignItems: "center", justifyContent: "center" }}>
                                                <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: "#25D366", alignItems: "center", justifyContent: "center", shadowColor: "#25D366", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
                                                    <Headphones size={40} color="#fff" />
                                                </View>
                                                <View style={{ position: "absolute", top: 16, left: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#25D366", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 }}>
                                                    <Headphones size={12} color="#fff" />
                                                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", marginLeft: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>WhatsApp</Text>
                                                </View>
                                            </View>
                                            <View style={{ padding: 24 }}>
                                                <Text style={{ fontSize: 10, fontWeight: "700", color: MUT2, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Comunicação Direta</Text>
                                                <Text style={{ fontSize: 22, fontWeight: "700", color: WHT, marginBottom: 12, letterSpacing: -0.5 }}>Grupo no WhatsApp</Text>
                                                <Text style={{ fontSize: 14, color: MUT2, lineHeight: 22 }}>Além do software, você terá um grupo exclusivo no WhatsApp com seu gestor de projeto para comunicação ágil e alinhamentos rápidos.</Text>
                                            </View>
                                        </View>

                                    </ScrollView>
                                </View>
                            )}

                            {/* INVESTMENT */}
                            {activeTab === "investment" && (
                                <View style={styles.tabContent}>
                                    <View style={styles.investCard}>
                                        <View style={styles.investHeader}>
                                            <ShieldCheck size={24} color={BLU} />
                                            <Text style={styles.investTitle}>Investimento Estimado</Text>
                                        </View>

                                        <Text style={styles.investLabel}>ORÇAMENTO BASE (ALGORITMO IA)</Text>
                                        <View style={styles.investValueRow}>
                                            <Text style={styles.investCurrency}>R$</Text>
                                            <Text style={styles.investValue}>{(selected.totalValue || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</Text>
                                        </View>

                                        <View style={styles.investGrid}>
                                            <View style={styles.investGridItem}>
                                                <Text style={styles.investGridLabel}>CRONOGRAMA</Text>
                                                <Text style={styles.investGridValue}>{selected.timeline || "A combinar"}</Text>
                                            </View>
                                            <View style={styles.investGridItem}>
                                                <Text style={styles.investGridLabel}>VOLUME DO ESCOPO</Text>
                                                <Text style={styles.investGridValue}>{selected.totalHours || 0} horas alocadas</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Payment options */}
                                    <View style={styles.paymentsCard}>
                                        <Text style={styles.paymentsTitle}>Condições de Pagamento</Text>
                                        {(selected.payments || []).map((pay, i) => (
                                            <View key={i} style={styles.paymentItem}>
                                                <Text style={styles.paymentName}>{pay.name}</Text>
                                                <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                                                    <View style={[styles.paymentPill, { backgroundColor: "rgba(34,255,181,0.10)" }]}>
                                                        <Text style={[styles.paymentPillText, { color: BLU }]}>
                                                            {pay.installments > 1 ? `${pay.installments}x` : pay.installments === 0 ? "Mensal" : "À vista"}
                                                        </Text>
                                                    </View>
                                                    {pay.discount > 0 && (
                                                        <View style={[styles.paymentPill, { backgroundColor: "rgba(34,255,181,0.10)" }]}>
                                                            <Text style={[styles.paymentPillText, { color: GRN }]}>{pay.discount}% OFF</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.ctaBtn, isPdfBusy && { opacity: 0.5 }]}
                                        disabled={isPdfBusy}
                                        onPress={() => handleDownloadPDF()}
                                    >
                                        {isPdfBusy
                                            ? <ActivityIndicator size="small" color={B} />
                                            : <><Download size={16} color={B} /><Text style={styles.ctaBtnText}>Baixar via PDF</Text></>
                                        }
                                    </TouchableOpacity>

                                    <Text style={styles.investNote}>
                                        Nota: Estimativas baseadas no volume de telas e funcionalidades. Podem sofrer ajustes finos após validação técnica.
                                    </Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Chat FAB */}
                        {activeTab === "scope" && (selected.screens || []).length > 0 && (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setCommentModalVisible(true)}
                                style={styles.chatFab}
                            >
                                <MessageCircle size={28} color={WHT} />
                                {(() => {
                                    const screen = (selected.screens || [])[screenIdx] || (selected.screens || [])[0];
                                    const count = feedbacks.filter(f => f.screenId === screen?.id).length;
                                    if (count > 0) {
                                        return (
                                            <View style={styles.chatFabBadge}>
                                                <Text style={styles.chatFabBadgeTxt}>{count}</Text>
                                            </View>
                                        );
                                    }
                                    return null;
                                })()}
                            </TouchableOpacity>
                        )}

                        {/* ═══ FEEDBACK MODAL (inside detail modal) ═══ */}
                        <Modal visible={commentModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCommentModalVisible(false)}>
                            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                                <View style={styles.modalContent}>
                                    <View style={styles.modalHeaderRow}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                            <MessageCircle size={20} color={BLU} />
                                            <Text style={styles.modalTitle}>Mensagens</Text>
                                        </View>
                                        <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.modalCloseBtn}>
                                            <X size={20} color={WHT} />
                                        </TouchableOpacity>
                                    </View>
                                    <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 20 }}>
                                        {selected && (() => {
                                            const activeScreen = (selected.screens || [])[screenIdx];
                                            const screenFeedbacks = feedbacks.filter(f => f.screenId === activeScreen?.id);
                                            if (screenFeedbacks.length === 0) {
                                                return <Text style={styles.modalEmptyText}>Nenhuma mensagem enviada nesta tela. Seja o primeiro a comentar!</Text>;
                                            }
                                            return screenFeedbacks.map((f, index) => (
                                                <View key={f.id} style={[styles.feedbackMsg, index === 0 ? { marginTop: 0 } : {}]}>
                                                    <Text style={{ fontSize: 11, fontWeight: '700', color: BLU, marginBottom: 2 }}>{f.author || "Usuário"}</Text>
                                                    <Text style={styles.feedbackText}>{f.text}</Text>
                                                    <Text style={styles.feedbackDate}>{new Date(f.date).toLocaleString('pt-BR')}</Text>
                                                </View>
                                            ));
                                        })()}
                                    </ScrollView>
                                    <View style={styles.modalInputArea}>
                                        <TextInput
                                            style={styles.modalInput}
                                            placeholder="Digite uma mensagem..."
                                            placeholderTextColor={MUT2}
                                            value={commentText}
                                            onChangeText={setCommentText}
                                            multiline
                                            editable={!isSavingComment}
                                        />
                                        <TouchableOpacity 
                                            style={[styles.modalSendBtn, (!commentText.trim() || isSavingComment) && { opacity: 0.5 }]}
                                            disabled={!commentText.trim() || isSavingComment}
                                            onPress={async () => {
                                                if (!selected || !commentText.trim() || isSavingComment) return;
                                                const activeScreen = selected.screens[screenIdx];
                                                
                                                setIsSavingComment(true);
                                                const payload = {
                                                    screenId: activeScreen.id,
                                                    screenTitle: activeScreen.title,
                                                    moduleName: activeScreen.module,
                                                    text: commentText.trim()
                                                };
                                                
                                                const res = await api<any>(`/api/proposals/client/a/${selected.id}/feedback`, {
                                                    method: "POST", body: payload
                                                });
                                                
                                                if (res?.success && res.data) {
                                                    setFeedbacks(prev => [...prev, res.data]);
                                                    setCommentText("");
                                                } else {
                                                    alert("Erro ao enviar comentário.");
                                                }
                                                setIsSavingComment(false);
                                            }}
                                        >
                                            {isSavingComment ? <ActivityIndicator size="small" color={WHT} /> : <Send size={18} color={WHT} />}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </KeyboardAvoidingView>
                        </Modal>

                    </View>
                )}
            </Modal>
        </View>
    );
}

// ══════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: B },
    content: { paddingHorizontal: 16, paddingBottom: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },

    pageHeader: { marginBottom: 20 },
    pageTitle: { fontSize: 32, fontWeight: "900", color: WHT, letterSpacing: -1 },
    pageSubtitle: { fontSize: 13, color: MUT, marginTop: 4, fontWeight: "500" },

    emptyState: { alignItems: "center", paddingVertical: 60, gap: 12, backgroundColor: C1, borderRadius: 24, borderWidth: 1, borderColor: MUT3 },
    emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: C1, borderWidth: 1, borderColor: MUT3, alignItems: "center", justifyContent: "center" },
    emptyTitle: { fontSize: 17, fontWeight: "800", color: "#94a3b8" },
    emptyDesc: { fontSize: 13, color: "#475569" },

    // ── Card ──
    card: { backgroundColor: C1, borderRadius: 20, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: MUT3 },
    cardInner: { flexDirection: "row", alignItems: "center", gap: 12 },
    cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" },
    cardTitle: { fontSize: 16, fontWeight: "800", color: WHT, letterSpacing: -0.3, flexShrink: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 9, fontWeight: "800" },
    cardClient: { fontSize: 13, color: "#94a3b8", marginBottom: 8 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 11, color: MUT2 },
    cardArrow: { alignItems: "center", gap: 2 },
    cardArrowLabel: { fontSize: 9, color: MUT2, fontWeight: "600" },

    // ── Detail ──
    detailContainer: { flex: 1, backgroundColor: B },
    detailHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: MUT3, backgroundColor: "rgba(15,23,42,0.8)" },
    headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C1, borderWidth: 1, borderColor: MUT3, alignItems: "center", justifyContent: "center" },
    headerEyebrow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
    headerEyebrowText: { fontSize: 8, fontWeight: "800", color: MUT2, letterSpacing: 1.5 },
    headerTitle: { fontSize: 14, fontWeight: "800", color: WHT },
    headerClientLabel: { fontSize: 8, fontWeight: "800", color: MUT2, letterSpacing: 1 },
    headerDate: { fontSize: 10, color: "#f5f5f7", marginTop: 2 },

    // ── Tab bar ──
    tabBar: { borderBottomWidth: 1, borderBottomColor: MUT3, backgroundColor: "rgba(15,23,42,0.6)" },
    tabBarInner: { paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
    tabItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    tabItemActive: { backgroundColor: WHT },
    tabLabel: { fontSize: 12, fontWeight: "700", color: MUT2 },
    tabLabelActive: { color: B },

    tabContent: { paddingHorizontal: 16, paddingTop: 24 },

    // ── Overview ──
    overviewHero: { alignItems: "center", gap: 12, marginBottom: 32 },
    avatarOuter: { width: 80, height: 80, borderRadius: 24, borderWidth: 1, borderColor: "rgba(34,255,181,0.20)", alignItems: "center", justifyContent: "center" },
    avatarInner: { width: 72, height: 72, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(34,255,181,0.10)" },
    avatarLetter: { fontSize: 36, fontWeight: "900", color: BLU },
    overviewEyebrow: { fontSize: 8, fontWeight: "800", color: MUT2, letterSpacing: 2 },
    overviewClient: { fontSize: 22, fontWeight: "800", color: WHT, letterSpacing: -0.5 },
    dividerLine: { width: 80, height: 1, backgroundColor: "rgba(34,255,181,0.30)", marginVertical: 8 },
    overviewTitle: { fontSize: 28, fontWeight: "900", color: WHT, textAlign: "center", letterSpacing: -1, lineHeight: 34 },
    overviewSummary: { fontSize: 14, color: MUT2, textAlign: "center", lineHeight: 22, paddingHorizontal: 8 },
    statsRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 8 },
    statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    statText: { fontSize: 12, color: MUT2, fontWeight: "600" },
    statDivider: { width: 1, height: 16, backgroundColor: "#424245" },

    sectionBlock: { marginTop: 8 },
    sectionLabel: { fontSize: 9, fontWeight: "800", color: MUT2, letterSpacing: 1.5, marginBottom: 12 },
    platformRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C1, borderWidth: 1, borderColor: MUT3, marginBottom: 8 },
    platformName: { fontSize: 14, fontWeight: "700", color: WHT, flex: 1 },
    platformCount: { fontSize: 11, color: MUT2, fontWeight: "600" },

    // ── Scope ──
    platformPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C1 },
    platformPillActive: { backgroundColor: BLU },
    platformPillText: { fontSize: 12, fontWeight: "700", color: MUT2 },
    platformPillTextActive: { color: WHT },
    scopeCard: { backgroundColor: C1, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: MUT3 },
    scopeTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    complexityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    complexityText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
    hoursBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "rgba(15,23,42,0.8)", borderWidth: 1, borderColor: MUT3 },
    hoursText: { fontSize: 9, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.5 },
    slideCounter: { marginLeft: "auto", fontSize: 10, fontWeight: "700", color: MUT2, letterSpacing: 1 },
    scopeModuleLabel: { fontSize: 10, fontWeight: "800", color: BLU, letterSpacing: 0.5, marginBottom: 4 },
    scopeTitle: { fontSize: 24, fontWeight: "900", color: WHT, letterSpacing: -0.5, marginBottom: 6 },
    scopeDesc: { fontSize: 14, color: MUT2, lineHeight: 22, marginBottom: 16 },
    featuresList: { gap: 14, marginTop: 8 },
    featureItem: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
    featureTitle: { fontSize: 14, fontWeight: "700", color: "#f5f5f7", lineHeight: 20 },
    featureDesc: { fontSize: 12, color: MUT2, lineHeight: 18, marginTop: 2 },
    navRow: { flexDirection: "row", gap: 10, marginTop: 20 },
    navBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, backgroundColor: "rgba(15,23,42,0.8)", borderWidth: 1, borderColor: MUT3 },
    navBtnText: { fontSize: 13, fontWeight: "700", color: WHT },
    navBtnPrimary: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 24, backgroundColor: "#f5f5f7" },
    navBtnPrimaryText: { fontSize: 13, fontWeight: "800", color: B },

    // ── Team ──
    teamHeroTitle: { fontSize: 32, fontWeight: "900", color: WHT, letterSpacing: -1, lineHeight: 38, marginBottom: 8 },
    teamHeroDesc: { fontSize: 14, color: MUT2, lineHeight: 22, marginBottom: 24 },
    teamCard: { backgroundColor: C1, borderRadius: 24, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: MUT3 },
    teamIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(15,23,42,0.8)", borderWidth: 1, borderColor: MUT3, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    teamRole: { fontSize: 17, fontWeight: "800", color: WHT, marginBottom: 6, letterSpacing: -0.3 },
    teamDesc: { fontSize: 13, color: MUT2, lineHeight: 20 },

    // ── Investment ──
    investCard: { backgroundColor: C1, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: MUT3, marginBottom: 16 },
    investHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
    investTitle: { fontSize: 22, fontWeight: "900", color: WHT, letterSpacing: -0.5 },
    investLabel: { fontSize: 9, fontWeight: "800", color: MUT2, letterSpacing: 1.5, marginBottom: 8 },
    investValueRow: { flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 24 },
    investCurrency: { fontSize: 18, fontWeight: "900", color: BLU },
    investValue: { fontSize: 38, fontWeight: "900", color: WHT, letterSpacing: -1 },
    investGrid: { flexDirection: "row", gap: 10, borderTopWidth: 1, borderTopColor: MUT3, paddingTop: 16 },
    investGridItem: { flex: 1, backgroundColor: "rgba(15,23,42,0.8)", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: MUT3 },
    investGridLabel: { fontSize: 8, fontWeight: "800", color: "#475569", letterSpacing: 1.5, marginBottom: 6 },
    investGridValue: { fontSize: 14, fontWeight: "800", color: WHT },

    paymentsCard: { backgroundColor: C1, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: MUT3, marginBottom: 16 },
    paymentsTitle: { fontSize: 17, fontWeight: "800", color: WHT, marginBottom: 16 },
    paymentItem: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "rgba(15,23,42,0.7)", borderWidth: 1, borderColor: MUT3, marginBottom: 8 },
    paymentName: { fontSize: 14, fontWeight: "800", color: WHT },
    paymentPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    paymentPillText: { fontSize: 9, fontWeight: "800" },

    ctaBtn: { backgroundColor: "#f5f5f7", paddingVertical: 18, borderRadius: 16, alignItems: "center", marginBottom: 12 },
    ctaBtnText: { fontSize: 15, fontWeight: "900", color: B },

    investNote: { fontSize: 11, color: "#475569", lineHeight: 18, fontStyle: "italic", textAlign: "center", paddingHorizontal: 8 },

    // ── Feedback ──
    chatFab: { position: "absolute", bottom: 40, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: BLU, alignItems: "center", justifyContent: "center", shadowColor: BLU, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 100 },
    chatFabBadge: { position: "absolute", top: -5, right: -5, backgroundColor: "#ef4444", minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: B },
    chatFabBadgeTxt: { color: WHT, fontSize: 10, fontWeight: "900" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: C1, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "80%" },
    modalHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: MUT3 },
    modalTitle: { fontSize: 18, fontWeight: "800", color: WHT },
    modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: MUT3, alignItems: "center", justifyContent: "center" },
    modalScroll: { minHeight: 150 },
    modalEmptyText: { fontSize: 13, color: MUT2, textAlign: "center", marginTop: 40, paddingHorizontal: 20, lineHeight: 20 },
    feedbackMsg: { backgroundColor: "rgba(34,255,181,0.1)", padding: 14, borderRadius: 16, borderBottomLeftRadius: 4, alignSelf: "flex-end", maxWidth: "85%", marginTop: 12 },
    feedbackText: { fontSize: 14, color: WHT, lineHeight: 20 },
    feedbackDate: { fontSize: 9, color: MUT2, marginTop: 4, textAlign: "right" },
    modalInputArea: { flexDirection: "row", alignItems: "flex-end", gap: 10, padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: MUT3, backgroundColor: "rgba(15,23,42,0.6)" },
    modalInput: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", borderWidth: 1, borderColor: MUT3, borderRadius: 20, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, color: WHT, fontSize: 14, minHeight: 48, maxHeight: 120 },
    modalSendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: BLU, alignItems: "center", justifyContent: "center" },
});
