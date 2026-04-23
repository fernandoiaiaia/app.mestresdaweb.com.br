"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, ChevronRight, ChevronLeft, Layers,
    ShieldCheck, Sparkles, Download, ArrowLeft,
    Monitor, Smartphone, Globe, Cpu, Terminal, Loader2, Users,
    MessageCircle, Send, X,
    MessageSquare, FileText, Package, Smartphone as SmartphoneAlt, Headphones
} from "lucide-react";
import Image from "next/image";
import { fetchAssembledProposal, fetchScreenFeedback, postScreenFeedback, type ClientProposal, type ScreenFeedback } from "@/lib/proposals-api";
import MatrixRain from "@/components/shared/MatrixRain";

// ── Types (Matching CompleteScope from Assembler) ──────────────────────────
interface ScopeFunctionality { id: string; title: string; description: string; estimatedHours?: number; }
interface ScopeScreen { id: string; title: string; description: string; functionalities: ScopeFunctionality[]; }
interface ScopeModule { id: string; title: string; screens: ScopeScreen[]; }
interface ScopePlatform { id: string; platformName: string; objective?: string; modules: ScopeModule[]; }
interface ScopeUserNode { id: string; userName: string; platforms: ScopePlatform[]; }
interface ScopeIntegration { id: string; title: string; description: string; estimatedHours?: number; }
interface CompleteScope { id: string; title?: string; clientId?: string; validityDays?: number; projectSummary?: string; users: ScopeUserNode[]; integrations: ScopeIntegration[]; createdAt: string; }

function getRoleDescription(role: string): string {
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
}

interface PresentationScreen { id: string; title: string; screenDescription: string; features: { title: string; description: string }[]; complexity: string; estimatedHours: number; moduleTitle: string; platformId: string; }
interface PresentationModule { id: string; title: string; screens: PresentationScreen[]; }
interface PresentationPlatform { id: string; title: string; icon: string; count: number; modules: PresentationModule[]; }
interface PdfTeamMember { role: string; seniority: string; hourlyRate: number; }
interface PdfPayment { id: string; name: string; installments: number; discount: number; active: boolean; }

// ── Apple Design System Tokens ──────────────────────────────────────────────
const ADS = {
    font: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    text: '#1d1d1f',
    textTitle: '#000000',
    muted: '#86868b',
    subtle: '#6e6e73',
    bg: '#ffffff',
    bgLight: '#f5f5f7',
    bgSection: '#fbfbfd',
    border: '#d2d2d7',
    borderStrong: '#1d1d1f',
    blue: '#0071e3',
    blueLight: 'rgba(0,113,227,0.08)',
    blueBorder: 'rgba(0,113,227,0.18)',
};

// ── PDF Sub-components (Identical to Web Comercial) ─────────────────────────
function PdfSectionHeader({ eyebrow, title, rightSlot }: { eyebrow: string; title: string; rightSlot?: React.ReactNode }) {
    return (
        <div style={{ paddingBottom: '14px', borderBottom: `1.5px solid ${ADS.borderStrong}`, marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ fontSize: '7pt', color: ADS.muted, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, marginBottom: '5px' }}>{eyebrow}</div>
                    <h2 style={{ fontSize: '19pt', fontWeight: 600, letterSpacing: '-0.025em', color: ADS.textTitle, margin: 0, lineHeight: 1.1 }}>{title}</h2>
                </div>
                {rightSlot && <div style={{ textAlign: 'right' }}>{rightSlot}</div>}
            </div>
        </div>
    );
}

function PdfStat({ value, label }: { value: string | number; label: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '15pt', fontWeight: 600, color: ADS.textTitle, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '6.5pt', color: ADS.muted, textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: '3px' }}>{label}</div>
        </div>
    );
}

function PdfStatDivider() { return <div style={{ width: '1px', height: '28px', background: ADS.border }} />; }

function PdfModuleTag({ title, count }: { title: string; count: number }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 11px', borderRadius: '7px', background: ADS.bgLight, borderLeft: `2.5px solid ${ADS.textTitle}`, marginBottom: '9px' }}>
            <span style={{ fontSize: '9.5pt', fontWeight: 600, color: ADS.text }}>{title}</span>
            <span style={{ fontSize: '7pt', color: ADS.muted, marginLeft: 'auto' }}>{count} tela{count !== 1 ? 's' : ''}</span>
        </div>
    );
}

function PdfPageFooter({ page }: { page: number | string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: `1px solid ${ADS.border}`, marginTop: '24px' }}>
            <span style={{ fontSize: '7pt', color: ADS.muted, letterSpacing: '0.05em' }}>Proposta Técnica 360° · Mestres da Web</span>
            <span style={{ fontSize: '7pt', color: ADS.muted }}>{page}</span>
        </div>
    );
}

function PrintLayout({ scope, client, totalHours, totalValue, timeline, team = [], payments = [] }: {
    scope: CompleteScope | null;
    client: { name: string; company?: string | null; companyRef?: { name: string } | null; email?: string | null } | null;
    totalHours: number;
    totalValue: number;
    timeline: string;
    team?: PdfTeamMember[];
    payments?: PdfPayment[];
}) {
    if (!scope) return null;

    const clientName = client ? (client.companyRef?.name || client.company || client.name) : (scope.users[0]?.userName || 'Cliente');
    const todayDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const totalScreens = scope.users.reduce((a, u) => a + u.platforms.reduce((b, p) => b + p.modules.reduce((c, m) => c + m.screens.length, 0), 0), 0);
    const totalPlatforms = scope.users.reduce((a, u) => a + u.platforms.filter(p => p.modules.length > 0).length, 0);

    const base: React.CSSProperties = { fontFamily: ADS.font, color: ADS.text, background: ADS.bg, fontSize: '10pt', lineHeight: '1.55' };

    return (
        <div style={base}>
            {/* CAPA */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '250mm', padding: '0', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: `1px solid ${ADS.border}` }}>
                    <span style={{ fontSize: '7pt', color: ADS.muted, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700 }}>Proposta Técnica Exclusiva</span>
                    <span style={{ fontSize: '7.5pt', color: ADS.muted }}>{todayDate}</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 32px', gap: '28px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/branding/logo-negativo.png" alt="Mestres da Web" style={{ maxWidth: '340px', maxHeight: '120px', objectFit: 'contain' }} />
                    <div><p style={{ fontSize: '8.5pt', color: ADS.muted, margin: 0 }}>Para: <strong style={{ color: ADS.text, fontWeight: 600 }}>{clientName}</strong></p></div>
                    <div style={{ width: '48px', height: '1px', background: ADS.blue, opacity: 0.4 }} />
                    <div style={{ maxWidth: '420px', gap: '12px' }}>
                        <h1 style={{ fontSize: '30pt', fontWeight: 600, color: ADS.textTitle, lineHeight: 1.06 }}>{scope.title || 'Proposta Técnica 360°'}</h1>
                        {scope.projectSummary && <p style={{ fontSize: '10.5pt', color: ADS.muted, fontWeight: 300, lineHeight: 1.65, marginTop: '12px' }}>{scope.projectSummary}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '28px', alignItems: 'center', marginTop: '4px' }}>
                        <PdfStat value={totalScreens} label="Telas" />
                        <PdfStatDivider />
                        <PdfStat value={scope.users.length} label="Perfis" />
                        <PdfStatDivider />
                        <PdfStat value={totalPlatforms} label="Plataformas" />
                    </div>
                </div>

                {/* Company Info - COVER PAGE BOTTOM */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: `1px solid ${ADS.border}`, paddingTop: '24px', margin: '0 32px 32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '8pt', color: ADS.text, lineHeight: 1.5 }}>
                            <strong style={{ fontWeight: 600 }}>Razão Social:</strong> Mestres da Web LTDA.<br />
                            <strong style={{ fontWeight: 600 }}>CNPJ:</strong> 09.228.742/0001-43
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div style={{ fontSize: '8pt', color: ADS.muted, lineHeight: 1.5 }}>
                                <strong style={{ color: ADS.text, fontWeight: 600 }}>Endereço Brasil</strong><br/>
                                Av. Ver. Narciso Yague Guimarães, n° 764 - 1° e 2° Andar<br/>
                                Centro Cívico, Mogi das Cruzes - SP, 08780-200
                            </div>
                            <div style={{ fontSize: '8pt', color: ADS.muted, lineHeight: 1.5 }}>
                                <strong style={{ color: ADS.text, fontWeight: 600 }}>Endereço EUA</strong><br/>
                                1395 Brickell Ave Suite #800<br/>
                                Miami, FL 33131, Estados Unidos
                            </div>
                        </div>
                    </div>
                </div>

                <PdfPageFooter page={1} />
            </div>

            {/* ESCOPO */}
            {scope.users.flatMap((user, uIdx) =>
                user.platforms.filter(p => p.modules.length > 0).map((plat, pIdx) => (
                    <div key={`${uIdx}-${pIdx}`} style={{ pageBreakBefore: 'always' }}>
                        <PdfSectionHeader eyebrow={`Escopo Técnico · ${user.userName}`} title={plat.platformName} />
                        {plat.modules.map((mod, mIdx) => (
                            <div key={mIdx} style={{ marginBottom: '18px' }}>
                                <PdfModuleTag title={mod.title} count={mod.screens.length} />
                                {mod.screens.map((screen, sIdx) => (
                                    <div key={sIdx} style={{ marginBottom: '7px', padding: '10px 12px', border: `1px solid ${ADS.border}`, borderRadius: '8px', breakInside: 'avoid', background: ADS.bg }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                            <h4 style={{ fontSize: '9.5pt', fontWeight: 600, color: ADS.text, margin: 0 }}>{screen.title}</h4>
                                        </div>
                                        {screen.description && <p style={{ fontSize: '8pt', color: ADS.muted, margin: '0 0 6px', lineHeight: 1.5, fontWeight: 300 }}>{screen.description}</p>}
                                        <div style={{ borderTop: `1px solid ${ADS.bgLight}`, paddingTop: '5px' }}>
                                            {screen.functionalities.map((func, fIdx) => (
                                                <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '8pt' }}>
                                                    <span style={{ color: ADS.blue, fontWeight: 700 }}>✓</span>
                                                    <span>{func.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                        <PdfPageFooter page="—" />
                    </div>
                ))
            )}

            {/* INVESTIMENTO */}
            <div style={{ pageBreakBefore: 'always' }}>
                <PdfSectionHeader eyebrow="Orçamento Estimado" title="Resumo do Investimento" />
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px', paddingBottom: '20px', borderBottom: `1px solid ${ADS.border}` }}>
                    <span style={{ fontSize: '12pt', color: ADS.muted }}>R$</span>
                    <span style={{ fontSize: '36pt', fontWeight: 600, color: ADS.textTitle }}>{totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ padding: '14px 16px', background: ADS.bgLight, borderRadius: '10px' }}>
                        <div style={{ fontSize: '7pt', color: ADS.muted, textTransform: 'uppercase', fontWeight: 700 }}>Cronograma</div>
                        <div style={{ fontSize: '11.5pt', fontWeight: 600, color: ADS.text }}>{timeline}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: ADS.bgLight, borderRadius: '10px' }}>
                        <div style={{ fontSize: '7pt', color: ADS.muted, textTransform: 'uppercase', fontWeight: 700 }}>Volume</div>
                        <div style={{ fontSize: '11.5pt', fontWeight: 600, color: ADS.text }}>{totalHours} horas alocadas</div>
                    </div>
                </div>

                {payments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '10.5pt', fontWeight: 600, color: ADS.text, marginBottom: '10px' }}>Condições de Pagamento</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {payments.map((p, idx) => (
                                <div key={idx} style={{ padding: '11px 13px', border: `1px solid ${ADS.border}`, borderRadius: '8px' }}>
                                    <h4 style={{ fontSize: '9pt', fontWeight: 600, color: ADS.text, margin: '0 0 3px' }}>{p.name}</h4>
                                    <div style={{ fontSize: '8pt', color: ADS.muted }}>
                                        {p.installments > 1 ? `${p.installments}x` : p.installments === 0 ? 'Mensal' : 'À vista'}
                                        {p.discount > 0 ? ` · ${p.discount}% de desconto` : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <PdfPageFooter page="—" />
            </div>

            {/* EQUIPE */}
            {team.length > 0 && (
                <div style={{ pageBreakBefore: 'always' }}>
                    <PdfSectionHeader eyebrow="Equipe Técnica" title="Engenharia de Alta Performance" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {team.map((member, idx) => (
                            <div key={idx} style={{ padding: '12px 14px', border: `1px solid ${ADS.border}`, borderRadius: '9px', breakInside: 'avoid' }}>
                                <h4 style={{ fontSize: '9pt', fontWeight: 600, color: ADS.text, margin: '0 0 4px' }}>{member.role}</h4>
                                <p style={{ fontSize: '7.5pt', color: ADS.muted, margin: 0, lineHeight: 1.5 }}>{getRoleDescription(member.role)}</p>
                            </div>
                        ))}
                    </div>
                    <PdfPageFooter page="—" />
                </div>
            )}
        </div>
    );
}

// ── Main Page Logic ──────────────────────────────────────────────────────────
function inferPlatformIcon(title: string): string {
    const t = title.toLowerCase();
    if (t.includes("mobile") || t.includes("app") || t.includes("ios") || t.includes("android")) return "smartphone";
    if (t.includes("web") || t.includes("painel") || t.includes("dashboard")) return "monitor";
    if (t.includes("api") || t.includes("backend")) return "terminal";
    if (t.includes("ecommerce") || t.includes("site")) return "globe";
    return "monitor";
}

const getPlatformIcon = (iconName: string, className: string = "") => {
    switch (iconName) {
        case 'monitor': return <Monitor size={16} className={className} />;
        case 'smartphone': return <Smartphone size={16} className={className} />;
        case 'globe': return <Globe size={16} className={className} />;
        case 'cpu': return <Cpu size={16} className={className} />;
        case 'terminal': return <Terminal size={16} className={className} />;
        default: return <Layers size={16} className={className} />;
    }
};

// ── Framer Motion Variants (matching Web Comercial) ──────────────────────────
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } } };
const fadeLeft = { hidden: { opacity: 0, x: -24 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" as const } } };

export default function AssembledProposalPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: proposalId } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [proposal, setProposal] = useState<ClientProposal | null>(null);
    const [scope, setScope] = useState<CompleteScope | null>(null);
    const [platforms, setPlatforms] = useState<PresentationPlatform[]>([]);
    const [activeTab, setActiveTab] = useState<'overview' | 'scope' | 'team' | 'investment'>('overview');
    const [activeScreenIndex, setActiveScreenIndex] = useState(0);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [comments, setComments] = useState<Record<string, ScreenFeedback[]>>({});
    const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
    const [commentText, setCommentText] = useState("");
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [team, setTeam] = useState<PdfTeamMember[]>([]);
    const [payments, setPayments] = useState<PdfPayment[]>([]);

    const mainScrollRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!proposalId) return;
        setLoading(true);
        fetchAssembledProposal(proposalId)
            .then(res => {
                if (res.success && res.data) {
                    setProposal(res.data);
                    const sData = res.data.scopeData as CompleteScope;
                    setScope(sData);

                    const mappedPlatforms: PresentationPlatform[] = sData.users.flatMap((user, uIdx) => {
                        return user.platforms.map((plat, pIdx) => {
                            let screenCount = 0;
                            const mods: PresentationModule[] = plat.modules.map((m, mIdx) => {
                                const scrs: PresentationScreen[] = m.screens.map((s, sIdx) => {
                                    const h = s.functionalities.reduce((acc, f) => acc + (f.estimatedHours || 0), 0);
                                    return {
                                        id: s.id || `s-${uIdx}-${pIdx}-${mIdx}-${sIdx}`,
                                        title: s.title,
                                        screenDescription: s.description || "",
                                        moduleTitle: m.title,
                                        platformId: `p-${uIdx}-${pIdx}`,
                                        features: s.functionalities.map(f => ({ title: f.title, description: f.description || "" })),
                                        complexity: h > 24 ? "very_high" : h > 16 ? "high" : h > 8 ? "medium" : "low",
                                        estimatedHours: h
                                    };
                                });
                                screenCount += scrs.length;
                                return { id: `m-${mIdx}`, title: m.title, screens: scrs };
                            }).filter(m => m.screens.length > 0);

                            return {
                                id: `p-${uIdx}-${pIdx}`,
                                title: `${plat.platformName} - ${user.userName}`,
                                icon: inferPlatformIcon(plat.platformName),
                                count: screenCount,
                                modules: mods
                            };
                        }).filter(p => p.count > 0);
                    });
                    setPlatforms(mappedPlatforms);

                    // ── Fetch team (filtered by platform type, like Web Comercial) ──
                    import('../../../../../lib/api').then(({ api }) => {
                        api<{ role: string; seniority: string; isActive: boolean; hourlyRate: number }[]>(`/api/proposals/client/a/${proposalId}/team`).then(teamRes => {
                            if (teamRes.success && teamRes.data) {
                                const hasMobile = mappedPlatforms.some(p => { const t = p.title.toLowerCase(); return t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("app"); });
                                const hasDesktop = mappedPlatforms.some(p => p.title.toLowerCase().includes("desktop"));
                                const hasWeb = mappedPlatforms.some(p => { const t = p.title.toLowerCase(); return t.includes("web") || t.includes("ecommerce") || t.includes("e-commerce") || t.includes("site"); });

                                const filteredTeam = teamRes.data.filter(p => {
                                    const r = p.role.toLowerCase();
                                    if (r.includes("front end mobile") || r.includes("frontend mobile")) return hasMobile;
                                    if (r.includes("front end desktop") || r.includes("frontend desktop")) return hasDesktop;
                                    if (r.includes("front end") || r.includes("frontend")) return hasWeb;
                                    return true;
                                });
                                setTeam(filteredTeam);
                            }
                        });

                        api<{ id: string; name: string; installments: number; discount: number; active: boolean }[]>(`/api/proposals/client/a/${proposalId}/payments`).then(payRes => {
                            if (payRes.success && payRes.data) setPayments(payRes.data.filter(p => p.active));
                        });
                    });

                } else {
                    // Proposal not found
                }
            })
            .catch(() => { /* Error loading proposal */ })
            .finally(() => setLoading(false));

        // Load existing feedbacks from API
        fetchScreenFeedback(proposalId).then(res => {
            if (res.success && res.data) {
                const grouped: Record<string, ScreenFeedback[]> = {};
                for (const fb of res.data) {
                    if (!grouped[fb.screenId]) grouped[fb.screenId] = [];
                    grouped[fb.screenId].push(fb);
                }
                setComments(grouped);
            }
        });
    }, [proposalId]);

    // PDF Download — clone-based render to avoid blank PDFs
    const handleDownloadPDF = async () => {
        if (isPdfLoading || !scope) return;
        setIsPdfLoading(true);
        let wrapper: HTMLDivElement | null = null;

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const source = document.getElementById('pdf-proposal-content');
            if (!source) return;

            // Clone the print layout and render it offscreen (but visible for html2canvas)
            const clone = source.cloneNode(true) as HTMLElement;
            clone.id = 'pdf-proposal-clone';
            clone.classList.remove('hidden', 'print-only');
            clone.style.cssText = [
                'width: 794px',
                'background: #ffffff',
                'padding: 0 57px',
                'box-sizing: border-box',
                'font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif',
                '-webkit-font-smoothing: antialiased',
                'display: block',
            ].join(';');

            wrapper = document.createElement('div');
            wrapper.style.cssText = [
                'position: fixed',
                'left: -10000px',
                'top: 0',
                'width: 794px',
                'background: #ffffff',
                'z-index: -1',
            ].join(';');
            wrapper.appendChild(clone);
            document.body.appendChild(wrapper);

            await new Promise(requestAnimationFrame);

            const safeTitle = (proposal?.title || 'Proposta_Tecnica')
                .replace(/[^a-zA-Z0-9\s\-_]/g, '')
                .replace(/\s+/g, '_')
                .slice(0, 60);
            const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (html2pdf() as any).set({
                margin: [15, 0, 15, 0],
                filename: `${safeTitle}_${dateStr}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    windowWidth: 794,
                    width: 794,
                    scrollX: 0,
                    scrollY: 0,
                },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy', 'avoid-all'] },
            }).from(clone).save();
        } catch (e) {
            console.error('PDF generation failed:', e);
        } finally {
            if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            setIsPdfLoading(false);
        }
    };

    // Horizontal scroll support
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (mainScrollRef.current && !e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault();
                mainScrollRef.current.scrollBy({ left: e.deltaY * 1.5 });
            }
        };
        const target = mainScrollRef.current;
        if (target) {
            target.addEventListener("wheel", handleWheel, { passive: false });
            return () => target.removeEventListener("wheel", handleWheel);
        }
    }, [activeTab]);

    if (loading || !scope) return (
        <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white"><Loader2 size={32} className="animate-spin text-blue-500 mb-4" /><h3 className="text-xl font-semibold">Carregando Proposta...</h3></div>
    );

    const baseHours = scope.users.reduce((acc, u) => acc + u.platforms.reduce((acc2, p) => acc2 + p.modules.reduce((acc3, m) => acc3 + m.screens.reduce((acc4, s) => acc4 + s.functionalities.reduce((acc5, f) => acc5 + (f.estimatedHours || 0), 0), 0), 0), 0), 0);
    const totalHours = baseHours + (scope.integrations?.reduce((acc, i) => acc + (i.estimatedHours || 0), 0) ?? 0);
    const totalValue = totalHours * 150;
    const timeline = totalHours > 0 ? `Aproximadamente ${Math.ceil(totalHours / 160)} meses` : "A definir";
    const FlatScreens = platforms.flatMap(p => p.modules.flatMap(m => m.screens)) || [];
    const activeScreenContext = FlatScreens[activeScreenIndex] || FlatScreens[0];
    const computedPlatformId = activeScreenContext?.platformId || platforms[0]?.id;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] overflow-hidden flex flex-col text-white">
            <MatrixRain />
            
            <header className="relative z-50 shrink-0 flex items-center justify-between px-6 lg:px-12 py-6 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.push('/dashboard/proposals')} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={18} /></button>
                    <div><div className="flex items-center gap-2 mb-1"><Sparkles size={12} className="text-[#2997ff]" /><span className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.2em]">Padrão Ouro de Engenharia</span></div><h1 className="text-xl font-semibold tracking-tight">{proposal?.title || "Proposta Técnica"}</h1></div>
                </div>
                <div className="hidden lg:flex items-center bg-slate-800/60 rounded-full p-1 border border-slate-700/50">
                    {[
                        { id: 'overview', label: 'Visão Geral' },
                        ...(platforms.length > 0 ? [{ id: 'scope', label: 'Escopo' }] : []),
                        ...(team.length > 0 ? [{ id: 'team', label: 'Equipe Global' }] : []),
                        { id: 'tracking', label: 'Acompanhamento' },
                        { id: 'investment', label: 'Investimento' },
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-all relative ${activeTab === tab.id ? 'text-black' : 'text-[#86868b] hover:text-white'}`}>
                            {activeTab === tab.id && <motion.div layoutId="client-tab" className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm" transition={{ type: "spring", stiffness: 450, damping: 30 }} />}
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="hidden lg:flex items-center gap-6">
                    <button onClick={() => window.open('http://localhost:1100/presentation-mestres', '_blank')}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-white font-semibold text-[13px] transition-colors border border-slate-700/50 shadow-sm"
                    >
                        <Sparkles size={14} className="text-[#2997ff]" /> Conheça a Mestres
                    </button>
                    <div className="flex flex-col items-end border-l border-slate-700/50 pl-6">
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#86868b]">Para: {proposal?.clientName || "Cliente"}</p>
                        <p className="text-xs text-[#f5f5f7] mt-1">{new Date(scope.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full relative overflow-hidden flex z-10 p-4 md:p-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div key="o" initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} variants={staggerContainer}
                            ref={mainScrollRef}
                            className="w-full h-full flex flex-row gap-8 md:gap-12 px-2 overflow-x-auto overflow-y-hidden custom-scrollbar snap-x snap-mandatory pb-4 hide-native-scrollbar items-center">

                            <motion.div variants={fadeLeft} className="w-screen shrink-0 h-full flex flex-col items-center justify-center snap-center relative overflow-hidden px-6 md:px-16">
                                {/* Background decorative orbs */}
                                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
                                {/* Grid lines overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

                                <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full gap-8">
                                    {/* Client avatar */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }} className="flex flex-col items-center gap-4">
                                        <div className="relative">
                                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 backdrop-blur-sm flex items-center justify-center shadow-[0_0_40px_rgba(41,151,255,0.15)]">
                                                <span className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#2997ff] to-[#a020f0]">
                                                    {(proposal?.clientName || "P").charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 rounded-3xl border border-[#2997ff]/20 scale-110 pointer-events-none" />
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#86868b]">Proposta Técnica Exclusiva</p>
                                            {proposal?.clientName && (
                                                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{proposal.clientName}</h2>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Divider */}
                                    <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.3, duration: 0.7 }}
                                        className="w-[120px] h-px bg-gradient-to-r from-transparent via-[#2997ff]/60 to-transparent" />

                                    {/* Project title */}
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }} className="flex flex-col items-center gap-4">
                                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.02] font-semibold tracking-tighter text-white">
                                            {scope.title ? scope.title : (
                                                <>Proposta<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2997ff] via-[#6e40c9] to-[#a020f0]">Técnica 360º</span></>
                                            )}
                                        </h1>
                                        {scope.projectSummary && (
                                            <p className="text-[15px] md:text-[17px] text-[#86868b] font-light leading-relaxed max-w-2xl">
                                                {scope.projectSummary.length > 240 ? scope.projectSummary.substring(0, 240) + "..." : scope.projectSummary}
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* Meta info row */}
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
                                        className="flex items-center gap-4 md:gap-8 flex-wrap justify-center">
                                        <div className="flex items-center gap-2 text-[13px] text-[#86868b]">
                                            <Layers size={14} className="text-[#2997ff]" />
                                            <span>{scope.users.reduce((a, u) => a + u.platforms.reduce((b, p) => b + p.modules.reduce((c, m) => c + m.screens.length, 0), 0), 0)} Telas</span>
                                        </div>
                                        <div className="w-px h-4 bg-[#424245]" />
                                        <div className="flex items-center gap-2 text-[13px] text-[#86868b]">
                                            <Users size={14} className="text-[#a020f0]" />
                                            <span>{scope.users.length} Perfis de usuário</span>
                                        </div>
                                        {scope.validityDays && (
                                            <>
                                                <div className="w-px h-4 bg-[#424245]" />
                                                <div className="flex items-center gap-2 text-[13px] text-[#86868b]">
                                                    <ShieldCheck size={14} className="text-[#27c93f]" />
                                                    <span>Válida por {scope.validityDays} dias</span>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                    {activeTab === 'scope' && platforms.length > 0 && (
                        <motion.div key="s" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                            className="w-full h-full flex flex-col overflow-hidden max-w-[1400px] mx-auto">
                            
                            {/* Platform pills bar */}
                            <div className="shrink-0 mb-6 flex items-center justify-center w-full">
                                <div ref={tabsRef} className="flex gap-2 overflow-x-auto hide-native-scrollbar p-1">
                                    {platforms.map(platform => (
                                        <button key={platform.id} onClick={() => {
                                            const firstIndex = FlatScreens.findIndex(s => s.platformId === platform.id);
                                            if (firstIndex !== -1) setActiveScreenIndex(firstIndex);
                                        }}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-[14px] transition-all whitespace-nowrap ${computedPlatformId === platform.id ? 'bg-[#2997ff] text-white shadow-[0_0_20px_rgba(41,151,255,0.4)]' : 'bg-[#1d1d1f] text-[#86868b] hover:text-white hover:bg-[#2d2d2f]'}`}>
                                            <div className={computedPlatformId === platform.id ? 'text-white' : 'text-[#86868b]'}>{getPlatformIcon(platform.icon)}</div>
                                            {platform.title}
                                            {computedPlatformId !== platform.id && <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-[#86868b]">{platform.count}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {FlatScreens.length > 0 && activeScreenContext && (
                                <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden pb-4">
                                    <motion.div className="w-full h-full max-h-[800px] bg-slate-800/60 rounded-[40px] border border-slate-700/50 flex flex-col md:flex-row overflow-hidden relative shadow-2xl backdrop-blur-md">

                                        {/* Left: phone mock */}
                                        <div className="hidden md:flex flex-[0.8] lg:flex-1 bg-gradient-to-br from-[#0a0a0a] to-[#000] border-r border-[#424245] flex-col items-center justify-center p-8 lg:p-12 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(41,151,255,0.05),transparent_70%)]" />
                                            <div className="w-full max-w-[320px] aspect-[9/16] bg-[#000] rounded-[32px] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] border-[6px] border-[#2d2d2f] flex flex-col relative z-10 transition-transform hover:scale-[1.02] duration-500">
                                                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#2997ff]/20 rounded-full blur-2xl z-0" />
                                                <div className="bg-[#1d1d1f] px-5 py-3 flex justify-between items-center border-b border-[#424245] z-10">
                                                    <div className="w-20 h-3 rounded-full bg-[#424245]"/>
                                                </div>
                                                <div className="flex-1 p-5 flex flex-col gap-4 z-10">
                                                    <div className="w-auto h-6 rounded-md bg-[#2997ff]/20 text-[#2997ff] text-[10px] items-center flex px-2 font-bold max-w-fit">{activeScreenContext.moduleTitle}</div>
                                                    <div className="w-[80%] h-6 rounded-lg bg-[#f5f5f7]/80"/>
                                                    <div className="w-[40%] h-4 rounded-lg bg-[#f5f5f7]/40"/>
                                                    <div className="w-full h-24 rounded-2xl bg-[#1d1d1f] border border-[#2d2d2f] mt-4 shadow-inner"/>
                                                    <div className="flex gap-2 w-full mt-auto">
                                                        <div className="h-10 flex-[2] rounded-xl bg-gradient-to-r from-[#2997ff] to-[#0071e3] shadow-[0_0_15px_rgba(41,151,255,0.3)]"/>
                                                        <div className="h-10 flex-[1] rounded-xl bg-[#1d1d1f] border border-[#2d2d2f]"/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: features */}
                                        <div className="flex-[1.2] lg:flex-1 p-8 md:p-12 flex flex-col relative bg-slate-800/40 overflow-hidden">
                                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-4 mb-4 flex flex-col">
                                                <div className="flex items-center gap-3 mb-6 flex-wrap shrink-0">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${activeScreenContext.complexity === 'very_high' ? 'bg-[#ff3b30]/10 text-[#ff3b30]' : 'bg-[#2997ff]/10 text-[#2997ff]'}`}>
                                                        {activeScreenContext.complexity === 'very_high' ? 'Muito Alta' : activeScreenContext.complexity === 'high' ? 'Alta' : 'Média/Baixa'}
                                                    </span>
                                                    {activeScreenContext.estimatedHours > 0 && <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-900/80 border border-slate-700/50 text-slate-400">{activeScreenContext.estimatedHours} horas</span>}

                                                    {/* Comment button */}
                                                    <button
                                                        onClick={() => { setShowCommentModal(activeScreenContext.id); setCommentText(""); }}
                                                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 transition-all border ${
                                                            (comments[activeScreenContext.id]?.length || 0) > 0
                                                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30 shadow-[0_0_12px_rgba(41,151,255,0.2)]'
                                                                : 'bg-white/5 text-[#86868b] border-white/10 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                    >
                                                        <MessageCircle size={13} />
                                                        {(comments[activeScreenContext.id]?.length || 0) > 0 ? `${comments[activeScreenContext.id].length}` : 'Comentar'}
                                                    </button>

                                                    <span className="text-[#86868b] text-[12px] ml-auto font-medium tracking-widest uppercase">Lâmina {activeScreenIndex + 1} de {FlatScreens.length}</span>
                                                </div>
                                                <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4 shrink-0">{activeScreenContext.title}</h3>
                                                {activeScreenContext.screenDescription && (
                                                    <p className="text-[#86868b] text-[17px] font-light leading-relaxed mb-6 shrink-0">{activeScreenContext.screenDescription}</p>
                                                )}
                                                <ul className="space-y-6 pb-6">
                                                    {activeScreenContext.features.map((feat, idx) => (
                                                        <li key={idx} className="flex items-start gap-4">
                                                            <CheckCircle2 size={22} className="text-[#2997ff] shrink-0 mt-0.5" strokeWidth={2} />
                                                            <div className="flex flex-col gap-1">
                                                                <span className="text-[17px] text-[#f5f5f7] leading-tight font-medium tracking-tight">{feat.title}</span>
                                                                {feat.description && <span className="text-[15px] font-light text-[#86868b] leading-relaxed">{feat.description}</span>}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {/* Existing comments for this screen */}
                                                {(comments[activeScreenContext.id]?.length || 0) > 0 && (
                                                    <div className="mt-auto border-t border-white/5 pt-4 space-y-3">
                                                        <p className="text-[10px] font-bold tracking-[0.2em] text-[#86868b] uppercase">Seus Comentários</p>
                                                        {comments[activeScreenContext.id].map((c, ci) => (
                                                            <div key={ci} className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                                                <MessageCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
                                                                <div className="flex-1">
                                                                    <p className="text-[13px] text-[#f5f5f7] leading-relaxed">{c.text}</p>
                                                                    <p className="text-[10px] text-[#86868b] mt-1">{c.date}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-6 border-t border-slate-700/50 flex gap-3 shrink-0">
                                                <button onClick={() => setActiveScreenIndex(p => p === 0 ? FlatScreens.length - 1 : p - 1)} className="flex items-center justify-center w-14 h-14 md:w-auto md:px-6 md:py-3.5 rounded-full bg-slate-900/80 border border-slate-700/50 text-white hover:bg-slate-800 transition-all"><ChevronLeft size={18} /> <span className="hidden md:block ml-2 font-medium">Anterior</span></button>
                                                <button onClick={() => setActiveScreenIndex(p => p === FlatScreens.length - 1 ? 0 : p + 1)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#f5f5f7] text-black hover:bg-white hover:scale-[1.02] transition-all font-semibold">Avançar Lâmina <ChevronRight size={18} /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    )}
                    {activeTab === 'team' && team.length > 0 && (
                        <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
                            ref={mainScrollRef}
                            className="w-full h-full flex items-center px-4 md:px-12 overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-native-scrollbar gap-6 md:gap-8">
                            
                            <div className="w-[300px] md:w-[400px] shrink-0 snap-center md:pl-10">
                                <h3 className="text-4xl md:text-[60px] leading-[1.05] font-semibold tracking-tighter text-white mb-4 md:mb-6">Times de <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2997ff] to-[#a020f0]">Alta Perfomance.</span></h3>
                                <p className="text-lg md:text-xl text-[#86868b] font-light max-w-[300px]">Engenheiros especialistas escalados para garantir a execução primorosa do seu projeto.</p>
                            </div>
                            
                            {team.map((member, idx) => (
                                <div key={idx} className="w-[280px] md:w-[350px] h-auto min-h-[320px] shrink-0 snap-center bg-slate-800/60 border border-slate-700/50 rounded-[32px] md:rounded-[40px] p-6 md:p-8 hover:border-slate-600/60 transition-all duration-300 flex flex-col relative overflow-hidden group backdrop-blur-md">
                                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-br from-[#2997ff]/20 to-[#a020f0]/10 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none rounded-full" />
                                    
                                    <div className="flex items-start justify-between mb-auto z-10 w-full">
                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900/80 border border-slate-700/50 flex items-center justify-center text-slate-200 shadow-xl group-hover:scale-110 transition-transform"><Users size={24} className="md:w-7 md:h-7" /></div>
                                    </div>
                                    <div className="z-10 w-full pb-2 pt-6">
                                        <h4 className="text-xl md:text-2xl font-semibold text-white mb-2 md:mb-4 tracking-tight">{member.role}</h4>
                                        <p className="text-[14px] md:text-[15px] font-light text-[#86868b] leading-relaxed">{getRoleDescription(member.role)}</p>
                                    </div>
                                </div>
                            ))}
                            <div className="w-20 shrink-0" />
                        </motion.div>
                    )}

                    {/* TRACKING — Módulos do Software de Acompanhamento */}
                    {activeTab === 'tracking' && (
                        <motion.div key="tr" initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} variants={staggerContainer}
                            ref={mainScrollRef}
                            className="w-full h-full flex items-center px-4 md:px-12 overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-native-scrollbar gap-6 md:gap-8">

                            {/* Intro card */}
                            <motion.div variants={fadeLeft} className="w-[340px] md:w-[420px] shrink-0 snap-center pl-4 md:pl-10">
                                <h3 className="text-4xl md:text-[56px] leading-[1.05] font-semibold tracking-tighter text-white mb-4 md:mb-6">
                                    Como acompanhar<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2997ff] to-[#30d158]">meu projeto?</span>
                                </h3>
                                <p className="text-lg md:text-xl text-[#86868b] font-light max-w-[380px] leading-relaxed mb-6">
                                    Através do nosso Software e App interativo, você acompanha todo o desenvolvimento em tempo real. Todos os módulos ficam disponíveis simultaneamente para sua consulta.
                                </p>
                                <div className="flex items-center gap-3 text-[#86868b]">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#2997ff] to-[#30d158]" />
                                        <span className="text-xs font-medium">Software + App</span>
                                    </div>
                                    <span className="text-white/20">•</span>
                                    <span className="text-xs">Deslize para explorar →</span>
                                </div>
                            </motion.div>

                            {/* Module cards */}
                            {[
                                {
                                    title: "Proposta Comercial",
                                    subtitle: "Visualização & Impressão",
                                    description: "Consulte sua proposta técnica completa com escopo detalhado, investimento e condições a qualquer momento. Visualize, imprima ou baixe em PDF — tudo organizado e sempre acessível.",
                                    image: "/images/Proposta.png",
                                    gradient: "from-[#2997ff] to-[#5ac8fa]",
                                    glowColor: "rgba(41,151,255,0.12)",
                                    icon: FileText,
                                },
                                {
                                    title: "Dashboard do Projeto",
                                    subtitle: "Visão Geral & Métricas",
                                    description: "Acompanhe o progresso geral do seu projeto com gráficos intuitivos, indicadores de performance e status em tempo real. Saiba exatamente em que ponto cada entrega se encontra.",
                                    image: "/images/Dashboard.png",
                                    gradient: "from-[#30d158] to-[#34c759]",
                                    glowColor: "rgba(48,209,88,0.12)",
                                    icon: Layers,
                                },
                                {
                                    title: "Telas & Funcionalidades",
                                    subtitle: "Acompanhamento Granular",
                                    description: "Visualize cada tela e funcionalidade individualmente. Envie feedbacks contextualizados, solicite ajustes e aprove entregas — tudo organizado por módulo e tela.",
                                    image: "/images/Telas e Funcionalidades.png",
                                    gradient: "from-[#a020f0] to-[#bf5af2]",
                                    glowColor: "rgba(160,32,240,0.12)",
                                    icon: Monitor,
                                },
                                {
                                    title: "Documentos",
                                    subtitle: "Central de Documentação",
                                    description: "Acesse todos os documentos do projeto: contratos, briefings, wireframes, atas de reunião e materiais de referência — centralizados e sempre atualizados.",
                                    image: "/images/Documentos.png",
                                    gradient: "from-[#ff9f0a] to-[#ff6723]",
                                    glowColor: "rgba(255,159,10,0.12)",
                                    icon: FileText,
                                },
                                {
                                    title: "Entregas",
                                    subtitle: "Registro & Validação",
                                    description: "Cada entrega é documentada com detalhes, prints e registros. Além das reuniões online de apresentação, tudo fica registrado no software e app para consulta futura.",
                                    image: "/images/Entrega.png",
                                    gradient: "from-[#ff375f] to-[#ff6482]",
                                    glowColor: "rgba(255,55,95,0.12)",
                                    icon: Package,
                                },
                            ].map((mod, idx) => (
                                <motion.div variants={fadeLeft} key={idx} className="w-[380px] md:w-[520px] shrink-0 snap-center group relative">
                                    {/* Glow */}
                                    <div className="absolute -inset-2 rounded-[36px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" style={{ background: `radial-gradient(ellipse at center, ${mod.glowColor}, transparent 70%)` }} />
                                    
                                    <div className="relative bg-slate-800/50 border border-slate-700/40 rounded-[28px] md:rounded-[32px] overflow-hidden backdrop-blur-md hover:border-slate-600/50 transition-all duration-500">
                                        {/* Top accent */}
                                        <div className="h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-40" style={{ color: mod.glowColor.replace('0.12', '1') }} />
                                        
                                        {/* Screenshot */}
                                        <div className="relative overflow-hidden">
                                            <Image
                                                src={mod.image}
                                                alt={mod.title}
                                                width={1200}
                                                height={700}
                                                className="w-full h-[200px] md:h-[260px] object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                                            {/* Module icon overlay */}
                                            <div className="absolute top-4 left-4">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${mod.gradient} shadow-lg`}>
                                                    <mod.icon size={12} className="text-white" />
                                                    <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-white">{mod.title}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Text content */}
                                        <div className="p-5 md:p-7">
                                            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#86868b] mb-1.5">{mod.subtitle}</p>
                                            <h4 className="text-xl md:text-2xl font-semibold text-white tracking-tight mb-3">{mod.title}</h4>
                                            <p className="text-[13px] md:text-[14px] font-light text-[#86868b] leading-relaxed">{mod.description}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* WhatsApp card */}
                            <motion.div variants={fadeLeft} className="w-[380px] md:w-[520px] shrink-0 snap-center group relative">
                                <div className="absolute -inset-2 rounded-[36px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(37,211,102,0.12), transparent 70%)' }} />
                                
                                <div className="relative bg-slate-800/50 border border-slate-700/40 rounded-[28px] md:rounded-[32px] overflow-hidden backdrop-blur-md hover:border-[#25D366]/30 transition-all duration-500">
                                    {/* Top accent */}
                                    <div className="h-[2px] bg-gradient-to-r from-transparent via-[#25D366] to-transparent opacity-40" />
                                    
                                    {/* Hero area — same height as screenshots */}
                                    <div className="relative h-[200px] md:h-[260px] bg-gradient-to-br from-[#25D366]/10 via-[#128C7E]/5 to-slate-900/50 flex items-center justify-center overflow-hidden">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,211,102,0.15),transparent_60%)]" />
                                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500" style={{ boxShadow: '0 20px 60px rgba(37,211,102,0.25)' }}>
                                            <Headphones size={40} className="text-white md:w-12 md:h-12" />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />
                                        {/* Module badge */}
                                        <div className="absolute top-4 left-4">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] shadow-lg">
                                                <Headphones size={12} className="text-white" />
                                                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-white">WhatsApp</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text content */}
                                    <div className="p-5 md:p-7">
                                        <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#86868b] mb-1.5">Comunicação Direta</p>
                                        <h4 className="text-xl md:text-2xl font-semibold text-white tracking-tight mb-3">Grupo no WhatsApp</h4>
                                        <p className="text-[13px] md:text-[14px] font-light text-[#86868b] leading-relaxed">
                                            Além do software, você terá um grupo exclusivo no WhatsApp com seu gestor de projeto para comunicação ágil, alinhamentos rápidos e atualizações em tempo real.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            <div className="w-20 shrink-0" />
                        </motion.div>
                    )}
                    {activeTab === 'investment' && (
                        <motion.div key="i" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ opacity: 0 }} 
                            className="w-full h-full flex flex-col xl:flex-row items-center justify-center xl:justify-start gap-8 px-4 md:px-12 overflow-y-auto xl:overflow-y-hidden hide-native-scrollbar py-12 xl:py-0">
                            
                            <div className="w-full max-w-[800px] xl:max-w-none xl:flex-1 bg-slate-800/60 border border-slate-700/50 rounded-[40px] p-8 md:p-12 relative shadow-2xl overflow-hidden backdrop-blur-md">
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                                <div className="relative z-10 space-y-10">
                                    <div className="flex items-center gap-4">
                                        <ShieldCheck size={32} className="text-[#2997ff]" />
                                        <h3 className="text-3xl md:text-5xl font-bold tracking-tight">Investimento Estimado</h3>
                                    </div>
                                    
                                    <div>
                                        <p className="text-[#86868b] text-xs font-bold uppercase tracking-widest mb-4">Orçamento Base (Algoritmo IA)</p>
                                        <div className="flex items-baseline gap-3">
                                            <span className="text-2xl text-[#2997ff] font-black">R$</span>
                                            <span className="text-6xl md:text-8xl font-black tracking-tighter">{totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-white/10">
                                        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-700/50">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-widest">Cronograma Médio</p>
                                            <p className="text-2xl font-bold">{timeline}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-700/50">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2 tracking-widest">Complexidade do Escopo</p>
                                            <p className="text-2xl font-bold">{totalHours} horas alocadas</p>
                                        </div>
                                    </div>
                                    <p className="text-slate-500 text-sm leading-relaxed max-w-xl italic">Nota: Estimativas iniciais baseadas no volume de telas e funcionalidades descritas. Podem sofrer ajustes finos após validação técnica presencial.</p>
                                </div>
                            </div>

                            <div className="w-full max-w-[800px] xl:w-[450px] shrink-0 space-y-6">
                                <div className="p-8 bg-slate-800/60 border border-slate-700/50 rounded-[40px] backdrop-blur-md">
                                    <h4 className="text-xl font-bold mb-6 flex items-center gap-2">Condições de Pgto</h4>
                                    {payments.length === 0 ? (
                                        <p className="text-slate-500 text-sm">Consulte seu gerente de contas para opções personalizadas de parcelamento e descontos à vista.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {payments.map((p, idx) => (
                                                <div key={idx} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-700/50 hover:border-slate-500/50 transition-all">
                                                    <h5 className="font-bold text-white mb-2">{p.name}</h5>
                                                    <div className="flex gap-2">
                                                        {p.installments > 1 ? <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">{p.installments}x</span> : p.installments === 0 ? <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold">Mensal</span> : <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">À vista</span>}
                                                        {p.discount > 0 && <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold">{p.discount}% OFF</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <button className="w-full py-5 bg-[#f5f5f7] text-black font-bold rounded-2xl hover:bg-white transition-all scale-100 hover:scale-[1.02] active:scale-95 shadow-xl">Falar com Especialista</button>
                                    <button onClick={handleDownloadPDF} disabled={isPdfLoading} className="w-full py-5 bg-slate-800/80 border border-slate-700/50 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                                        {isPdfLoading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                                        {isPdfLoading ? "Gerando Proposta..." : "Baixar Apresentação PDF"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Comment Modal */}
            <AnimatePresence>
                {showCommentModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowCommentModal(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <MessageCircle size={18} className="text-blue-400" />
                                    Comentário / Feedback
                                </h4>
                                <button onClick={() => setShowCommentModal(null)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
                            </div>
                            <p className="text-[12px] text-[#86868b] mb-4">Deixe aqui seu comentário, dúvida ou sugestão sobre esta tela. O consultor receberá sua mensagem.</p>
                            <textarea
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                                rows={4}
                                placeholder="Escreva seu comentário sobre esta tela..."
                                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 resize-none transition-colors"
                            />
                            {/* Existing comments */}
                            {(comments[showCommentModal]?.length || 0) > 0 && (
                                <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
                                    {comments[showCommentModal].map((c, ci) => (
                                        <div key={ci} className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                            <MessageCircle size={12} className="text-blue-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[12px] text-[#f5f5f7]">{c.text}</p>
                                                <p className="text-[9px] text-[#86868b] mt-1">{c.date ? new Date(c.date).toLocaleString('pt-BR') : ""}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end mt-4 gap-3">
                                <button onClick={() => setShowCommentModal(null)} className="px-5 py-2 rounded-full text-sm font-medium text-[#86868b] hover:text-white transition-colors">Cancelar</button>
                                <button
                                    disabled={!commentText.trim() || isSendingComment}
                                    onClick={async () => {
                                        if (!commentText.trim() || !showCommentModal) return;
                                        setIsSendingComment(true);
                                        try {
                                            // Find the screen context for metadata
                                            const screen = FlatScreens.find(s => s.id === showCommentModal);
                                            const res = await postScreenFeedback(proposalId, {
                                                screenId: showCommentModal,
                                                screenTitle: screen?.title || "",
                                                moduleName: screen?.moduleTitle || "",
                                                text: commentText.trim(),
                                            });
                                            if (res.success && res.data) {
                                                setComments(prev => ({
                                                    ...prev,
                                                    [showCommentModal]: [...(prev[showCommentModal] || []), res.data!],
                                                }));
                                                setCommentText("");
                                            }
                                        } finally {
                                            setIsSendingComment(false);
                                        }
                                    }}
                                    className="px-6 py-2.5 rounded-full bg-[#2997ff] hover:bg-[#0077ED] text-white font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(41,151,255,0.3)]"
                                >
                                    <Send size={14} />
                                    Enviar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hidden content for PDF generation */}
            <div className="hidden" aria-hidden="true" id="pdf-proposal-content">
                <PrintLayout 
                    scope={scope} 
                    client={{ name: proposal?.clientName || "Cliente" }} 
                    totalHours={totalHours} 
                    totalValue={totalValue} 
                    timeline={timeline}
                    team={team}
                    payments={payments}
                />
            </div>
        </div>
    );
}
