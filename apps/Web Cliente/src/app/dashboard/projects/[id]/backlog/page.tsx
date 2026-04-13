"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ListTodo, Search, GripVertical, ArrowLeft, Building2, ChevronRight, User, ChevronDown, AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";

// ── Types ──
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "critical";

interface ApiTask {
    id: string; projectId: string; title: string; description: string | null;
    status: TaskStatus; priority: TaskPriority; epic: string | null; story: string | null;
    tags: string[]; blocked: boolean; estimatedHours: number; loggedHours: number;
    deadline: string | null; createdAt: string;
    assignee: { id: string; name: string; avatar: string | null; position: string | null } | null;
    assigneeId: string | null;
    project: { id: string; name: string; client: string };
}



function getPriorityColor(p: TaskPriority) {
    const m: Record<TaskPriority, string> = { low: "text-slate-400 bg-slate-500/10", medium: "text-blue-400 bg-blue-500/10", high: "text-amber-400 bg-amber-500/10", critical: "text-red-400 bg-red-500/10" };
    return m[p];
}
function getPriorityLabel(p: TaskPriority) {
    const m: Record<TaskPriority, string> = { low: "Baixa", medium: "Média", high: "Alta", critical: "Crítica" };
    return m[p];
}
function getStatusLabel(s: TaskStatus) {
    const m: Record<TaskStatus, string> = { todo: "A Fazer", in_progress: "Em Andamento", review: "Em Revisão", done: "Concluída" };
    return m[s];
}



// ── Types for API data ──
interface SystemUser {
    id: string; name: string; email: string; role: string;
    position?: string | null; avatar?: string | null;
}
interface ApiComment {
    id: string; text: string; createdAt: string;
    user: { id: string; name: string; avatar: string | null };
}
interface ApiTimeLog {
    id: string; hours: number; description: string | null; date: string;
    user: { id: string; name: string };
}
interface ApiBug {
    id: string; description: string; category: string; priority: string;
    status: string; hoursWorked: number; createdAt: string;
    attachmentIds: string[];
    reporter: { id: string; name: string };
    assignee: { id: string; name: string } | null;
}

// Mock data removed — all fetched from real API

// ── Assignee Picker ──
function AssigneePicker({ currentAssignee, users, onAssign }: { currentAssignee: string; users: SystemUser[]; onAssign?: (userId: string) => void }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(currentAssignee);
    return (
        <div className="relative p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <div className="flex items-center gap-1.5 mb-1"><User size={12} className="text-slate-500" /><span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Responsável</span></div>
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="w-full flex items-center justify-between mt-1.5 hover:bg-slate-700/20 rounded-md px-1 py-0.5 -mx-1 transition-colors">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold">{selected.charAt(0)}</div>
                    <span className="text-sm text-white font-medium">{selected}</span>
                </div>
                <ChevronDown size={12} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl z-30 overflow-hidden">
                        <div className="p-1.5 max-h-48 overflow-y-auto">
                            {users.map(user => (
                                <button key={user.id} onClick={(e) => { e.stopPropagation(); setSelected(user.name); setOpen(false); onAssign?.(user.id); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${selected === user.name ? "bg-blue-500/10 text-blue-400" : "hover:bg-slate-800/60 text-slate-300"}`}>
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[8px] font-bold shrink-0">{user.name.charAt(0)}</div>
                                    <div className="min-w-0"><p className="text-xs font-medium truncate">{user.name}</p><p className="text-[10px] text-slate-500">{user.position || user.role}</p></div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}



// ═══════════════════════════════════════════════════
// PROJECT BACKLOG PAGE
// ═══════════════════════════════════════════════════
export default function ProjectBacklogPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
    const [activePhase, setActivePhase] = useState<TaskStatus>("todo");
    const [activeUser, setActiveUser] = useState<string | null>(null);

    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const router = useRouter();

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (priorityFilter !== "all") params.set("priority", priorityFilter);
        params.set("projectId", projectId);
        if (search) params.set("search", search);
        const res = await api<ApiTask[]>(`/api/dev-projects/tasks/all?${params.toString()}`);
        if (res.success && res.data) setTasks(res.data);
        setLoading(false);
    }, [statusFilter, priorityFilter, projectId, search]);

    const fetchProject = useCallback(async () => {
        const res = await api<any>(`/api/dev-projects/${projectId}`);
        if (res.success && res.data) setProject(res.data);
    }, [projectId]);



    useEffect(() => { fetchProject(); }, [fetchProject]);
    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const columns: { status: TaskStatus; label: string; color: string }[] = [
        { status: "todo", label: "A Fazer", color: "border-t-slate-500" },
        { status: "in_progress", label: "Em Desenvolvimento", color: "border-t-blue-500" },
        { status: "review", label: "Em Revisão", color: "border-t-amber-500" },
        { status: "done", label: "Concluído", color: "border-t-green-500" },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link href={`/dashboard/projects/${projectId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors mb-3">
                    <ArrowLeft size={14} /> Voltar ao Projeto
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">{project?.name || "Backlog"}</h1>
                <p className="text-slate-400 mt-1 flex items-center gap-2">
                    {project?.client && <><Building2 size={14} /> {project.client}</>}
                </p>
            </motion.div>

            {/* NavTabs Fases */}
            <div className="flex gap-3 p-2 bg-slate-900/50 rounded-2xl mb-2 overflow-x-auto custom-scrollbar border border-white/[0.04] shadow-inner">
                {columns.map(col => {
                    const count = tasks.filter(t => t.status === col.status).length;
                    const isActive = activePhase === col.status;
                    const badgeColors: Record<string, string> = {
                        todo: "bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.5)]", 
                        in_progress: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]", 
                        review: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]", 
                        done: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    };
                    const hoverColorClass = !isActive ? 'hover:bg-slate-800/80 hover:border-white/10' : '';
                    return (
                        <button key={col.status} onClick={() => setActivePhase(col.status)}
                            className={`flex flex-col flex-1 min-w-[160px] px-5 py-4 rounded-xl border transition-all duration-300 ${isActive ? 'bg-slate-800 border-white/[0.1] shadow-xl shadow-black/40 scale-[1.02]' : `bg-slate-900/40 border-transparent ${hoverColorClass}`}`}>
                            <div className="flex items-center justify-between w-full mb-2">
                                <span className={`text-[11px] font-bold uppercase tracking-widest ${isActive ? 'text-white' : 'text-slate-500'}`}>{col.label}</span>
                                <div className={`w-3 h-3 rounded-full ${isActive ? badgeColors[col.status] : 'bg-slate-800 border border-slate-700/50'}`} />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black tracking-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>{count}</span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-slate-400' : 'text-slate-600'}`}>tarefas</span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center bg-slate-900/40 p-3 rounded-xl border border-white/[0.04]">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefa..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50" />
                </div>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as TaskPriority | "all")}
                    className="px-3 py-2 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todas prioridades</option>
                    <option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option>
                </select>
            </div>

            {loading && (
                <div className="text-center py-20">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Carregando tarefas...</p>
                </div>
            )}

            {!loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} key={activePhase} className="w-full">
                    {(() => {
                        const phaseTasks = tasks.filter(t => t.status === activePhase);
                        
                        if (phaseTasks.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-slate-900/20 rounded-2xl border border-dashed border-slate-700/30">
                                    <ListTodo size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Nenhuma tarefa nesta fase</p>
                                    <p className="text-xs text-slate-600 mt-2">Você concluiu tudo ou ainda não há movimentação aqui.</p>
                                </div>
                            );
                        }

                        // 1. Extração Dinâmica dos Usuários Inseridos nas Tarefas Desta Fase
                        const phaseUsersMap: Record<string, ApiTask[]> = {};
                        for (const t of phaseTasks) {
                            const tags = Array.isArray(t.tags) ? t.tags : [];
                            const uTag = tags.find(tag => tag.startsWith('user:'));
                            const user = uTag ? uTag.replace('user:', '') : "Geral (Sem Usuário)";
                            if (!phaseUsersMap[user]) phaseUsersMap[user] = [];
                            phaseUsersMap[user].push(t);
                        }
                        
                        const phaseUserNames = Object.keys(phaseUsersMap).sort();
                        const currentActiveUser = phaseUserNames.includes(activeUser || "") ? activeUser! : phaseUserNames[0];

                        // 2. Agrupamento Hierárquico do Usuário Ativo: Plataforma > Módulo > Tarefas
                        const activeUserTasks = phaseUsersMap[currentActiveUser];
                        const groupedPlatforms: Record<string, Record<string, ApiTask[]>> = {};
                        
                        for (const t of activeUserTasks) {
                            const tags = Array.isArray(t.tags) ? t.tags : [];
                            const pTag = tags.find(tag => tag.startsWith('platform:'));
                            const platform = pTag ? pTag.replace('platform:', '') : "Sistema/Geral";
                            const moduleName = t.epic || "Outros Módulos";
                            
                            if (!groupedPlatforms[platform]) groupedPlatforms[platform] = {};
                            if (!groupedPlatforms[platform][moduleName]) groupedPlatforms[platform][moduleName] = [];
                            groupedPlatforms[platform][moduleName].push(t);
                        }

                        return (
                            <div className="w-full animate-in fade-in duration-500">
                                {/* Navegação Secundária: ABAS DE USUÁRIOS */}
                                <div className="flex gap-2 p-1.5 bg-slate-900/40 rounded-2xl mb-8 overflow-x-auto custom-scrollbar border border-white/[0.04]">
                                    {phaseUserNames.map(user => {
                                        const isActive = currentActiveUser === user;
                                        const taskCount = phaseUsersMap[user].length;
                                        return (
                                            <button key={user} onClick={() => setActiveUser(user)}
                                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${isActive ? 'bg-blue-600 shadow-lg shadow-blue-600/30 text-white scale-[1.02]' : 'bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                                                <User size={14} className={isActive ? 'text-white' : 'text-slate-500'} />
                                                <span className="truncate max-w-[180px]">{user}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'}`}>{taskCount}</span>
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* Conteúdo Restrito ao Usuário Ativo */}
                                <div className="space-y-6">
                                    {Object.entries(groupedPlatforms).map(([platform, modules], platIdx) => (
                                        <div key={platform} className="bg-slate-800/20 rounded-2xl border border-white/[0.04] shadow-sm p-5">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-1.5 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">{platform}</span>
                                            </div>
                                            <div className="pl-3.5 space-y-6">
                                                {Object.entries(modules).map(([modName, modTasks]) => (
                                                    <div key={modName} className="bg-slate-900/30 rounded-xl border border-slate-700/30 overflow-hidden">
                                                        <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/50">
                                                            <span className="text-[11px] font-bold text-slate-400">{modName}</span>
                                                        </div>
                                                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                                                            {modTasks.map(task => {
                                                                const name = task.assignee?.name || "Não atribuído";
                                                                const initials = name.charAt(0);
                                                                return (
                                                                    <div key={task.id} onClick={() => router.push(`/dashboard/projects/${projectId}/backlog/${task.id}`)}
                                                                        className="p-6 rounded-2xl bg-slate-900/80 border border-slate-700/40 hover:border-blue-500/40 transition-all cursor-pointer group shadow-md hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 flex flex-col relative overflow-hidden h-full">
                                                                        
                                                                        {task.blocked && <div className="absolute top-0 right-0 w-10 h-10 flex justify-end items-start p-2 bg-red-500/10 rounded-bl-2xl"><AlertTriangle size={16} className="text-red-400 animate-pulse" /></div>}
                                                                        
                                                                        <h4 className="text-base text-white font-bold leading-relaxed group-hover:text-blue-400 transition-colors break-words pr-8 mb-3">{task.title}</h4>
                                                                        
                                                                        {task.story && <p className="text-xs text-slate-400 line-clamp-4 mt-2 italic flex-1 break-words leading-loose">&quot;{task.story}&quot;</p>}
                                                                        
                                                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/80">
                                                                            <span className={`px-3 py-1.5 text-[11px] font-black tracking-widest uppercase rounded flex items-center gap-1.5 bg-slate-900 ${getPriorityColor(task.priority)}`}>
                                                                                {getPriorityLabel(task.priority)}
                                                                            </span>
                                                                            {/* HIDDEN FOR CLIENTS:
                                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                                <span className="text-sm font-medium text-slate-400 truncate">{name}</span>
                                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm shadow-blue-900/50">
                                                                                    {initials}
                                                                                </div>
                                                                            </div>
                                                                            */}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </motion.div>
            )}

            {!loading && tasks.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <ListTodo size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
                    <p className="text-xs text-slate-600 mt-1">Tarefas são criadas automaticamente quando uma proposta é enviada para devs.</p>
                </div>
            )}

        </div>
    );
}
