"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft, Settings, Bell, Save, CheckCircle2, Mail, Smartphone,
    Monitor, Volume2, BellRing, BellOff, X, ChevronDown, ChevronUp,
    FileText, Users, Target, ClipboardList, Zap, Shield, Clock,
    Inbox, Loader2, BarChart3,
} from "lucide-react";

/* ═══ TYPES ═══ */
interface NotifEvent {
    id: string;
    label: string;
    description: string;
    email: boolean;
    push: boolean;
    inApp: boolean;
}

interface NotifCategory {
    id: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    bgColor: string;
    borderColor: string;
    events: NotifEvent[];
}

interface GlobalSettings {
    globalEnabled: boolean;
    quietHoursEnabled: boolean;
    quietStart: string;
    quietEnd: string;
    digestEnabled: boolean;
    digestFrequency: string;
}

interface PreferenceRecord {
    eventId: string;
    email: boolean;
    push: boolean;
    inApp: boolean;
}

/* ═══ DEFAULT CATEGORIES — serves as template & defaults ═══ */
const buildCategories = (): NotifCategory[] => [
    {
        id: "proposals", label: "Propostas Comerciais", description: "Geração, envio e acompanhamento de propostas",
        icon: FileText, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20",
        events: [
            { id: "prop_sent", label: "Proposta Enviada", description: "Quando uma proposta é enviada ao cliente via e-mail", email: false, push: false, inApp: true },
            { id: "prop_viewed", label: "Proposta Visualizada", description: "Quando o cliente abre e visualiza a proposta pelo link", email: false, push: true, inApp: true },
            { id: "prop_commented", label: "Novo Comentário", description: "Quando o cliente adiciona um comentário na proposta", email: true, push: true, inApp: true },
            { id: "prop_approved", label: "Proposta Aprovada", description: "Quando o cliente aprova a proposta comercial", email: true, push: true, inApp: true },
            { id: "prop_rejected", label: "Proposta Rejeitada", description: "Quando o cliente rejeita ou solicita alterações", email: true, push: true, inApp: true },
            { id: "prop_expiring", label: "Proposta Expirando", description: "Quando faltam 3 dias para a validade da proposta expirar", email: true, push: true, inApp: true },
            { id: "prop_expired", label: "Proposta Expirada", description: "Quando a proposta atinge a data de validade sem resposta", email: true, push: false, inApp: true },
            { id: "prop_version", label: "Nova Versão Criada", description: "Quando uma nova versão da proposta é gerada", email: false, push: false, inApp: true },
            { id: "prop_approval_req", label: "Aprovação do Gestor Solicitada", description: "Quando uma proposta entra na fila de aprovação interna (Manager Queue)", email: true, push: true, inApp: true },
            { id: "prop_approval_done", label: "Aprovação do Gestor Concluída", description: "Quando o gestor aprova ou rejeita a proposta internamente", email: true, push: true, inApp: true },
        ],
    },
    {
        id: "pipeline", label: "Pipeline & Oportunidades", description: "Movimentação de deals no Kanban e gestão de oportunidades",
        icon: Target, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20",
        events: [
            { id: "deal_created", label: "Nova Oportunidade Criada", description: "Quando um novo deal é adicionado ao pipeline", email: false, push: false, inApp: true },
            { id: "deal_stage_changed", label: "Mudança de Etapa no Pipeline", description: "Quando um deal é movido para outra etapa no Kanban", email: false, push: true, inApp: true },
            { id: "deal_won", label: "Negócio Ganho", description: "Quando uma oportunidade é movida para a etapa de ganho", email: true, push: true, inApp: true },
            { id: "deal_lost", label: "Negócio Perdido", description: "Quando uma oportunidade é marcada como perdida", email: true, push: true, inApp: true },
            { id: "deal_stale", label: "Oportunidade Estagnada", description: "Quando um deal não muda de etapa há mais de 7 dias", email: true, push: false, inApp: true },
        ],
    },
    {
        id: "crm", label: "Clientes & Contatos", description: "Cadastro e gestão de clientes, contatos e empresas",
        icon: Users, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20",
        events: [
            { id: "client_new", label: "Novo Cliente Cadastrado", description: "Quando um novo cliente é adicionado ao CRM", email: false, push: false, inApp: true },
            { id: "contact_new", label: "Novo Contato Adicionado", description: "Quando um contato é vinculado a um cliente/empresa", email: false, push: false, inApp: true },
            { id: "company_new", label: "Nova Empresa Cadastrada", description: "Quando uma nova empresa é registrada no sistema", email: false, push: false, inApp: true },
        ],
    },
    {
        id: "tasks", label: "Tarefas", description: "Gerenciamento de tarefas com calendário e vinculação a clientes",
        icon: ClipboardList, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20",
        events: [
            { id: "task_assigned", label: "Tarefa Atribuída", description: "Quando uma nova tarefa é atribuída a você", email: true, push: true, inApp: true },
            { id: "task_due_today", label: "Tarefa Vence Hoje", description: "Lembrete das tarefas com vencimento no dia atual", email: true, push: true, inApp: true },
            { id: "task_overdue", label: "Tarefa Atrasada", description: "Quando uma tarefa passa da data de vencimento sem ser concluída", email: true, push: true, inApp: true },
            { id: "task_completed", label: "Tarefa Concluída", description: "Quando uma tarefa vinculada a você é finalizada", email: false, push: false, inApp: true },
        ],
    },
    {
        id: "sdr", label: "SDR & Prospecção", description: "Cadências, inbox, qualificação e playbooks de prospecção",
        icon: Zap, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20",
        events: [
            { id: "sdr_cadence_reply", label: "Resposta na Cadência", description: "Quando um prospect responde a um e-mail da cadência de vendas", email: true, push: true, inApp: true },
            { id: "sdr_cadence_complete", label: "Cadência Finalizada", description: "Quando todas as etapas de uma cadência são concluídas para um lead", email: false, push: false, inApp: true },
            { id: "sdr_inbox_msg", label: "Nova Mensagem no Inbox", description: "Quando uma nova mensagem chega no inbox de prospecção", email: false, push: true, inApp: true },
            { id: "sdr_qualification_done", label: "Lead Qualificado", description: "Quando um lead completa o processo de qualificação", email: true, push: true, inApp: true },
            { id: "sdr_bounce", label: "E-mail com Bounce", description: "Quando um e-mail de prospecção retorna com erro de entrega", email: true, push: false, inApp: true },
            { id: "sdr_playbook_trigger", label: "Playbook Acionado", description: "Quando uma condição aciona uma ação automática de um playbook", email: false, push: false, inApp: true },
        ],
    },
    {
        id: "manager", label: "Gestão & Relatórios", description: "Fila de aprovação do gestor e relatórios gerenciais",
        icon: BarChart3, color: "text-pink-400", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20",
        events: [
            { id: "mgr_queue_new", label: "Nova Proposta na Fila", description: "Quando uma proposta entra na fila de aprovação do manager", email: true, push: true, inApp: true },
            { id: "mgr_report_ready", label: "Relatório Disponível", description: "Quando um novo relatório gerencial é gerado", email: true, push: false, inApp: true },
        ],
    },
    {
        id: "security", label: "Segurança & Sistema", description: "Login, senha, integrações e atualizações do sistema",
        icon: Shield, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20",
        events: [
            { id: "sec_new_login", label: "Login de Novo Dispositivo", description: "Quando sua conta é acessada de um dispositivo não reconhecido", email: true, push: true, inApp: true },
            { id: "sec_password_changed", label: "Senha Alterada", description: "Confirmação quando sua senha é alterada com sucesso", email: true, push: false, inApp: true },
            { id: "sec_failed_login", label: "Tentativa de Login Falha", description: "Quando há uma tentativa malsucedida de acesso à sua conta", email: true, push: true, inApp: true },
            { id: "integration_error", label: "Erro de Integração", description: "Quando uma integração externa (API, e-mail) falha ou perde conexão", email: true, push: true, inApp: true },
            { id: "sys_update", label: "Atualização do Sistema", description: "Novas funcionalidades, melhorias e correções disponíveis", email: true, push: false, inApp: false },
        ],
    },
];

/* ═══ TOGGLE ═══ */
const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button onClick={onChange} className={`w-9 h-5 rounded-full transition-colors relative ${enabled ? "bg-blue-600" : "bg-slate-700"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "left-[18px]" : "left-0.5"}`} />
    </button>
);

/* ═══ PAGE ═══ */
export default function NotificationSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [categories, setCategories] = useState(buildCategories);
    const [globalEnabled, setGlobalEnabled] = useState(true);
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
    const [quietStart, setQuietStart] = useState("22:00");
    const [quietEnd, setQuietEnd] = useState("07:00");
    const [digestEnabled, setDigestEnabled] = useState(true);
    const [digestFrequency, setDigestFrequency] = useState<"daily" | "weekly">("daily");
    const [expandedCats, setExpandedCats] = useState<string[]>(["proposals"]);
    const [testSent, setTestSent] = useState(false);

    // ═══ Load settings + preferences from API ═══
    useEffect(() => {
        (async () => {
            try {
                const [settingsRes, prefsRes] = await Promise.all([
                    api<GlobalSettings>("/api/notifications/settings", { method: "GET" }),
                    api<PreferenceRecord[]>("/api/notifications/preferences", { method: "GET" }),
                ]);

                if (settingsRes.success && settingsRes.data) {
                    const s = settingsRes.data;
                    setGlobalEnabled(s.globalEnabled);
                    setQuietHoursEnabled(s.quietHoursEnabled);
                    setQuietStart(s.quietStart);
                    setQuietEnd(s.quietEnd);
                    setDigestEnabled(s.digestEnabled);
                    setDigestFrequency(s.digestFrequency as "daily" | "weekly");
                }

                if (prefsRes.success && prefsRes.data && prefsRes.data.length > 0) {
                    const prefsMap = new Map(prefsRes.data.map(p => [p.eventId, p]));
                    setCategories(prev => prev.map(cat => ({
                        ...cat,
                        events: cat.events.map(ev => {
                            const saved = prefsMap.get(ev.id);
                            return saved ? { ...ev, email: saved.email, push: saved.push, inApp: saved.inApp } : ev;
                        }),
                    })));
                }
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, []);

    const allEvents = categories.flatMap(c => c.events);
    const emailActive = allEvents.filter(e => e.email).length;
    const pushActive = allEvents.filter(e => e.push).length;
    const inAppActive = allEvents.filter(e => e.inApp).length;

    const toggleExpand = (catId: string) => {
        setExpandedCats(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]);
    };

    const toggleEvent = (catId: string, eventId: string, channel: "email" | "push" | "inApp") => {
        setCategories(prev => prev.map(c => c.id === catId ? { ...c, events: c.events.map(e => e.id === eventId ? { ...e, [channel]: !e[channel] } : e) } : c));
    };

    const toggleCategoryChannel = (catId: string, channel: "email" | "push" | "inApp") => {
        setCategories(prev => prev.map(c => {
            if (c.id !== catId) return c;
            const allOn = c.events.every(e => e[channel]);
            return { ...c, events: c.events.map(e => ({ ...e, [channel]: !allOn })) };
        }));
    };

    const toggleAllChannel = (channel: "email" | "push" | "inApp") => {
        const allOn = allEvents.every(e => e[channel]);
        setCategories(prev => prev.map(c => ({ ...c, events: c.events.map(e => ({ ...e, [channel]: !allOn })) })));
    };

    const toggleGlobal = () => {
        const newState = !globalEnabled;
        setGlobalEnabled(newState);
        if (!newState) {
            setCategories(prev => prev.map(c => ({ ...c, events: c.events.map(e => ({ ...e, email: false, push: false, inApp: false })) })));
        } else {
            setCategories(buildCategories());
        }
    };

    // ═══ Save all to API ═══
    const handleSave = async () => {
        setSaving(true);
        try {
            const allPrefs = categories.flatMap(c => c.events.map(e => ({ eventId: e.id, email: e.email, push: e.push, inApp: e.inApp })));

            await Promise.all([
                api("/api/notifications/settings", {
                    method: "PUT",
                    body: { globalEnabled, quietHoursEnabled, quietStart, quietEnd, digestEnabled, digestFrequency },
                }),
                api("/api/notifications/preferences", {
                    method: "PUT",
                    body: { preferences: allPrefs },
                }),
            ]);

            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const sendTest = () => { setTestSent(true); setTimeout(() => setTestSent(false), 2500); };
    const expandAll = () => setExpandedCats(categories.map(c => c.id));
    const collapseAll = () => setExpandedCats([]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 size={32} className="animate-spin text-slate-500" /></div>;
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/dashboard/settings" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm">
                        <ChevronLeft size={16} /><Settings size={14} /><span>Configurações</span>
                    </Link>
                    <span className="text-slate-700">/</span>
                    <span className="text-slate-300 text-sm font-medium">Notificações</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Bell size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Notificações</h1>
                            <p className="text-sm text-slate-400">{allEvents.length} eventos em {categories.length} categorias</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={sendTest} className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl border transition-all ${testSent ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 'text-slate-400 border-white/[0.08] hover:text-white hover:bg-white/5'}`}>
                            {testSent ? <><CheckCircle2 size={14} /> Enviado!</> : <><BellRing size={14} /> Testar</>}
                        </button>
                        <button onClick={handleSave} disabled={saving} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-60 ${saved ? 'bg-blue-500 shadow-blue-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'} text-white`}>
                            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <><CheckCircle2 size={16} /> Salvo!</> : <><Save size={16} /> Salvar</>}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Eventos", value: allEvents.length, icon: Bell, color: "text-blue-400" },
                    { label: "E-mail Ativos", value: emailActive, icon: Mail, color: "text-blue-400" },
                    { label: "Push Ativos", value: pushActive, icon: Smartphone, color: "text-purple-400" },
                    { label: "In-App Ativos", value: inAppActive, icon: Monitor, color: "text-cyan-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-xl font-bold text-white block">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            <div className="space-y-6">
                {/* Global Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {globalEnabled ? <BellRing size={16} className="text-blue-400" /> : <BellOff size={16} className="text-slate-500" />}
                                <h3 className="text-sm font-bold text-white">Notificações Globais</h3>
                            </div>
                            <Toggle enabled={globalEnabled} onChange={toggleGlobal} />
                        </div>
                        <p className="text-[11px] text-slate-500">{globalEnabled ? "Todas as notificações ativas" : "Tudo desativado"}</p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Volume2 size={16} className="text-amber-400" />
                                <h3 className="text-sm font-bold text-white">Horário de Silêncio</h3>
                            </div>
                            <Toggle enabled={quietHoursEnabled} onChange={() => setQuietHoursEnabled(!quietHoursEnabled)} />
                        </div>
                        {quietHoursEnabled ? (
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-slate-500">Das</span>
                                <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)} className="px-2 py-1 bg-slate-800/60 border border-white/[0.08] rounded-lg text-[11px] text-white focus:outline-none w-20" />
                                <span className="text-[11px] text-slate-500">às</span>
                                <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)} className="px-2 py-1 bg-slate-800/60 border border-white/[0.08] rounded-lg text-[11px] text-white focus:outline-none w-20" />
                            </div>
                        ) : (
                            <p className="text-[11px] text-slate-500">Sem restrição de horário</p>
                        )}
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Inbox size={16} className="text-violet-400" />
                                <h3 className="text-sm font-bold text-white">Resumo por E-mail</h3>
                            </div>
                            <Toggle enabled={digestEnabled} onChange={() => setDigestEnabled(!digestEnabled)} />
                        </div>
                        {digestEnabled ? (
                            <div className="flex gap-2 mt-1">
                                <button onClick={() => setDigestFrequency("daily")} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${digestFrequency === "daily" ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-slate-500 border border-white/[0.06] hover:text-white'}`}>Diário</button>
                                <button onClick={() => setDigestFrequency("weekly")} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${digestFrequency === "weekly" ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'text-slate-500 border border-white/[0.06] hover:text-white'}`}>Semanal</button>
                            </div>
                        ) : (
                            <p className="text-[11px] text-slate-500">Sem resumo consolidado</p>
                        )}
                    </motion.div>
                </div>

                {/* Channel master toggles */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex items-center justify-between px-4 py-3 bg-slate-800/30 border border-white/[0.04] rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tudo por canal:</span>
                        <div className="flex gap-2">
                            <button onClick={() => toggleAllChannel("email")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all text-blue-400 bg-blue-500/5 border-blue-500/15 hover:bg-blue-500/10"><Mail size={10} /> E-mail</button>
                            <button onClick={() => toggleAllChannel("push")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all text-purple-400 bg-purple-500/5 border-purple-500/15 hover:bg-purple-500/10"><Smartphone size={10} /> Push</button>
                            <button onClick={() => toggleAllChannel("inApp")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all text-cyan-400 bg-cyan-500/5 border-cyan-500/15 hover:bg-cyan-500/10"><Monitor size={10} /> In-App</button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={expandAll} className="text-[10px] text-slate-500 hover:text-white transition-colors">Expandir tudo</button>
                        <span className="text-slate-700">·</span>
                        <button onClick={collapseAll} className="text-[10px] text-slate-500 hover:text-white transition-colors">Recolher</button>
                    </div>
                </motion.div>

                {/* ═══ CATEGORIZED NOTIFICATION MATRIX ═══ */}
                <div className="space-y-3">
                    {categories.map((cat, ci) => {
                        const isExpanded = expandedCats.includes(cat.id);
                        const catEmailAll = cat.events.every(e => e.email);
                        const catPushAll = cat.events.every(e => e.push);
                        const catInAppAll = cat.events.every(e => e.inApp);
                        const activeInCat = cat.events.filter(e => e.email || e.push || e.inApp).length;

                        return (
                            <motion.div key={cat.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * ci }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.01] transition-colors" onClick={() => toggleExpand(cat.id)}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg border ${cat.bgColor} ${cat.borderColor}`}>
                                            <cat.icon size={16} className={cat.color} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">{cat.label}</h3>
                                            <p className="text-[10px] text-slate-500">{cat.description} · {activeInCat}/{cat.events.length} ativos</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex gap-6 mr-2" onClick={e => e.stopPropagation()}>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[8px] text-slate-600 uppercase tracking-wider">E-mail</span>
                                                <button onClick={() => toggleCategoryChannel(cat.id, "email")} className={`w-3 h-3 rounded-full border-2 transition-all ${catEmailAll ? 'bg-blue-400 border-blue-400' : 'border-slate-600 hover:border-blue-400'}`} />
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[8px] text-slate-600 uppercase tracking-wider">Push</span>
                                                <button onClick={() => toggleCategoryChannel(cat.id, "push")} className={`w-3 h-3 rounded-full border-2 transition-all ${catPushAll ? 'bg-purple-400 border-purple-400' : 'border-slate-600 hover:border-purple-400'}`} />
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="text-[8px] text-slate-600 uppercase tracking-wider">App</span>
                                                <button onClick={() => toggleCategoryChannel(cat.id, "inApp")} className={`w-3 h-3 rounded-full border-2 transition-all ${catInAppAll ? 'bg-cyan-400 border-cyan-400' : 'border-slate-600 hover:border-cyan-400'}`} />
                                            </div>
                                        </div>
                                        {isExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                            <div className="border-t border-white/[0.04]">
                                                <div className="flex items-center justify-between px-5 py-2 bg-slate-800/30">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Evento</span>
                                                    <div className="flex gap-8">
                                                        <span className="w-12 text-center text-[9px] font-bold uppercase tracking-widest text-blue-400/60">E-mail</span>
                                                        <span className="w-12 text-center text-[9px] font-bold uppercase tracking-widest text-purple-400/60">Push</span>
                                                        <span className="w-12 text-center text-[9px] font-bold uppercase tracking-widest text-cyan-400/60">App</span>
                                                    </div>
                                                </div>
                                                <div className="divide-y divide-white/[0.03]">
                                                    {cat.events.map(event => (
                                                        <div key={event.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.015] transition-all">
                                                            <div className="flex-1 min-w-0 pr-4">
                                                                <h4 className="text-[13px] font-medium text-white">{event.label}</h4>
                                                                <p className="text-[11px] text-slate-500 leading-tight">{event.description}</p>
                                                            </div>
                                                            <div className="flex gap-8 shrink-0">
                                                                {(["email", "push", "inApp"] as const).map(ch => (
                                                                    <div key={ch} className="w-12 flex justify-center">
                                                                        <Toggle enabled={event[ch]} onChange={() => toggleEvent(cat.id, event.id, ch)} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
