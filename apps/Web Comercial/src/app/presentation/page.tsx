"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, ChevronRight, ChevronLeft, Layers,
    ShieldCheck, Sparkles, Download,
    Monitor, Smartphone, Globe, Cpu, Terminal, Loader2, Users, ArrowLeft
} from "lucide-react";
import { CompleteScope, loadScopeDraft } from "../dashboard/crm/assembler/_shared";
import { api } from "@/lib/api";
import MatrixRain from "@/components/shared/MatrixRain";

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

function inferPlatformIcon(title: string): string {
    const t = title.toLowerCase();
    if (t.includes("mobile") || t.includes("app") || t.includes("ios") || t.includes("android")) return "smartphone";
    if (t.includes("web") || t.includes("painel") || t.includes("dashboard")) return "monitor";
    if (t.includes("api") || t.includes("backend")) return "terminal";
    if (t.includes("ecommerce") || t.includes("site")) return "globe";
    return "monitor";
}

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

// ── Apple Design System Tokens (from /Design Systems) ────────────────────────
const ADS = {
    // Typography — SF Pro Display / SF Pro Text (same as Apple.com BR)
    font: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif",
    // Colors & Surfaces (MacBook Neo DS + iPhone 17 Pro DS)
    text:       '#1d1d1f',   // Primary text — Apple Dark
    textTitle:  '#000000',   // Section titles — pure black for maximum contrast
    muted:      '#86868b',   // Secondary text
    subtle:     '#6e6e73',   // Tertiary / footnotes
    bg:         '#ffffff',   // Page background — white A4
    bgLight:    '#f5f5f7',   // Light Gray — elevated surface
    bgSection:  '#fbfbfd',   // Section alt background
    border:     '#d2d2d7',   // Standard divider (MacBook Neo DS)
    borderStrong:'#1d1d1f',  // Bold header dividers
    blue:       '#0071e3',   // Apple Blue — links / CTA / accent
    blueLight:  'rgba(0,113,227,0.08)', // Blue tint background
    blueBorder: 'rgba(0,113,227,0.18)', // Blue tint border
};

// ── PDF sub-components at MODULE level (prevents React 'component-during-render' error) ──

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

function PdfStatDivider() {
    return <div style={{ width: '1px', height: '28px', background: ADS.border }} />;
}

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

// ── Print Layout A4 (white background, Apple DS tokens) ──────────────────────

type PdfTeamMember = { role: string; seniority: string };
type PdfPayment = { id?: string; name: string; installments: number; discount: number };

function PrintLayout({ scope, team, payments, client, totalHours, totalValue, timeline }: {
    scope: CompleteScope;
    team: PdfTeamMember[];
    payments: PdfPayment[];
    client: { name: string; company?: string | null; companyRef?: { name: string } | null; email?: string | null } | null;
    totalHours: number;
    totalValue: number;
    timeline: string;
}) {
    const clientName = client
        ? (client.companyRef?.name || client.company || client.name)
        : (scope.users[0]?.userName || 'Cliente');
    const clientInitial = clientName.charAt(0).toUpperCase();
    const clientContact = client?.name && (client.companyRef?.name || client.company) ? client.name : null;
    const todayDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const totalScreens = scope.users.reduce((a, u) => a + u.platforms.reduce((b, p) => b + p.modules.reduce((c, m) => c + m.screens.length, 0), 0), 0);
    const totalPlatforms = scope.users.reduce((a, u) => a + u.platforms.filter(p => p.modules.length > 0).length, 0);

    const base: React.CSSProperties = {
        fontFamily: ADS.font,
        color: ADS.text,
        background: ADS.bg,
        fontSize: '10pt',
        lineHeight: '1.55',
        WebkitFontSmoothing: 'antialiased',
    };

    return (
        <div style={base}>

            {/* ══════════════════════════════════════════════════════════
                CAPA — Cover Page
            ══════════════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '250mm', padding: '0', breakInside: 'avoid' }}>

                {/* Top nav strip */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    paddingBottom: '16px', borderBottom: `1px solid ${ADS.border}`,
                    marginBottom: '0',
                }}>
                    <span style={{
                        fontSize: '7pt', color: ADS.muted,
                        textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700,
                    }}>Proposta Técnica Exclusiva</span>
                    <span style={{ fontSize: '7.5pt', color: ADS.muted }}>{todayDate}</span>
                </div>

                {/* Hero content block */}
                <div style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    textAlign: 'center', padding: '48px 32px 40px',
                    gap: '28px',
                }}>
                    {/* Client avatar */}
                    <img src="/branding/logo-negativo.png" alt="Mestres da Web" style={{ maxWidth: '340px', maxHeight: '120px', objectFit: 'contain' }} />

                    {/* Client label */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <p style={{ fontSize: '8.5pt', color: ADS.muted, margin: 0 }}>
                            Para: <strong style={{ color: ADS.text, fontWeight: 600 }}>{clientName}</strong>
                        </p>
                        {clientContact && (
                            <p style={{ fontSize: '8pt', color: ADS.muted, margin: 0 }}>Att. {clientContact}</p>
                        )}
                    </div>

                    {/* Blue rule divider */}
                    <div style={{ width: '48px', height: '1px', background: ADS.blue, opacity: 0.4 }} />

                    {/* Project title + summary */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: '12px', maxWidth: '420px',
                    }}>
                        <h1 style={{
                            fontSize: '30pt', fontWeight: 600,
                            letterSpacing: '-0.03em', color: ADS.textTitle,
                            margin: 0, lineHeight: 1.06,
                        }}>
                            {scope.title || 'Proposta Técnica 360°'}
                        </h1>
                        {scope.projectSummary && (
                            <p style={{
                                fontSize: '10.5pt', color: ADS.muted, fontWeight: 300,
                                lineHeight: 1.65, margin: 0,
                            }}>
                                {scope.projectSummary.length > 280
                                    ? scope.projectSummary.substring(0, 280) + '…'
                                    : scope.projectSummary
                                }
                            </p>
                        )}
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: '28px', alignItems: 'center', marginTop: '4px' }}>
                        <PdfStat value={totalScreens} label="Telas" />
                        <PdfStatDivider />
                        <PdfStat value={scope.users.length} label="Perfis" />
                        <PdfStatDivider />
                        <PdfStat value={totalPlatforms} label="Plataformas" />
                        {totalHours > 0 && <>
                            <PdfStatDivider />
                            <PdfStat value={`${totalHours}h`} label="Estimadas" />
                        </>}
                        {scope.validityDays && <>
                            <PdfStatDivider />
                            <PdfStat value={scope.validityDays} label="Dias válida" />
                        </>}
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

            {/* ══════════════════════════════════════════════════════════
                PÁGINAS DE ESCOPO — one page per platform
            ══════════════════════════════════════════════════════════ */}
            {scope.users.flatMap((user, uIdx) =>
                user.platforms.filter(p => p.modules.length > 0).map((plat, pIdx) => {
                    const platHours = plat.modules.reduce((a, m) =>
                        a + m.screens.reduce((b, s) =>
                            b + s.functionalities.reduce((c, f) => c + (f.estimatedHours || 0), 0), 0), 0);
                    const platScreens = plat.modules.reduce((a, m) => a + m.screens.length, 0);
                    const pageNum = uIdx + pIdx + 2;

                    return (
                        <div key={`${uIdx}-${pIdx}`} style={{ pageBreakBefore: 'always' }}>
                            <PdfSectionHeader
                                eyebrow={`Escopo Técnico · ${user.userName}`}
                                title={plat.platformName}
                                rightSlot={
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <div>
                                            <div style={{ fontSize: '12pt', fontWeight: 600, color: ADS.text, lineHeight: 1 }}>{platScreens}</div>
                                            <div style={{ fontSize: '6.5pt', color: ADS.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Telas</div>
                                        </div>
                                        {platHours > 0 && (
                                            <div>
                                                <div style={{ fontSize: '12pt', fontWeight: 600, color: ADS.blue, lineHeight: 1 }}>{platHours}h</div>
                                                <div style={{ fontSize: '6.5pt', color: ADS.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>Estimadas</div>
                                            </div>
                                        )}
                                    </div>
                                }
                            />

                            {plat.objective && (
                                <p style={{
                                    fontSize: '9pt', color: ADS.muted, margin: '-10px 0 18px',
                                    fontWeight: 300, lineHeight: 1.6,
                                }}>{plat.objective}</p>
                            )}

                            {plat.modules.map((mod, mIdx) => (
                                <div key={mIdx} style={{ marginBottom: '18px' }}>
                                    <PdfModuleTag title={mod.title} count={mod.screens.length} />

                                    {mod.screens.map((screen, sIdx) => {
                                        const screenHours = screen.functionalities.reduce((a, f) => a + (f.estimatedHours || 0), 0);
                                        return (
                                            <div key={sIdx} style={{
                                                marginBottom: '7px', padding: '10px 12px',
                                                border: `1px solid ${ADS.border}`, borderRadius: '8px',
                                                breakInside: 'avoid', background: ADS.bg,
                                            }}>
                                                {/* Screen header */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                                    <h4 style={{ fontSize: '9.5pt', fontWeight: 600, color: ADS.text, margin: 0 }}>{screen.title}</h4>
                                                    {screenHours > 0 && (
                                                        <span style={{
                                                            fontSize: '7.5pt', fontWeight: 600, color: ADS.blue,
                                                            background: ADS.blueLight, padding: '1px 8px',
                                                            borderRadius: '100px', flexShrink: 0, marginLeft: '10px',
                                                        }}>{screenHours}h</span>
                                                    )}
                                                </div>

                                                {screen.description && (
                                                    <p style={{
                                                        fontSize: '8pt', color: ADS.muted,
                                                        margin: '0 0 6px', lineHeight: 1.5, fontWeight: 300,
                                                    }}>{screen.description}</p>
                                                )}

                                                {screen.functionalities.length > 0 && (
                                                    <div style={{
                                                        borderTop: `1px solid ${ADS.bgLight}`,
                                                        paddingTop: '5px', display: 'flex', flexDirection: 'column', gap: '3px',
                                                    }}>
                                                        {screen.functionalities.map((func, fIdx) => (
                                                            <div key={fIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                                                                <span style={{
                                                                    color: ADS.blue, fontSize: '7.5pt',
                                                                    marginTop: '2px', flexShrink: 0, fontWeight: 700,
                                                                }}>✓</span>
                                                                <div style={{ flex: 1 }}>
                                                                    <span style={{ fontSize: '8pt', fontWeight: 500, color: ADS.text }}>{func.title}</span>
                                                                    {func.description && (
                                                                        <span style={{ fontSize: '7pt', color: ADS.muted, marginLeft: '5px' }}>{func.description}</span>
                                                                    )}
                                                                </div>
                                                                {(func.estimatedHours || 0) > 0 && (
                                                                    <span style={{ fontSize: '7pt', color: ADS.muted, flexShrink: 0 }}>{func.estimatedHours}h</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            <PdfPageFooter page={pageNum} />
                        </div>
                    );
                })
            )}

            {/* ══════════════════════════════════════════════════════════
                INTEGRAÇÕES SISTÊMICAS
            ══════════════════════════════════════════════════════════ */}
            {scope.integrations && scope.integrations.length > 0 && (
                <div style={{ pageBreakBefore: 'always' }}>
                    <PdfSectionHeader eyebrow="Infraestrutura Técnica" title="Integrações Sistêmicas" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {scope.integrations.map((integ, iIdx) => (
                            <div key={iIdx} style={{
                                padding: '12px 14px', border: `1px solid ${ADS.border}`,
                                borderRadius: '9px', breakInside: 'avoid',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                    <h4 style={{ fontSize: '9pt', fontWeight: 600, color: ADS.text, margin: 0 }}>{integ.title}</h4>
                                    {(integ.estimatedHours || 0) > 0 && (
                                        <span style={{
                                            fontSize: '8pt', fontWeight: 600, color: ADS.blue,
                                            flexShrink: 0, marginLeft: '8px',
                                        }}>{integ.estimatedHours}h</span>
                                    )}
                                </div>
                                {integ.description && (
                                    <p style={{ fontSize: '8pt', color: ADS.muted, margin: 0, lineHeight: 1.5 }}>{integ.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    <PdfPageFooter page="—" />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                EQUIPE GLOBAL
            ══════════════════════════════════════════════════════════ */}
            {team.length > 0 && (
                <div style={{ pageBreakBefore: 'always' }}>
                    <PdfSectionHeader eyebrow="Time Alocado" title="Equipe Global" />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        {team.map((member, idx) => (
                            <div key={idx} style={{
                                padding: '12px 14px', border: `1px solid ${ADS.border}`,
                                borderRadius: '9px', breakInside: 'avoid',
                            }}>
                                <h4 style={{ fontSize: '9pt', fontWeight: 600, color: ADS.text, margin: '0 0 4px' }}>{member.role}</h4>
                                <p style={{ fontSize: '7.5pt', color: ADS.muted, margin: 0, lineHeight: 1.5 }}>{getRoleDescription(member.role)}</p>
                            </div>
                        ))}
                    </div>
                    <PdfPageFooter page="—" />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                INVESTIMENTO & CONDIÇÕES
            ══════════════════════════════════════════════════════════ */}
            <div style={{ pageBreakBefore: 'always' }}>
                <PdfSectionHeader eyebrow="Orçamento · Algoritmo IA Ad-Hoc" title="Investimento Total" />

                {/* Total value — large display number */}
                <div style={{
                    display: 'flex', alignItems: 'baseline', gap: '6px',
                    marginBottom: '20px', paddingBottom: '20px',
                    borderBottom: `1px solid ${ADS.border}`,
                }}>
                    <span style={{ fontSize: '12pt', color: ADS.muted, fontWeight: 500 }}>R$</span>
                    <span style={{
                        fontSize: '36pt', fontWeight: 600,
                        letterSpacing: '-0.03em', color: ADS.textTitle, lineHeight: 1,
                    }}>
                        {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>

                {/* KPI cards — timeline & volume */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ padding: '14px 16px', background: ADS.bgLight, borderRadius: '10px' }}>
                        <div style={{
                            fontSize: '7pt', color: ADS.muted, textTransform: 'uppercase',
                            letterSpacing: '0.12em', fontWeight: 700, marginBottom: '5px',
                        }}>Cronograma Estimado</div>
                        <div style={{ fontSize: '11.5pt', fontWeight: 600, color: ADS.text }}>{timeline}</div>
                    </div>
                    <div style={{ padding: '14px 16px', background: ADS.bgLight, borderRadius: '10px' }}>
                        <div style={{
                            fontSize: '7pt', color: ADS.muted, textTransform: 'uppercase',
                            letterSpacing: '0.12em', fontWeight: 700, marginBottom: '5px',
                        }}>Volume do Escopo</div>
                        <div style={{ fontSize: '11.5pt', fontWeight: 600, color: ADS.text }}>{totalHours} horas alocadas</div>
                    </div>
                </div>

                {/* Payment conditions */}
                {payments.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{
                            fontSize: '10.5pt', fontWeight: 600, color: ADS.text,
                            marginBottom: '10px', marginTop: 0,
                        }}>Condições de Pagamento</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {payments.map((p, idx) => (
                                <div key={idx} style={{
                                    padding: '11px 13px',
                                    border: `1px solid ${ADS.border}`, borderRadius: '8px',
                                }}>
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

                {/* Legal footnote */}
                <div style={{ padding: '14px 16px', background: ADS.bgLight, borderRadius: '9px', marginBottom: '20px' }}>
                    <p style={{ fontSize: '7.5pt', color: ADS.muted, lineHeight: 1.65, margin: 0 }}>
                        Os valores e cronogramas apresentados são estimativas geradas via Algoritmo IA Ad-Hoc e podem ser refinados junto ao arquiteto de software responsável durante sessões técnicas de alinhamento de prioridades.
                        Esta proposta tem validade de <strong style={{ color: ADS.subtle }}>{scope.validityDays || 15} dias</strong> a partir da data de emissão.
                    </p>
                </div>

                <PdfPageFooter page="—" />
            </div>
        </div>
    );
}

export default function PresentationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [scope, setScope] = useState<CompleteScope | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [platforms, setPlatforms] = useState<PresentationPlatform[]>([]);
    const [team, setTeam] = useState<PdfTeamMember[]>([]);
    const [payments, setPayments] = useState<PdfPayment[]>([]);
    const [client, setClient] = useState<{ name: string; company?: string | null; companyRef?: { name: string } | null; email?: string | null } | null>(null);

    const [activeTab, setActiveTab] = useState<'overview' | 'scope' | 'team' | 'investment'>('overview');
    const [activeScreenIndex, setActiveScreenIndex] = useState(0);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const tabsRef = useRef<HTMLDivElement>(null);
    const mainScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchScope = async () => {
             let currentScope: CompleteScope | null = null;
             
             if (id) {
                 try {
                     const res = await api<{ scopeData: CompleteScope; client?: { name: string; company?: string | null; companyRef?: { name: string } | null; email?: string | null }; [key: string]: unknown }>(`/api/assembler/proposals/${id}`);
                     if (res.success && res.data) {
                         // Unwrap raw scopeData (handle old double-nested bug)
                         let sData: CompleteScope = res.data.scopeData as CompleteScope;
                         if (sData && (sData as unknown as { scopeData?: CompleteScope }).scopeData) sData = (sData as unknown as { scopeData: CompleteScope }).scopeData;
                         currentScope = sData;
                         // Capture client from API response
                         if (res.data.client) setClient(res.data.client);
                     }
                 } catch (e) {
                     console.error("Failed to load proposal by id", e);
                 }
             }
             
             if (!currentScope) {
                 currentScope = loadScopeDraft();
             }

             if (!currentScope) {
                 router.push("/dashboard/crm/assembler/new");
                 return;
             }
             setScope(currentScope);
             
             const mappedPlatforms: PresentationPlatform[] = currentScope.users.flatMap((user, uIdx) => {
            return user.platforms.map((plat, pIdx) => {
                let screenCount = 0;
                const mods: PresentationModule[] = plat.modules.map((m, mIdx) => {
                    const scrs: PresentationScreen[] = m.screens.map((s, sIdx) => {
                        const h = s.functionalities.reduce((acc, f) => acc + (f.estimatedHours || 0), 0);
                        const pId = `p-${uIdx}-${pIdx}`;
                        return {
                            id: `s-${uIdx}-${pIdx}-${mIdx}-${sIdx}`,
                            title: s.title,
                            screenDescription: s.description || "",
                            moduleTitle: m.title,
                            platformId: pId,
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

        api<{ role: string; seniority: string; isActive: boolean }[]>("/api/professionals").then(res => {
            let filteredTeam: { role: string; seniority: string; isActive: boolean }[] = [];
            
            const hasMobile = mappedPlatforms.some(p => {
                const t = p.title.toLowerCase();
                return t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("app");
            });
            const hasDesktop = mappedPlatforms.some(p => p.title.toLowerCase().includes("desktop"));
            const hasWeb = mappedPlatforms.some(p => {
                const t = p.title.toLowerCase();
                return t.includes("web") || t.includes("ecommerce") || t.includes("e-commerce") || t.includes("site");
            });

            if (res.success && res.data) {
                filteredTeam = res.data.filter(p => p.isActive).filter(p => {
                    const r = p.role.toLowerCase();
                    if (r.includes("front end mobile") || r.includes("frontend mobile")) return hasMobile;
                    if (r.includes("front end desktop") || r.includes("frontend desktop")) return hasDesktop;
                    if (r.includes("front end") || r.includes("frontend")) return hasWeb;
                    return true;
                });
            }
            
            if (filteredTeam.length === 0) {
                filteredTeam = [
                    { role: "Product Owner", seniority: "Sênior", isActive: true },
                    { role: "UX/UI Designer", seniority: "Pleno", isActive: true },
                    { role: "Tech Lead", seniority: "Especialista", isActive: true },
                    { role: "QA Engineer", seniority: "Pleno", isActive: true },
                    { role: "Back End Engineer", seniority: "Sênior", isActive: true }
                ];
                if (hasMobile) filteredTeam.push({ role: "Engenheiro Mobile", seniority: "Sênior", isActive: true });
                if (hasWeb) filteredTeam.push({ role: "Front End Engineer", seniority: "Sênior", isActive: true });
            }

            const order: Record<string, number> = { "Junior": 1, "Pleno": 2, "Sênior": 3, "Especialista": 4 };
            filteredTeam.sort((a, b) => (order[b.seniority] || 0) - (order[a.seniority] || 0));

            setTeam(filteredTeam);
        }).catch(() => {
            // Hard fallback if fetch fails
            const hasMobile = mappedPlatforms.some(p => p.title.toLowerCase().includes("mobile"));
            const hasWeb = mappedPlatforms.some(p => p.title.toLowerCase().includes("web"));
            
            const fallbackTeam = [
                { role: "Product Owner", seniority: "Sênior", isActive: true },
                { role: "UX/UI Designer", seniority: "Pleno", isActive: true },
                { role: "Tech Lead", seniority: "Especialista", isActive: true },
                { role: "QA Engineer", seniority: "Pleno", isActive: true },
                { role: "Back End Engineer", seniority: "Sênior", isActive: true }
            ];
            if (hasMobile) fallbackTeam.push({ role: "Engenheiro Mobile", seniority: "Sênior", isActive: true });
            if (hasWeb) fallbackTeam.push({ role: "Front End Engineer", seniority: "Sênior", isActive: true });
            setTeam(fallbackTeam);
        });

        api<{ id: string; name: string; installments: number; discount: number; active: boolean }[]>("/api/payment-conditions").then(res => {
            if (res.success && res.data) {
                setPayments(res.data.filter(p => p.active));
            }
        });

        setIsLoading(false);
    };

    fetchScope();

    }, [router, id]);

    // Native Horizontal scrolling with wheel map (Translates Vertical scroll event to Horizontal scroll container)
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            if (mainScrollRef.current) {
                // Ignore if shift key is pressed (already horizontal) or if it's explicitly a horizontal wheel
                if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                    // Check if there is actual horizontal space to scroll
                    const target = mainScrollRef.current;
                    if (target.scrollWidth > target.clientWidth) {
                        e.preventDefault();
                        target.scrollBy({ left: e.deltaY * 1.5, behavior: 'auto' });
                    }
                }
            }
        };

        const target = mainScrollRef.current;
        if (target) {
            target.addEventListener("wheel", handleWheel, { passive: false });
            return () => target.removeEventListener("wheel", handleWheel);
        }
    }, [activeTab, platforms, team]);

    if (isLoading || !scope) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">
                <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                <h3 className="text-xl font-semibold">Carregando Proposta...</h3>
            </div>
        );
    }

    const baseHours = scope.users.reduce((acc, u) => acc + u.platforms.reduce((acc2, p) => acc2 + p.modules.reduce((acc3, m) => acc3 + m.screens.reduce((acc4, s) => acc4 + s.functionalities.reduce((acc5, f) => acc5 + (f.estimatedHours || 0), 0), 0), 0), 0), 0);
    const totalHours = baseHours + (scope.integrations?.reduce((acc, i) => acc + (i.estimatedHours || 0), 0) ?? 0);
    const timeline = totalHours > 0 ? `Aproximadamente ${Math.ceil(totalHours / 160)} meses` : "A definir";
    const totalValue = totalHours * 150;

    const FlatScreens = platforms.flatMap(p => p.modules.flatMap(m => m.screens)) || [];
    const activeScreenContext = FlatScreens[activeScreenIndex] || FlatScreens[0];
    const computedPlatformId = activeScreenContext?.platformId || platforms[0]?.id;

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
            clone.classList.remove('print-only');
            clone.style.cssText = [
                'width: 794px',
                'background: #ffffff',
                'padding: 0 57px',
                'box-sizing: border-box',
                'font-family: -apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif',
                '-webkit-font-smoothing: antialiased',
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

            const safeTitle = (scope.title || 'Proposta_Tecnica')
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

    // ANIMATIONS
    const fadeLeft = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
    };
    
    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    return (
      <>
        <div className="screen-only relative bg-slate-900 h-screen w-screen overflow-hidden flex flex-col text-white selection:bg-blue-500/30">
            {/* Platform-standard animated background */}
            <MatrixRain />
            
            {/* TOP HEADER */}
            <header className="relative z-50 shrink-0 flex items-center justify-between px-6 lg:px-12 py-6 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-2xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => router.push('/dashboard/crm/assembler/new/editor')} className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700/50 text-slate-400 hover:text-white" title="Voltar para Edição">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={12} className="text-[#2997ff]" />
                            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-[0.2em]">Padrão Ouro de Engenharia</span>
                        </div>
                        <h1 className="text-xl font-semibold tracking-tight text-white leading-none">Proposta Técnica 360º</h1>
                    </div>
                </div>

                {/* STICKY NAV TABS inside Header */}
                <div className="hidden lg:flex items-center bg-slate-800/60 rounded-full p-1 border border-slate-700/50 backdrop-blur-md">
                    {[
                        { id: 'overview', label: 'Visão Geral' },
                        ...(platforms.length > 0 ? [{ id: 'scope', label: 'Escopo' }] : []),
                        ...(team.length > 0 ? [{ id: 'team', label: 'Equipe Global' }] : []),
                        { id: 'investment', label: 'Investimento' },
                    ].map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as 'overview' | 'scope' | 'team' | 'investment')}
                            className={`px-5 py-1.5 rounded-full font-medium text-[13px] transition-all relative outline-none ${activeTab === tab.id ? 'text-black' : 'text-[#86868b] hover:text-white'}`}>
                            {activeTab === tab.id && <motion.div layoutId="active-tab" className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm" transition={{ type: "spring", stiffness: 450, damping: 30 }} />}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="hidden md:flex flex-col items-end">
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-[#86868b]">Proposta para</p>
                    <p className="text-sm font-medium tracking-tight text-[#f5f5f7]">
                        {client ? (client.companyRef?.name || client.company || client.name) : (scope.users[0]?.userName || "Cliente")}
                    </p>
                </div>
            </header>

            {/* MAIN CONTENT CANVAS (Strictly Horizontal / Fits 100vh) */}
            <main className="flex-1 w-full relative overflow-hidden flex z-10 p-4 md:p-8">
                <AnimatePresence mode="wait">
                    {/* OVERVIEW - Horizontal Slide Layout */}
                    {activeTab === 'overview' && (
                        <motion.div key="o" initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} variants={staggerContainer} 
                            ref={mainScrollRef}
                            className="w-full h-full flex flex-row gap-8 md:gap-12 px-2 overflow-x-auto overflow-y-hidden custom-scrollbar snap-x snap-mandatory pb-4 hide-native-scrollbar items-center">
                            
                            {/* ── CAPA FULL-SCREEN ───────────────────────────────── */}
                            <motion.div
                                variants={fadeLeft}
                                className="w-screen shrink-0 h-full flex flex-col items-center justify-center snap-center relative overflow-hidden px-6 md:px-16"
                            >
                                {/* Background decorative orbs */}
                                <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                                <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

                                {/* Grid lines overlay */}
                                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

                                <div className="relative z-10 flex flex-col items-center text-center max-w-4xl w-full gap-8">

                                    {/* Client avatar */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1, duration: 0.6 }}
                                        className="flex flex-col items-center gap-4"
                                    >
                                        <div className="relative">
                                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 backdrop-blur-sm flex items-center justify-center shadow-[0_0_40px_rgba(41,151,255,0.15)]">
                                                <span className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-[#2997ff] to-[#a020f0]">
                                                    {client
                                                        ? (client.companyRef?.name || client.company || client.name).charAt(0).toUpperCase()
                                                        : "P"
                                                    }
                                                </span>
                                            </div>
                                            {/* Glow ring */}
                                            <div className="absolute inset-0 rounded-3xl border border-[#2997ff]/20 scale-110 pointer-events-none" />
                                        </div>

                                        {/* Company & Contact */}
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#86868b]">Proposta Técnica Exclusiva</p>
                                            {client && (
                                                <>
                                                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                                                        {client.companyRef?.name || client.company || client.name}
                                                    </h2>
                                                    {client.name && (client.companyRef?.name || client.company) && (
                                                        <p className="text-[14px] text-[#86868b] font-light">Att. {client.name}</p>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Divider */}
                                    <motion.div
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        animate={{ scaleX: 1, opacity: 1 }}
                                        transition={{ delay: 0.3, duration: 0.7 }}
                                        className="w-[120px] h-px bg-gradient-to-r from-transparent via-[#2997ff]/60 to-transparent"
                                    />

                                    {/* Project Title */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4, duration: 0.6 }}
                                        className="flex flex-col items-center gap-4"
                                    >
                                        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[88px] leading-[1.02] font-semibold tracking-tighter text-white">
                                            {scope.title
                                                ? scope.title
                                                : (
                                                    <>
                                                        Proposta<br />
                                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2997ff] via-[#6e40c9] to-[#a020f0]">
                                                            Técnica 360º
                                                        </span>
                                                    </>
                                                )
                                            }
                                        </h1>

                                        {/* Summary */}
                                        {scope.projectSummary && (
                                            <p className="text-[15px] md:text-[17px] text-[#86868b] font-light leading-relaxed max-w-2xl">
                                                {scope.projectSummary.length > 240
                                                    ? scope.projectSummary.substring(0, 240) + "..."
                                                    : scope.projectSummary
                                                }
                                            </p>
                                        )}
                                    </motion.div>

                                    {/* Meta info row */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6, duration: 0.5 }}
                                        className="flex items-center gap-4 md:gap-8 flex-wrap justify-center"
                                    >
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

                    {/* SCOPE LÄMINAS (Slides) */}
                    {activeTab === 'scope' && platforms.length > 0 && (
                        <motion.div key="s" initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} variants={staggerContainer} 
                            className="w-full h-full flex flex-col overflow-hidden max-w-[1400px] mx-auto">
                            
                            {/* SCOPE SLIDER HORIZONTAL NAV */}
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
                                    <motion.div variants={fadeLeft} className="w-full h-full max-h-[800px] bg-slate-800/60 rounded-[40px] border border-slate-700/50 flex flex-col md:flex-row overflow-hidden relative shadow-2xl backdrop-blur-md">
                                        
                                        {/* LADO ESQUERDO DA LÄMINA: DESIGN DA TELA MOCK */}
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

                                        {/* LADO DIREITO: TEXTO E FEATURES (Scroll vertical em tudo) */}
                                        <div className="flex-[1.2] lg:flex-1 p-8 md:p-12 flex flex-col relative bg-slate-800/40 overflow-hidden">
                                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-4 mb-4 flex flex-col">
                                                <div className="flex items-center gap-3 mb-6 flex-wrap shrink-0">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${activeScreenContext.complexity === 'very_high' ? 'bg-[#ff3b30]/10 text-[#ff3b30]' : 'bg-[#2997ff]/10 text-[#2997ff]'}`}>
                                                        {activeScreenContext.complexity === 'very_high' ? 'Muito Alta' : activeScreenContext.complexity === 'high' ? 'Alta' : 'Média/Baixa'}
                                                    </span>
                                                    {activeScreenContext.estimatedHours > 0 && <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-900/80 border border-slate-700/50 text-slate-400">{activeScreenContext.estimatedHours} horas</span>}
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
                                                                <span className="text-[17px] text-[#f5f5f7] leading-tight font-medium tracking-tight transition-all hover:text-white">{feat.title}</span>
                                                                {feat.description && <span className="text-[15px] font-light text-[#86868b] leading-relaxed">{feat.description}</span>}
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
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

                    {/* TEAM - Horizontal Deck */}
                    {activeTab === 'team' && team.length > 0 && (
                        <motion.div key="t" initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} variants={staggerContainer} 
                            ref={mainScrollRef}
                            className="w-full h-full flex items-center px-4 md:px-12 overflow-x-auto overflow-y-hidden snap-x snap-mandatory hide-native-scrollbar gap-6 md:gap-8">
                            
                            <motion.div variants={fadeLeft} className="w-[300px] md:w-[400px] shrink-0 snap-center md:pl-10">
                                <h3 className="text-4xl md:text-[60px] leading-[1.05] font-semibold tracking-tighter text-white mb-4 md:mb-6">Times de <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2997ff] to-[#a020f0]">Alta Perfomance.</span></h3>
                                <p className="text-lg md:text-xl text-[#86868b] font-light max-w-[300px]">Engenheiros especialistas escalados para garantir a execução primorosa do seu projeto.</p>
                            </motion.div>
                            
                            {team.map((member, idx) => (
                                <motion.div variants={fadeLeft} key={idx} className="w-[280px] md:w-[350px] h-auto min-h-[320px] shrink-0 snap-center bg-slate-800/60 border border-slate-700/50 rounded-[32px] md:rounded-[40px] p-6 md:p-8 hover:border-slate-600/60 transition-all duration-300 flex flex-col relative overflow-hidden group backdrop-blur-md">
                                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-br from-[#2997ff]/20 to-[#a020f0]/10 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none rounded-full" />
                                    
                                    <div className="flex items-start justify-between mb-auto z-10 w-full">
                                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-900/80 border border-slate-700/50 flex items-center justify-center text-slate-200 shadow-xl group-hover:scale-110 transition-transform"><Users size={24} className="md:w-7 md:h-7" /></div>
                                    </div>
                                    <div className="z-10 w-full pb-2 pt-6">
                                        <h4 className="text-xl md:text-2xl font-semibold text-white mb-2 md:mb-4 tracking-tight">{member.role}</h4>
                                        <p className="text-[14px] md:text-[15px] font-light text-[#86868b] leading-relaxed">{getRoleDescription(member.role)}</p>
                                    </div>
                                </motion.div>
                            ))}
                            <div className="w-20 shrink-0" /> {/* Spacer */}
                        </motion.div>
                    )}

                    {/* INVESTMENT - Horizontal Focus */}
                    {activeTab === 'investment' && (
                        <motion.div key="i" initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }} variants={staggerContainer} 
                            ref={mainScrollRef}
                            className="w-full h-full flex flex-col lg:flex-row items-center justify-start md:justify-center gap-6 lg:gap-10 px-4 md:px-8 xl:px-12 py-12 lg:py-0 overflow-y-auto lg:overflow-y-hidden lg:overflow-x-auto hide-native-scrollbar">
                            
                            <motion.div variants={fadeLeft} className="w-full max-w-[550px] lg:max-w-none lg:flex-1 xl:max-w-[850px] shrink-0 bg-slate-800/60 border border-slate-700/50 rounded-[32px] md:rounded-[40px] lg:rounded-[50px] p-6 md:p-10 lg:p-12 relative shadow-2xl flex flex-col justify-center h-auto lg:min-h-[400px] lg:max-h-[calc(100vh-140px)] mx-auto lg:mx-0 backdrop-blur-md">
                                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,rgba(41,151,255,0.1),transparent_50%)] rounded-full blur-3xl pointer-events-none" />
                                
                                <div className="relative z-10 w-full lg:overflow-y-auto custom-scrollbar pr-0 lg:pr-2">
                                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                        <ShieldCheck size={28} className="text-[#2997ff] shrink-0" />
                                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-1 md:mb-2 leading-tight">Previsibilidade Total.</h3>
                                    </div>
                                    <p className="text-[#86868b] font-semibold text-[11px] md:text-[13px] uppercase tracking-widest mb-6 md:mb-8 border-l-2 border-[#424245] pl-3 md:pl-4">Orçamento Calculado via Algoritmo IA Ad-Hoc</p>
                                    
                                    <div className="flex items-start gap-2 md:gap-4 mb-6 md:mb-8 shrink-0">
                                        <span className="text-xl md:text-3xl text-[#86868b] font-medium mt-1 md:mt-2">R$</span>
                                        <span className="text-5xl md:text-6xl lg:text-7xl xl:text-[80px] leading-none font-semibold tracking-tighter text-white break-all">{totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 mb-4 md:mb-6 w-full">
                                        <div className="flex-1 p-5 lg:p-6 rounded-[20px] lg:rounded-[24px] bg-slate-900/80 border border-slate-700/50 shrink-0">
                                            <div className="text-slate-500 text-[10px] md:text-[12px] uppercase tracking-widest font-semibold mb-1 md:mb-2">Cronograma Estimado</div>
                                            <div className="text-white font-medium text-lg lg:text-xl">{timeline}</div>
                                        </div>
                                        <div className="flex-1 p-5 lg:p-6 rounded-[20px] lg:rounded-[24px] bg-slate-900/80 border border-slate-700/50 shrink-0">
                                            <div className="text-slate-500 text-[10px] md:text-[12px] uppercase tracking-widest font-semibold mb-1 md:mb-2">Volume do Escopo</div>
                                            <div className="text-white font-medium text-lg lg:text-xl">{totalHours} horas alocadas</div>
                                        </div>
                                    </div>
                                    <p className="text-[#86868b] text-xs md:text-sm font-light leading-relaxed mb-2 shrink-0">Os valores e cronogramas podem ser refinados junto ao seu arquiteto de software durante reuniões técnicas de alinhamento e calibração de prioridades.</p>
                                </div>
                            </motion.div>

                            <motion.div variants={fadeLeft} className="w-full max-w-[550px] lg:max-w-none lg:w-[350px] xl:w-[450px] shrink-0 flex flex-col gap-4 md:gap-6 h-auto lg:max-h-[calc(100vh-140px)] py-2 pb-16 lg:pb-2 mx-auto lg:mx-0">
                                <div className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-[32px] md:rounded-[40px] p-6 lg:p-8 flex flex-col lg:overflow-y-auto custom-scrollbar relative shadow-xl backdrop-blur-md">
                                    <h3 className="text-xl lg:text-2xl font-semibold text-white tracking-tight mb-4 lg:mb-6 shrink-0">Condições de Pgto</h3>
                                    {payments.length === 0 ? (
                                        <p className="text-[#86868b] text-[15px] font-light">Para este escopo de arquitetura avançada, o formato ideal deverá ser alinhado com o setor comercial diretamente em reunião executiva.</p>
                                    ) : (
                                        <div className="space-y-3 lg:space-y-4 flex-1">
                                            {payments.map(p => (
                                                <div key={p.id} className="p-4 lg:p-5 rounded-[20px] lg:rounded-[24px] bg-slate-900/70 border border-slate-700/50">
                                                    <h4 className="font-semibold text-white tracking-tight text-[15px] lg:text-[17px] mb-2">{p.name}</h4>
                                                    <div className="flex gap-2 flex-wrap">
                                                        {p.installments > 1 ? <span className="px-3 py-1 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#2997ff] bg-[#2997ff]/10">{p.installments}x</span> : p.installments === 0 ? <span className="px-3 py-1 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#a020f0] bg-[#a020f0]/10">Mensal</span> : null}
                                                        {p.discount > 0 && <span className="px-3 py-1 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-[#27c93f] bg-[#27c93f]/10">{p.discount}% à vista</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleDownloadPDF}
                                    disabled={isPdfLoading}
                                    className={`shrink-0 w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-[20px] lg:rounded-full font-semibold text-[15px] lg:text-lg transition-all shadow-[0_4px_30px_rgba(255,255,255,0.1)] group mt-auto ${
                                        isPdfLoading
                                            ? 'bg-[#d2d2d7] text-[#86868b] cursor-wait'
                                            : 'bg-[#f5f5f7] text-black hover:bg-white hover:scale-[1.02]'
                                    }`}
                                >
                                    {isPdfLoading
                                        ? <><Loader2 size={20} className="animate-spin" /> Gerando PDF...</>
                                        : <><Download size={20} className="group-hover:translate-y-1 transition-transform" /> Baixar via PDF</>
                                    }
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
            
            <style jsx global>{`
                /* Hide global vertical scroll bar strictly */
                html, body { 
                    overflow: hidden !important; 
                    height: 100vh;
                    width: 100vw;
                    margin: 0; padding: 0;
                }
                
                /* Hide horizontal scroll indicators completely for native feel */
                .hide-native-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-native-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }

                /* Aesthetic vertical scroll for inner specific dense text areas if needed */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #424245; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #86868b; }

                /* Prevent bounce overflow on macOS */
                body { overscroll-behavior-y: none; }

                /* ── Print utilities ── */
                .print-only { display: none; }

                @page {
                    size: A4 portrait;
                    margin: 18mm 15mm;
                }

                @media print {
                    html, body {
                        overflow: visible !important;
                        height: auto !important;
                        width: auto !important;
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .screen-only { display: none !important; }
                    .print-only  { display: block !important; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </div>

        {/* Print-only A4 layout — also used as source for html2pdf download */}
        <div className="print-only" id="pdf-proposal-content">
            <PrintLayout
                scope={scope}
                team={team}
                payments={payments}
                client={client}
                totalHours={totalHours}
                totalValue={totalValue}
                timeline={timeline}
            />
        </div>
      </>
    );
}
