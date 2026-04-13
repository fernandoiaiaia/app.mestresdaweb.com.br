"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft, FolderKanban, Clock, Users, Target, CheckCircle2, AlertTriangle,
    Zap, Package, FileText, Bug, Brain, BarChart3, ListTodo, ExternalLink,
    Plus, X, UserPlus, Trash2, Mail, Phone, FileSignature, Pencil, Check,
    Calendar, Timer, Activity, Layers, Flame, ArrowRight, Code2,
} from "lucide-react";
import { api } from "@/lib/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type ProjectPhase = "requirements" | "discovery" | "development" | "testing" | "documentation" | "delivery";
const PHASE_LABELS: Record<string, string> = { requirements: "Requisitos", discovery: "Discovery", development: "Desenvolvimento", testing: "Testes", documentation: "Documentação", delivery: "Entrega" };
const PHASE_ORDER: ProjectPhase[] = ["requirements", "discovery", "development", "testing", "documentation", "delivery"];
const CHART_STYLE = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#fff", fontSize: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" };

function getHealthColor(h: string) { return h === "on_track" ? "text-blue-400" : h === "at_risk" ? "text-amber-400" : "text-red-400"; }
function getHealthBg(h: string) { return h === "on_track" ? "bg-blue-500/10 border-blue-500/20" : h === "at_risk" ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"; }
function getHealthLabel(h: string) { return h === "on_track" ? "No Prazo" : h === "at_risk" ? "Em Risco" : "Atrasado"; }
function getStatusLabel(s: string) { return s === "todo" ? "A Fazer" : s === "in_progress" ? "Em Andamento" : s === "review" ? "Em Revisão" : "Concluído"; }

interface SystemUser { id: string; name: string; role: string; avatar?: string | null; position?: string | null; }
interface MemberRecord { id: string; role: string; user: SystemUser; }
interface ClientContact { id: string; name: string; email: string | null; phone: string | null; }
type SignatorySource = "team" | "client";
interface Signatory { id: string; name: string; source: SignatorySource; sourceId: string; role: string; }

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "team" | "contacts" | "signatories">("overview");

    // Real users list from API
    const [allUsers, setAllUsers] = useState<SystemUser[]>([]);

    // Team (persisted)
    const [teamMembers, setTeamMembers] = useState<MemberRecord[]>([]);
    const [showAddMember, setShowAddMember] = useState(false);
    const availableUsers = allUsers.filter(u => !teamMembers.find(m => m.user.id === u.id));
    const teamUsers = teamMembers;

    // Contacts (persisted)
    const [clientContacts, setClientContacts] = useState<ClientContact[]>([]);
    const [showAddContact, setShowAddContact] = useState(false);
    const [newContact, setNewContact] = useState({ name: "", email: "", phone: "" });

    // Signatories (persisted)
    const [contratada, setContratada] = useState<Signatory | null>(null);
    const [contratantes, setContratantes] = useState<Signatory[]>([]);
    const [testemunhas, setTestemunhas] = useState<Signatory[]>([]);
    const [showSignPicker, setShowSignPicker] = useState<"contratada" | "contratante" | "testemunha" | null>(null);
    const gestorUsers = allUsers.filter(u => u.role === "OWNER" || u.role === "ADMIN");
    const getAvailableContratada = () => gestorUsers.filter(u => contratada?.sourceId !== u.id);
    const getAvailableContratantes = () => clientContacts.filter(c => !contratantes.find(ct => ct.sourceId === c.id));
    const getAvailableTestemunhas = () => {
        const used = new Set(testemunhas.map(t => `${t.source}-${t.sourceId}`));
        if (contratada) used.add(`team-${contratada.sourceId}`);
        const people: { id: string; name: string; source: SignatorySource; label: string }[] = [];
        gestorUsers.forEach(u => {
            if (!used.has(`team-${u.id}`)) people.push({ id: u.id, name: u.name, source: "team", label: `${u.name} (Contratada)` });
        });
        clientContacts.forEach(c => {
            if (!used.has(`client-${c.id}`)) people.push({ id: c.id, name: c.name, source: "client", label: `${c.name} (Cliente)` });
        });
        return people;
    };

    // Fetch project + users
    const fetchProject = useCallback(async () => {
        setLoading(true);
        const [projRes, usersRes] = await Promise.all([
            api<any>(`/api/dev-projects/${id}`),
            api<SystemUser[]>("/api/users"),
        ]);
        if (projRes.success && projRes.data) {
            const p = projRes.data;
            setProject(p);
            setTeamMembers(p.members || []);
            setClientContacts(p.contacts || []);
            // hydrate signatories
            const sigs: Signatory[] = p.signatories || [];
            setContratada(sigs.find((s: any) => s.role === "contratada") || null);
            setContratantes(sigs.filter((s: any) => s.role === "contratante"));
            setTestemunhas(sigs.filter((s: any) => s.role === "testemunha_1" || s.role === "testemunha_2"));
        }
        if (usersRes.success && usersRes.data) setAllUsers(usersRes.data);
        setLoading(false);
    }, [id]);
    useEffect(() => { fetchProject(); }, [fetchProject]);

    // ── API Mutations ──
    const handleAddMember = async (userId: string) => {
        const res = await api<MemberRecord>(`/api/dev-projects/${id}/members`, { method: "POST", body: { userId } });
        if (res.success && res.data) setTeamMembers(prev => [...prev, res.data!]);
        setShowAddMember(false);
    };
    const handleRemoveMember = async (memberId: string) => {
        await api(`/api/dev-projects/${id}/members/${memberId}`, { method: "DELETE" });
        setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    };
    const handleAddContact = async () => {
        if (!newContact.name || !newContact.email) return;
        const res = await api<ClientContact>(`/api/dev-projects/${id}/contacts`, { method: "POST", body: newContact });
        if (res.success && res.data) setClientContacts(prev => [...prev, res.data!]);
        setNewContact({ name: "", email: "", phone: "" }); setShowAddContact(false);
    };
    const handleRemoveContact = async (contactId: string) => {
        await api(`/api/dev-projects/${id}/contacts/${contactId}`, { method: "DELETE" });
        setClientContacts(prev => prev.filter(c => c.id !== contactId));
    };
    const saveSignatories = async (newContratada: Signatory | null, newContratantes: Signatory[], newTestemunhas: Signatory[]) => {
        const arr: { role: string; source: string; sourceId: string; name: string }[] = [];
        if (newContratada) arr.push({ role: "contratada", source: newContratada.source, sourceId: newContratada.sourceId, name: newContratada.name });
        newContratantes.forEach(c => arr.push({ role: "contratante", source: c.source, sourceId: c.sourceId, name: c.name }));
        newTestemunhas.forEach((t, i) => arr.push({ role: i === 0 ? "testemunha_1" : "testemunha_2", source: t.source, sourceId: t.sourceId, name: t.name }));
        await api(`/api/dev-projects/${id}/signatories`, { method: "PUT", body: { signatories: arr } });
    };

    // Computed
    const tasks = project?.tasks || [];
    const tasksTotal = tasks.length;
    const tasksByStatus = useMemo(() => {
        const m: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 };
        tasks.forEach((t: any) => { m[t.status] = (m[t.status] || 0) + 1; });
        return m;
    }, [tasks]);
    const tasksByPriority = useMemo(() => {
        const m: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
        tasks.forEach((t: any) => { m[t.priority] = (m[t.priority] || 0) + 1; });
        return m;
    }, [tasks]);
    const epicBreakdown = useMemo(() => {
        const m: Record<string, { total: number; done: number; hours: number }> = {};
        tasks.forEach((t: any) => {
            const e = t.epic || "Sem Épico";
            if (!m[e]) m[e] = { total: 0, done: 0, hours: 0 };
            m[e].total++;
            if (t.status === "done") m[e].done++;
            m[e].hours += t.estimatedHours || 0;
        });
        return Object.entries(m).sort((a, b) => b[1].total - a[1].total);
    }, [tasks]);
    const epicBarData = useMemo(() => epicBreakdown.map(([name, d]) => ({
        name: name.length > 25 ? name.substring(0, 25) + "…" : name,
        total: d.total, done: d.done,
    })), [epicBreakdown]);

    const hoursEstimated = project?.hoursEstimated || 0;
    const hoursUsed = project?.hoursUsed || 0;
    const hoursPercent = hoursEstimated > 0 ? Math.round((hoursUsed / hoursEstimated) * 100) : 0;
    const tasksDone = tasksByStatus.done;
    const currentPhaseIndex = project ? PHASE_ORDER.indexOf(project.phase) : 0;
    const daysRemaining = project?.deadline ? Math.ceil((new Date(project.deadline).getTime() - Date.now()) / 86400000) : null;

    const statusPieData = [
        { name: "Concluídas", value: tasksByStatus.done, fill: "#22c55e" },
        { name: "Em Andamento", value: tasksByStatus.in_progress, fill: "#3b82f6" },
        { name: "Revisão", value: tasksByStatus.review, fill: "#f59e0b" },
        { name: "A Fazer", value: tasksByStatus.todo, fill: "#64748b" },
    ];
    const priorityPieData = [
        { name: "Crítica", value: tasksByPriority.critical, fill: "#ef4444" },
        { name: "Alta", value: tasksByPriority.high, fill: "#f59e0b" },
        { name: "Média", value: tasksByPriority.medium, fill: "#3b82f6" },
        { name: "Baixa", value: tasksByPriority.low, fill: "#64748b" },
    ];

    if (loading) return (
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[500px]">
            <div className="text-center">
                <div className="w-10 h-10 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-500">Carregando projeto...</p>
            </div>
        </div>
    );

    if (!project) return (
        <div className="p-6 md:p-8 text-center py-20">
            <FolderKanban size={48} className="mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 font-medium">Projeto não encontrado</p>
            <Link href="/dashboard/projects" className="text-blue-400 text-sm mt-2 inline-block hover:underline">← Voltar</Link>
        </div>
    );

    const tabs = [
        { key: "overview" as const, label: "Visão Geral", icon: BarChart3 },
        { key: "tasks" as const, label: `Tarefas (${tasksTotal})`, icon: ListTodo },
        { key: "team" as const, label: `Equipe (${teamUsers.length})`, icon: Users },
        { key: "contacts" as const, label: `Contatos (${clientContacts.length})`, icon: Mail },
        { key: "signatories" as const, label: "Assinantes", icon: FileSignature },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-[1500px] mx-auto">
            {/* Breadcrumb */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link href="/dashboard/projects" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors">
                    <ArrowLeft size={14} /> Voltar aos Projetos
                </Link>
            </motion.div>

            {/* ═══════ HERO BANNER ═══════ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.06]">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/90 via-slate-900 to-blue-900/20" />
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/8 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-20 left-20 w-60 h-60 bg-gradient-to-tr from-emerald-500/6 to-transparent rounded-full blur-3xl" />

                <div className="relative p-7">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border ${getHealthBg(project.health)} ${getHealthColor(project.health)}`}>
                                    {project.health === "on_track" ? <CheckCircle2 size={12} /> : project.health === "at_risk" ? <AlertTriangle size={12} /> : <Zap size={12} />}
                                    {getHealthLabel(project.health)}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-700/40 text-slate-300 border border-slate-700/50">
                                    {PHASE_LABELS[project.phase] || project.phase}
                                </span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-2">{project.name}</h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                                <span className="flex items-center gap-1.5"><Users size={14} /> {project.client}</span>
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> {project.deadline ? new Date(project.deadline).toLocaleDateString("pt-BR") : "—"}</span>
                                {daysRemaining !== null && (
                                    <span className={`flex items-center gap-1.5 font-bold ${daysRemaining <= 0 ? "text-red-400" : daysRemaining <= 7 ? "text-amber-400" : "text-blue-400"}`}>
                                        <Timer size={14} /> {daysRemaining > 0 ? `${daysRemaining} dias restantes` : daysRemaining === 0 ? "Último dia!" : `${Math.abs(daysRemaining)}d atrasado`}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Link href={`/dashboard/backlog/${id}`}
                            className="group shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all">
                            <FolderKanban size={20} />
                            <div><p className="text-base font-bold">Ver no Backlog</p><p className="text-blue-100/70 text-xs font-normal">Kanban & Tarefas</p></div>
                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Progress */}
                    <div className="mt-6 pt-5 border-t border-white/[0.06]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Progresso Geral</span>
                            <span className="text-lg font-bold text-blue-400">{project.progress}%</span>
                        </div>
                        <div className="h-3 bg-slate-700/40 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }} transition={{ duration: 1.2 }}
                                className="h-full bg-gradient-to-r from-blue-600 via-emerald-500 to-blue-400 rounded-full shadow-lg shadow-blue-500/30" />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                            <span>{tasksDone}/{tasksTotal} tarefas concluídas</span>
                            <span>{hoursUsed}h registradas</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══════ KPI CARDS ═══════ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { label: "Tarefas", value: tasksTotal, icon: ListTodo, color: "text-blue-400", bg: "from-blue-600/15 to-blue-900/5", border: "border-blue-500/15" },
                    { label: "Concluídas", value: tasksDone, icon: CheckCircle2, color: "text-blue-400", bg: "from-blue-600/15 to-blue-900/5", border: "border-blue-500/15" },
                    { label: "Em Andamento", value: tasksByStatus.in_progress, icon: Activity, color: "text-cyan-400", bg: "from-cyan-600/15 to-cyan-900/5", border: "border-cyan-500/15" },
                    { label: "Urgentes", value: tasksByPriority.critical + tasksByPriority.high, icon: Flame, color: "text-red-400", bg: "from-red-600/15 to-red-900/5", border: "border-red-500/15" },
                    { label: "Horas", value: `${hoursPercent}%`, icon: Clock, color: hoursPercent > 90 ? "text-red-400" : "text-blue-400", bg: hoursPercent > 90 ? "from-red-600/15 to-red-900/5" : "from-blue-600/15 to-blue-900/5", border: hoursPercent > 90 ? "border-red-500/15" : "border-blue-500/15" },
                    { label: "Épicos", value: epicBreakdown.length, icon: Layers, color: "text-purple-400", bg: "from-purple-600/15 to-purple-900/5", border: "border-purple-500/15" },
                ].map((c, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.04 }}
                        className={`p-4 rounded-xl bg-gradient-to-b ${c.bg} border ${c.border}`}>
                        <c.icon size={16} className={`${c.color} opacity-70 mb-2`} />
                        <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-slate-500 mt-1">{c.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* ═══════ CHARTS ROW ═══════ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Status Donut */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
                        <Activity size={14} className="text-blue-400" /> Por Status
                    </h3>
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart><Pie data={statusPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                {statusPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                            </Pie><Tooltip contentStyle={CHART_STYLE} /></PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {statusPieData.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                                <span className="text-slate-400">{s.name}</span>
                                <span className="text-white font-bold ml-auto">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Priority Donut */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
                        <Flame size={14} className="text-amber-400" /> Por Prioridade
                    </h3>
                    <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart><Pie data={priorityPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                                {priorityPieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                            </Pie><Tooltip contentStyle={CHART_STYLE} /></PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                        {priorityPieData.map((s, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px]">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.fill }} />
                                <span className="text-slate-400">{s.name}</span>
                                <span className="text-white font-bold ml-auto">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Épicos Bar Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-3 flex items-center gap-2">
                        <Layers size={14} className="text-purple-400" /> Por Épico
                    </h3>
                    <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                        {epicBreakdown.length > 0 ? epicBreakdown.map(([epic, data], i) => {
                            const pct = data.total > 0 ? Math.round((data.done / data.total) * 100) : 0;
                            return (
                                <div key={epic} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="text-slate-300 font-medium truncate max-w-[160px]">{epic}</span>
                                        <span className="text-white font-bold">{data.done}/{data.total} <span className="text-slate-500 font-normal">({pct}%)</span></span>
                                    </div>
                                    <div className="h-2 bg-slate-700/40 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                                            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-violet-400" />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center py-8 text-slate-500"><Code2 size={24} className="mx-auto mb-2 opacity-30" /><p className="text-xs">Nenhum épico</p></div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* ═══════ PHASE TIMELINE ═══════ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
                    <Target size={14} className="text-blue-400" /> Fases do Projeto
                </h3>
                <div className="flex items-center gap-0 overflow-x-auto pb-2">
                    {PHASE_ORDER.map((phase, i) => {
                        const isCurrent = i === currentPhaseIndex;
                        const isCompleted = i < currentPhaseIndex;
                        return (
                            <div key={phase} className="flex items-center shrink-0">
                                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    isCurrent ? "bg-blue-600/20 text-blue-400 border-2 border-blue-500/40 shadow-lg shadow-blue-500/10"
                                    : isCompleted ? "bg-blue-500/10 text-blue-400/80" : "bg-slate-800/40 text-slate-500 border border-slate-700/30"
                                }`}>
                                    {isCompleted && <CheckCircle2 size={13} />}
                                    {isCurrent && <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
                                    {PHASE_LABELS[phase]}
                                </div>
                                {i < PHASE_ORDER.length - 1 && <div className={`w-8 h-0.5 mx-1 rounded-full ${isCompleted ? "bg-blue-500/50" : "bg-slate-700/50"}`} />}
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ═══════ TABS ═══════ */}
            <div className="flex gap-1 border-b border-white/[0.06] -mb-2">
                {tabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
                            activeTab === tab.key ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"
                        }`}>
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ TAB: OVERVIEW ═══════ */}
            {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Manager + Info */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/40 border border-white/[0.06] p-5">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
                            <Users size={14} className="text-blue-400" /> Gestor & Informações
                        </h3>
                        <div className="flex items-center gap-4 mb-5 p-4 rounded-xl bg-slate-800/50 border border-slate-700/30">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-600/20">
                                {project.createdBy?.name?.charAt(0) || "G"}
                            </div>
                            <div>
                                <p className="text-base font-bold text-white">{project.createdBy?.name || "—"}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Gestor do Projeto</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: "Criado em", value: new Date(project.createdAt).toLocaleDateString("pt-BR") },
                                { label: "Início", value: project.startDate ? new Date(project.startDate).toLocaleDateString("pt-BR") : "—" },
                                { label: "Prazo", value: project.deadline ? new Date(project.deadline).toLocaleDateString("pt-BR") : "—" },
                                { label: "Horas Usadas", value: `${hoursUsed}h` },
                                ...(project.proposal ? [{ label: "Proposta Origem", value: project.proposal.clientName }] : []),
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">{item.label}</span>
                                    <span className="text-white font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Quick Links */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                        className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 mb-4 flex items-center gap-2">
                            <ExternalLink size={14} className="text-blue-400" /> Atalhos Rápidos
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: "Backlog", desc: "Kanban & Tarefas", href: `/dashboard/backlog/${id}`, icon: ListTodo, gradient: "from-blue-600 to-cyan-500", glow: "shadow-blue-500/20", border: "hover:border-blue-500/30" },
                                { label: "Entregas", desc: "Sprints & Releases", href: "/dashboard/deliveries", icon: Package, gradient: "from-purple-600 to-violet-500", glow: "shadow-purple-500/20", border: "hover:border-purple-500/30" },
                                { label: "Documentos", desc: "Contratos & Arquivos", href: `/dashboard/documents/${id}`, icon: FileText, gradient: "from-amber-500 to-orange-500", glow: "shadow-amber-500/20", border: "hover:border-amber-500/30" },
                            ].map((link, i) => (
                                <Link key={i} href={link.href} className={`flex items-center gap-3 p-4 rounded-xl bg-slate-900/50 border border-slate-700/30 ${link.border} hover:bg-slate-800/50 hover:scale-[1.02] transition-all group`}>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.gradient} flex items-center justify-center shadow-lg ${link.glow} shrink-0`}>
                                        <link.icon size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-white font-semibold group-hover:text-white/90">{link.label}</p>
                                        <p className="text-[10px] text-slate-500">{link.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>


                    </motion.div>
                </div>
            )}

            {/* ═══════ TAB: TASKS ═══════ */}
            {activeTab === "tasks" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-slate-800/40 border border-white/[0.06] overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2"><ListTodo size={14} className="text-blue-400" /> Todas as Tarefas</h3>
                        <Link href={`/dashboard/backlog/${id}`} className="text-[10px] font-bold text-blue-400 hover:underline flex items-center gap-1 uppercase tracking-widest">Ver no Backlog <ArrowRight size={10} /></Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-slate-700/30">
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tarefa</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Épico</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prioridade</th>
                                <th className="text-left px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Responsável</th>
                            </tr></thead>
                            <tbody>
                                {tasks.map((t: any) => (
                                    <tr key={t.id} className="border-b border-slate-700/20 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${t.status === "done" ? "bg-green-500" : t.status === "in_progress" ? "bg-blue-500" : t.status === "review" ? "bg-amber-500" : "bg-slate-500"}`} />
                                                <span className={`font-medium ${t.status === "done" ? "text-slate-500 line-through" : "text-white"}`}>{t.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-slate-400 text-xs truncate max-w-[150px]">{t.epic || "—"}</td>
                                        <td className="px-5 py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${t.status === "done" ? "bg-blue-500/10 text-blue-400" : t.status === "in_progress" ? "bg-blue-500/10 text-blue-400" : t.status === "review" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"}`}>{getStatusLabel(t.status)}</span></td>
                                        <td className="px-5 py-3"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${t.priority === "critical" ? "bg-red-500/10 text-red-400" : t.priority === "high" ? "bg-amber-500/10 text-amber-400" : t.priority === "medium" ? "bg-blue-500/10 text-blue-400" : "bg-slate-500/10 text-slate-400"}`}>{t.priority === "critical" ? "Crítica" : t.priority === "high" ? "Alta" : t.priority === "medium" ? "Média" : "Baixa"}</span></td>

                                        <td className="px-5 py-3">{t.assignee ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[8px] font-bold">{t.assignee.name.charAt(0)}</div>
                                                <span className="text-xs text-slate-400">{t.assignee.name}</span>
                                            </div>
                                        ) : <span className="text-xs text-slate-600">—</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {tasks.length === 0 && <div className="text-center py-12 text-slate-500"><ListTodo size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Nenhuma tarefa</p></div>}
                    </div>
                </motion.div>
            )}

            {/* ═══════ TAB: TEAM ═══════ */}
            {activeTab === "team" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2"><Users size={14} className="text-blue-400" /> Equipe do Projeto</h3>
                        <div className="relative">
                            <button onClick={() => setShowAddMember(!showAddMember)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition-colors"><UserPlus size={12} /> Adicionar</button>
                            <AnimatePresence>
                                {showAddMember && availableUsers.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl z-20 overflow-hidden">
                                        <div className="max-h-48 overflow-y-auto p-1.5">
                                            {availableUsers.map(u => (
                                                <button key={u.id} onClick={() => handleAddMember(u.id)}
                                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold">{u.name.charAt(0)}</div>
                                                    <div><p className="text-sm text-white">{u.name}</p><p className="text-[10px] text-slate-500">{u.position || u.role}</p></div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {teamUsers.map(m => (
                            <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 group hover:border-blue-600/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-600/20">{m.user.name.charAt(0)}</div>
                                    <div><p className="text-sm text-white font-medium">{m.user.name}</p><p className="text-[10px] text-slate-500">{m.user.position || m.user.role}</p></div>
                                </div>
                                <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ═══════ TAB: CONTACTS ═══════ */}
            {activeTab === "contacts" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2"><Mail size={14} className="text-blue-400" /> Contatos do Cliente</h3>
                        <button onClick={() => setShowAddContact(!showAddContact)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 text-blue-400 border border-blue-600/20 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition-colors"><Plus size={12} /> Novo Contato</button>
                    </div>
                    <AnimatePresence>
                        {showAddContact && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                                <div className="p-4 rounded-xl bg-slate-900/60 border border-blue-600/20 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <input type="text" value={newContact.name} onChange={e => setNewContact({ ...newContact, name: e.target.value })} placeholder="Nome" className="px-3 py-2 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600/50" />
                                        <input type="email" value={newContact.email} onChange={e => setNewContact({ ...newContact, email: e.target.value })} placeholder="E-mail" className="px-3 py-2 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600/50" />
                                        <input type="tel" value={newContact.phone} onChange={e => setNewContact({ ...newContact, phone: e.target.value })} placeholder="Telefone" className="px-3 py-2 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600/50" />
                                    </div>
                                    <div className="flex items-center gap-2 justify-end">
                                        <button onClick={() => setShowAddContact(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">Cancelar</button>
                                        <button onClick={handleAddContact}
                                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors">Adicionar</button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="space-y-2">
                        {clientContacts.length > 0 ? clientContacts.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 group hover:border-blue-600/20 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                    <div>
                                        <p className="text-sm text-white font-medium">{c.name}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[11px] text-slate-500 flex items-center gap-1"><Mail size={10} /> {c.email}</span>
                                            {c.phone && <span className="text-[11px] text-slate-500 flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveContact(c.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-500"><Mail size={32} className="mx-auto mb-2 opacity-30" /><p className="text-xs">Nenhum contato cadastrado</p></div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* ═══════ TAB: SIGNATORIES ═══════ */}
            {activeTab === "signatories" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-slate-800/40 border border-white/[0.06] p-5">
                    <div className="flex items-center gap-2 mb-5">
                        <FileSignature size={16} className="text-amber-400" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Assinantes dos Documentos</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Contratada */}
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <div><h4 className="text-xs font-bold text-white uppercase tracking-widest">Contratada</h4><p className="text-[10px] text-slate-500 mt-0.5">Representante da empresa (gestores)</p></div>
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">1 obrigatório</span>
                            </div>
                            {contratada ? (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-blue-600/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-xs font-bold">{contratada.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                        <div><p className="text-sm text-white font-medium">{contratada.name}</p><span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Gestor</span></div>
                                    </div>
                                    <button onClick={() => { setContratada(null); saveSignatories(null, contratantes, testemunhas); }} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button onClick={() => setShowSignPicker(showSignPicker === "contratada" ? null : "contratada")} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-600 text-sm text-slate-500 hover:text-blue-400 hover:border-blue-600/40 transition-colors"><Plus size={14} /> Selecionar Gestor</button>
                                    <AnimatePresence>
                                        {showSignPicker === "contratada" && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl z-20 overflow-hidden">
                                                <div className="max-h-40 overflow-y-auto p-1.5">
                                                    {getAvailableContratada().map(u => (
                                                        <button key={u.id} onClick={() => { const s: Signatory = { id: `sign-${u.id}`, name: u.name, source: "team", sourceId: u.id, role: "contratada" }; setContratada(s); saveSignatories(s, contratantes, testemunhas); setShowSignPicker(null); }}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left">
                                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold">{u.name.charAt(0)}</div>
                                                            <div><p className="text-sm text-white">{u.name}</p><p className="text-[10px] text-slate-500">{u.position || u.role}</p></div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Contratante(s) */}
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <div><h4 className="text-xs font-bold text-white uppercase tracking-widest">Contratante(s)</h4><p className="text-[10px] text-slate-500 mt-0.5">Representante(s) do cliente</p></div>
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">1+ obrigatório</span>
                            </div>
                            {contratantes.length > 0 && (
                                <div className="space-y-1.5">
                                    {contratantes.map(c => (
                                        <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/50 border border-blue-600/20">
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-[9px] font-bold">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                                <p className="text-sm text-white font-medium">{c.name}</p>
                                            </div>
                                            <button onClick={() => { const nc = contratantes.filter(x => x.id !== c.id); setContratantes(nc); saveSignatories(contratada, nc, testemunhas); }} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="relative">
                                <button onClick={() => setShowSignPicker(showSignPicker === "contratante" ? null : "contratante")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-slate-600 text-sm text-slate-500 hover:text-blue-400 hover:border-blue-600/40 transition-colors"><Plus size={14} /> Adicionar Contratante</button>
                                <AnimatePresence>
                                    {showSignPicker === "contratante" && (
                                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl z-20 overflow-hidden">
                                            <div className="max-h-40 overflow-y-auto p-1.5">
                                                {getAvailableContratantes().length === 0 ? <p className="text-xs text-slate-500 text-center py-3">Cadastre contatos na aba "Contatos" primeiro</p> : getAvailableContratantes().map(c => (
                                                    <button key={c.id} onClick={() => { const s: Signatory = { id: `sign-${c.id}`, name: c.name, source: "client", sourceId: c.id, role: "contratante" }; const nc = [...contratantes, s]; setContratantes(nc); saveSignatories(contratada, nc, testemunhas); setShowSignPicker(null); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-[9px] font-bold">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                                        <div><p className="text-sm text-white">{c.name}</p><p className="text-[10px] text-slate-500">{c.email}</p></div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Testemunha 1 */}
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <div><h4 className="text-xs font-bold text-white uppercase tracking-widest">Testemunha 1</h4><p className="text-[10px] text-slate-500 mt-0.5">Cliente ou gestor da contratada</p></div>
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md">Obrigatório</span>
                            </div>
                            {testemunhas[0] ? (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-600/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${testemunhas[0].source === "team" ? "bg-gradient-to-tr from-blue-600 to-blue-400" : "bg-gradient-to-tr from-blue-600 to-cyan-400"}`}>{testemunhas[0].name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                        <div><p className="text-sm text-white font-medium">{testemunhas[0].name}</p><span className={`text-[9px] font-bold uppercase tracking-wider ${testemunhas[0].source === "team" ? "text-blue-400" : "text-blue-400"}`}>{testemunhas[0].source === "team" ? "Contratada" : "Cliente"}</span></div>
                                    </div>
                                    <button onClick={() => { const nt = testemunhas.filter((_, i) => i !== 0); setTestemunhas(nt); saveSignatories(contratada, contratantes, nt); }} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button onClick={() => setShowSignPicker(showSignPicker === "testemunha" ? null : "testemunha")} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-600 text-sm text-slate-500 hover:text-purple-400 hover:border-purple-600/40 transition-colors"><Plus size={14} /> Selecionar Testemunha</button>
                                    <AnimatePresence>
                                        {showSignPicker === "testemunha" && testemunhas.length === 0 && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl z-20 overflow-hidden">
                                                <div className="max-h-48 overflow-y-auto p-1.5">
                                                    {getAvailableTestemunhas().map(p => (
                                                        <button key={`${p.source}-${p.id}`} onClick={() => { const s: Signatory = { id: `wit-${p.id}`, name: p.name, source: p.source, sourceId: p.id, role: "testemunha_1" }; const nt = [...testemunhas, s]; setTestemunhas(nt); saveSignatories(contratada, contratantes, nt); setShowSignPicker(null); }}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left">
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${p.source === "team" ? "bg-gradient-to-tr from-blue-600 to-blue-400" : "bg-gradient-to-tr from-blue-600 to-cyan-400"}`}>{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                                            <div><p className="text-sm text-white">{p.name}</p><p className="text-[10px] text-slate-500">{p.source === "team" ? "Lado da Contratada" : "Lado do Cliente"}</p></div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* Testemunha 2 */}
                        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <div><h4 className="text-xs font-bold text-white uppercase tracking-widest">Testemunha 2</h4><p className="text-[10px] text-slate-500 mt-0.5">Cliente ou gestor da contratada</p></div>
                                <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md">Obrigatório</span>
                            </div>
                            {testemunhas[1] ? (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-purple-600/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${testemunhas[1].source === "team" ? "bg-gradient-to-tr from-blue-600 to-blue-400" : "bg-gradient-to-tr from-blue-600 to-cyan-400"}`}>{testemunhas[1].name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                        <div><p className="text-sm text-white font-medium">{testemunhas[1].name}</p><span className={`text-[9px] font-bold uppercase tracking-wider ${testemunhas[1].source === "team" ? "text-blue-400" : "text-blue-400"}`}>{testemunhas[1].source === "team" ? "Contratada" : "Cliente"}</span></div>
                                    </div>
                                    <button onClick={() => { const nt = testemunhas.filter((_, i) => i !== 1); setTestemunhas(nt); saveSignatories(contratada, contratantes, nt); }} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button onClick={() => { if (testemunhas.length >= 1) setShowSignPicker(showSignPicker === "testemunha" ? null : "testemunha"); }}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed text-sm transition-colors ${testemunhas.length === 0 ? "border-slate-700 text-slate-600 cursor-not-allowed" : "border-slate-600 text-slate-500 hover:text-purple-400 hover:border-purple-600/40"}`}><Plus size={14} /> Selecionar Testemunha</button>
                                    <AnimatePresence>
                                        {showSignPicker === "testemunha" && testemunhas.length === 1 && (
                                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl z-20 overflow-hidden">
                                                <div className="max-h-48 overflow-y-auto p-1.5">
                                                    {getAvailableTestemunhas().map(p => (
                                                        <button key={`${p.source}-${p.id}`} onClick={() => { const s: Signatory = { id: `wit2-${p.id}`, name: p.name, source: p.source, sourceId: p.id, role: "testemunha_2" }; const nt = [...testemunhas, s]; setTestemunhas(nt); saveSignatories(contratada, contratantes, nt); setShowSignPicker(null); }}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left">
                                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold ${p.source === "team" ? "bg-gradient-to-tr from-blue-600 to-blue-400" : "bg-gradient-to-tr from-blue-600 to-cyan-400"}`}>{p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</div>
                                                            <div><p className="text-sm text-white">{p.name}</p><p className="text-[10px] text-slate-500">{p.source === "team" ? "Lado da Contratada" : "Lado do Cliente"}</p></div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary */}
                    {(contratada || contratantes.length > 0 || testemunhas.length > 0) && (
                        <div className="mt-5 pt-4 border-t border-slate-700/20 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mr-1">Selecionados:</span>
                            {contratada && <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md flex items-center gap-1"><FileSignature size={9} /> {contratada.name} (Contratada)</span>}
                            {contratantes.map(c => <span key={c.id} className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md flex items-center gap-1"><FileSignature size={9} /> {c.name} (Contratante)</span>)}
                            {testemunhas.map((t, i) => <span key={t.id} className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md flex items-center gap-1"><FileSignature size={9} /> {t.name} (Testemunha {i + 1})</span>)}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
