"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ListTodo, Search, GripVertical, X, Clock, User, FolderKanban, Tag, CalendarDays,
    AlertTriangle, MessageSquare, Paperclip, History, Send, Play, Square,
    ChevronDown, Bug, Upload, Image, Video, FileText as FileTextIcon, File,
    ArrowLeft, Building2, ChevronRight, MessageCircle
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

interface MockTask {
    id: string; projectId: string; title: string; description: string;
    status: TaskStatus; priority: TaskPriority; assignee: string;
    estimatedHours: number; loggedHours: number; epic: string; story: string;
    deadline: string; tags: string[]; blocked: boolean; createdAt: string;
}

function apiTaskToMock(t: ApiTask): MockTask {
    return {
        id: t.id, projectId: t.projectId, title: t.title, description: t.description || "",
        status: t.status, priority: t.priority, assignee: t.assignee?.name || "Não atribuído",
        estimatedHours: t.estimatedHours, loggedHours: t.loggedHours, epic: t.epic || "",
        story: t.story || "", deadline: t.deadline || "", tags: t.tags, blocked: t.blocked,
        createdAt: t.createdAt,
    };
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

// ── Timer Hook ──
interface TimerState { isRunning: boolean; elapsed: number; startedAt: number | null; }

function useWorkTimers() {
    const [timers, setTimers] = useState<Record<string, TimerState>>({});
    const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

    const getTimer = useCallback((taskId: string): TimerState => timers[taskId] || { isRunning: false, elapsed: 0, startedAt: null }, [timers]);

    const startTimer = useCallback((taskId: string) => {
        setTimers(prev => ({ ...prev, [taskId]: { ...prev[taskId] || { elapsed: 0 }, isRunning: true, startedAt: Date.now() } }));
        intervalsRef.current[taskId] = setInterval(() => {
            setTimers(prev => { const t = prev[taskId]; if (!t?.isRunning || !t.startedAt) return prev; return { ...prev, [taskId]: { ...t, elapsed: t.elapsed + 1 } }; });
        }, 1000);
    }, []);

    const stopTimer = useCallback((taskId: string) => {
        if (intervalsRef.current[taskId]) { clearInterval(intervalsRef.current[taskId]); delete intervalsRef.current[taskId]; }
        setTimers(prev => ({ ...prev, [taskId]: { ...prev[taskId], isRunning: false, startedAt: null } }));
    }, []);

    const toggleTimer = useCallback((taskId: string) => { const t = timers[taskId]; t?.isRunning ? stopTimer(taskId) : startTimer(taskId); }, [timers, startTimer, stopTimer]);

    useEffect(() => { const refs = intervalsRef.current; return () => { Object.values(refs).forEach(clearInterval); }; }, []);
    return { getTimer, toggleTimer };
}

function formatTimer(s: number) { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`; }
function formatTimerShort(s: number) { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60; if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m`; if (m > 0) return `${m}m${sec.toString().padStart(2, "0")}s`; return `${sec}s`; }

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

// ── Task Detail Drawer ──
function TaskDetailDrawer({ task, onClose, timer, onToggleTimer, allUsers, onRefresh, initialTab }: { task: MockTask; onClose: () => void; timer: TimerState; onToggleTimer: () => void; allUsers: SystemUser[]; onRefresh?: () => void; initialTab?: "details" | "hours" | "bugs" | "comments" | "history" }) {
    const [activeTab, setActiveTab] = useState<"details" | "hours" | "bugs" | "comments" | "history">(initialTab || "details");
    const [newComment, setNewComment] = useState("");
    const [comments, setComments] = useState<ApiComment[]>([]);
    const [hoursLog, setHoursLog] = useState<ApiTimeLog[]>([]);
    const [taskStatus, setTaskStatus] = useState<TaskStatus>(task.status);
    const [taskPriority, setTaskPriority] = useState<TaskPriority>(task.priority);
    const detailsFileRef = useRef<HTMLInputElement>(null);
    const [taskAttachments, setTaskAttachments] = useState<{ id: string; originalName: string; mimeType: string; size: number; createdAt: string }[]>([]);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [historyEntries, setHistoryEntries] = useState<{ id: string; action: string; description: string; createdAt: string; user: { id: string; name: string } }[]>([]);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
    const getAttachmentUrl = (attId: string) => `${API_BASE}/api/dev-projects/tasks/${task.id}/attachments/${attId}/download`;

    useEffect(() => {
        api<ApiComment[]>(`/api/dev-projects/tasks/${task.id}/comments`).then(r => { if (r.success && r.data) setComments(r.data); });
        api<ApiTimeLog[]>(`/api/dev-projects/tasks/${task.id}/time-logs`).then(r => { if (r.success && r.data) setHoursLog(r.data); });
        api<ApiBug[]>(`/api/dev-projects/tasks/${task.id}/bugs`).then(r => { if (r.success && r.data) setBugEntries(r.data); });
        api<any[]>(`/api/dev-projects/tasks/${task.id}/attachments`).then(r => { if (r.success && r.data) setTaskAttachments(r.data); });
        api<any[]>(`/api/dev-projects/tasks/${task.id}/history`).then(r => { if (r.success && r.data) setHistoryEntries(r.data); });
    }, [task.id]);

    const handleDetailsFiles = async (files: FileList | null) => {
        if (!files) return;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append("file", file);
            try {
                const res = await fetch(`${API_BASE}/api/dev-projects/tasks/${task.id}/attachments`, {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                });
                const json = await res.json();
                if (json.success && json.data) {
                    setTaskAttachments(prev => [...prev, json.data]);
                }
            } catch (err) { console.warn("Upload failed:", err); }
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        await api(`/api/dev-projects/tasks/${task.id}/attachments/${attachmentId}`, { method: "DELETE" });
        setTaskAttachments(prev => prev.filter(a => a.id !== attachmentId));
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        const res = await api<ApiComment>(`/api/dev-projects/tasks/${task.id}/comments`, { method: "POST", body: { text: newComment } });
        if (res.success && res.data) { setComments(prev => [...prev, res.data!]); setNewComment(""); }
    };

    const handleSaveTask = async () => {
        await api(`/api/dev-projects/tasks/${task.id}`, { method: "PATCH", body: { status: taskStatus, priority: taskPriority } });
        onRefresh?.();
        onClose();
    };

    const handleAssignUser = async (userId: string) => {
        await api(`/api/dev-projects/tasks/${task.id}`, { method: "PATCH", body: { assigneeId: userId } });
        onRefresh?.();
    };

    const handleStopTimerAndLog = () => {
        onToggleTimer();
        if (timer.isRunning && timer.elapsed > 0) {
            const hours = parseFloat((timer.elapsed / 3600).toFixed(2));
            api(`/api/dev-projects/tasks/${task.id}/time-logs`, { method: "POST", body: { hours, description: "Sessão de trabalho" } }).then(() => {
                api<ApiTimeLog[]>(`/api/dev-projects/tasks/${task.id}/time-logs`).then(r => { if (r.success && r.data) setHoursLog(r.data); });
            });
        }
    };

    const [showBugModal, setShowBugModal] = useState(false);
    const [bugDescription, setBugDescription] = useState("");
    const [bugDeveloper, setBugDeveloper] = useState("");
    const [bugPriority, setBugPriority] = useState<"high" | "critical">("high");
    const [bugCategory, setBugCategory] = useState("functional");
    const [bugAttachments, setBugAttachments] = useState<{ id: string; name: string; size: string; type: string }[]>([]);
    const bugFileRef = useRef<HTMLInputElement>(null);

    const [bugEntries, setBugEntries] = useState<ApiBug[]>([]);
    const developers = allUsers.filter(u => ["DEV", "TECH_LEAD", "GESTOR", "ADMIN"].includes(u.role));
    const BUG_CATEGORIES: Record<string, { label: string; color: string }> = { functional: { label: "Funcional", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" }, visual: { label: "Visual / UI", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" }, performance: { label: "Performance", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" }, integration: { label: "Integração", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" }, data: { label: "Dados / BD", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" }, security: { label: "Segurança", color: "text-red-400 bg-red-500/10 border-red-500/20" } };

    const formatSize = (bytes: number) => { if (bytes < 1024) return `${bytes} B`; if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1048576).toFixed(1)} MB`; };
    const getFileIcon = (type: string) => { if (type.startsWith("image/")) return <Image size={14} className="text-blue-400" />; if (type.startsWith("video/")) return <Video size={14} className="text-purple-400" />; if (type === "application/pdf") return <FileTextIcon size={14} className="text-red-400" />; return <File size={14} className="text-blue-400" />; };
    const handleBugFiles = async (files: FileList | null) => {
        if (!files) return;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append("file", file);
            try {
                const res = await fetch(`${API_BASE}/api/dev-projects/tasks/${task.id}/attachments`, {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                });
                const json = await res.json();
                if (json.success && json.data) {
                    setBugAttachments(prev => [...prev, { id: json.data.id, name: json.data.originalName, size: formatSize(json.data.size), type: json.data.mimeType }]);
                }
            } catch (err) { console.warn("Upload failed:", err); }
        }
    };

    const handleConfirmBug = async () => {
        if (!bugDescription.trim()) return;
        const assignee = developers.find(d => d.name === bugDeveloper);
        const res = await api<ApiBug>(`/api/dev-projects/tasks/${task.id}/bugs`, {
            method: "POST",
            body: { description: bugDescription, category: bugCategory, priority: bugPriority, assigneeId: assignee?.id || null, attachmentIds: bugAttachments.map(a => a.id) },
        });
        if (res.success && res.data) {
            setBugEntries(prev => [res.data!, ...prev]);
            setShowBugModal(false);
            setBugAttachments([]);
            setActiveTab("bugs");
        }
    };

    const markBugFixed = async (bugId: string) => {
        const res = await api<ApiBug>(`/api/dev-projects/tasks/${task.id}/bugs/${bugId}`, { method: "PATCH", body: { status: "fixed" } });
        if (res.success && res.data) setBugEntries(prev => prev.map(b => b.id === bugId ? res.data! : b));
    };

    const totalBugHours = bugEntries.reduce((sum, b) => sum + b.hoursWorked, 0);

    const statusColors: Record<TaskStatus, string> = { todo: "bg-slate-500/10 text-slate-400 border-slate-500/20", in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20", review: "bg-amber-500/10 text-amber-400 border-amber-500/20", done: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
    const tabs = [
        { key: "details" as const, label: "Detalhes", icon: ListTodo },
        { key: "hours" as const, label: "Horas", icon: Clock },
        { key: "bugs" as const, label: `Bugs (${bugEntries.length})`, icon: Bug },
        { key: "comments" as const, label: `Comentários (${comments.length})`, icon: MessageSquare },
        { key: "history" as const, label: "Histórico", icon: History },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={e => e.stopPropagation()} className="relative w-full max-w-[640px] bg-slate-900 border-l border-white/[0.06] h-full overflow-hidden flex flex-col shadow-2xl shadow-black/60">

                {/* Header */}
                <div className="shrink-0 px-6 py-4 border-b border-white/[0.06]">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${statusColors[task.status]}`}>{getStatusLabel(task.status)}</span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${getPriorityColor(task.priority)}`}>{getPriorityLabel(task.priority)}</span>
                                {task.blocked && <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse flex items-center gap-1"><AlertTriangle size={10} /> Bloqueada</span>}
                            </div>
                            <h2 className="text-lg font-bold text-white leading-tight">{task.title}</h2>
                            <p className="text-xs text-slate-500 mt-1">{task.epic}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"><X size={18} /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="shrink-0 px-6 border-b border-white/[0.06]">
                    <div className="flex gap-1 -mb-px">
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`px-3 py-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-all ${activeTab === tab.key ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                                <tab.icon size={13} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === "details" && (
                            <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-6 space-y-5">
                                <div><label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">Descrição</label><p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">{task.description}</p></div>
                                {task.story && <div><label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">User Story</label><p className="text-sm text-slate-400 italic bg-slate-800/30 rounded-lg p-3 border border-slate-700/20">&quot;{task.story}&quot;</p></div>}
                                <div className="grid grid-cols-2 gap-3">
                                    <AssigneePicker currentAssignee={task.assignee} users={allUsers} onAssign={handleAssignUser} />
                                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                                        <div className="flex items-center gap-1.5 mb-1"><FolderKanban size={12} className="text-slate-500" /><span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Épico</span></div>
                                        <p className="text-sm text-white font-medium mt-1.5">{task.epic}</p>
                                    </div>
                                    {task.deadline && <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                                        <div className="flex items-center gap-1.5 mb-1"><CalendarDays size={12} className="text-slate-500" /><span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Prazo</span></div>
                                        <p className="text-sm text-white font-medium mt-1.5">{new Date(task.deadline).toLocaleDateString("pt-BR")}</p>
                                    </div>}
                                </div>
                                {task.tags.length > 0 && <div><label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block flex items-center gap-1"><Tag size={10} /> Tags</label><div className="flex flex-wrap gap-1.5">{task.tags.map(tag => <span key={tag} className="px-2.5 py-1 text-[11px] font-medium bg-slate-800/60 border border-slate-700/40 rounded-lg text-slate-300">{tag}</span>)}</div></div>}
                                <div><label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block flex items-center gap-1"><Paperclip size={10} /> Anexos</label><div onClick={() => detailsFileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleDetailsFiles(e.dataTransfer.files); }} className="border-2 border-dashed border-white/[0.06] rounded-lg p-4 text-center cursor-pointer hover:border-blue-500/30 transition-all"><Paperclip size={20} className="mx-auto mb-1.5 text-slate-600" /><p className="text-xs text-slate-500">Arraste arquivos ou clique para anexar</p><input ref={detailsFileRef} type="file" multiple className="hidden" onChange={e => { handleDetailsFiles(e.target.files); e.target.value = ""; }} /></div>{(() => { const bugAttIds = new Set(bugEntries.flatMap(b => b.attachmentIds || [])); const detailsOnly = taskAttachments.filter(a => !bugAttIds.has(a.id)); return detailsOnly.length > 0 && <div className="mt-3 flex gap-2 overflow-x-auto pb-2">{detailsOnly.map(att => { const isImage = att.mimeType?.startsWith("image/"); const url = getAttachmentUrl(att.id); return (<div key={att.id} className="relative group shrink-0">{isImage ? (<img src={url} alt={att.originalName} onClick={() => setLightboxUrl(url)} className="w-20 h-20 rounded-lg object-cover border border-slate-700/40 cursor-pointer hover:border-blue-500/40 hover:scale-105 transition-all shadow-md" />) : (<div className="w-20 h-20 rounded-lg bg-slate-800/60 border border-slate-700/40 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-500/40 transition-all" onClick={() => window.open(url, "_blank")}><File size={18} className="text-slate-400" /><span className="text-[8px] text-slate-500 truncate max-w-[60px] px-1">{att.originalName}</span></div>)}<button onClick={() => handleDeleteAttachment(att.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X size={10} className="text-white" /></button><span className="text-[8px] text-slate-600 block text-center mt-1 truncate max-w-[80px]">{formatSize(att.size)}</span></div>); })}</div>; })()}</div>
                                <div className="text-[11px] text-slate-600 pt-3 border-t border-slate-700/30">Criada em {new Date(task.createdAt).toLocaleDateString("pt-BR")} · ID: {task.id}</div>
                            </motion.div>
                        )}

                        {activeTab === "hours" && (
                            <motion.div key="hours" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-6 space-y-4">
                                <div className={`p-5 rounded-xl border transition-all ${timer.isRunning ? "bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-500/5" : "bg-slate-800/40 border-slate-700/30"}`}>
                                    <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2"><Clock size={14} className={timer.isRunning ? "text-blue-400" : "text-slate-500"} /><span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Cronômetro</span></div>{timer.isRunning && <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full animate-pulse">Gravando</span>}</div>
                                    <p className={`text-4xl font-bold font-mono text-center my-4 ${timer.isRunning ? "text-blue-400" : "text-white"}`}>{formatTimer(timer.elapsed)}</p>
                                    <button onClick={handleStopTimerAndLog} className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${timer.isRunning ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-blue-600 text-white shadow-lg shadow-blue-600/20"}`}>{timer.isRunning ? <><Square size={14} className="fill-red-400" /> Parar</> : <><Play size={14} className="fill-white" /> Iniciar</>}</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Registradas</p><p className={`text-xl font-bold mt-1 ${task.loggedHours > task.estimatedHours ? "text-red-400" : "text-blue-400"}`}>{task.loggedHours}h</p></div>
                                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Sessão</p><p className="text-xl font-bold text-blue-400 mt-1">{timer.elapsed > 0 ? formatTimerShort(timer.elapsed) : "—"}</p></div>
                                </div>
                                <div><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">Histórico</p><div className="space-y-2">{hoursLog.length > 0 ? hoursLog.map((e) => <div key={e.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30"><div className="flex justify-between mb-1"><span className="text-xs text-slate-400">{new Date(e.date).toLocaleDateString("pt-BR")}</span><span className="text-sm font-bold text-blue-400">{e.hours}h</span></div><p className="text-sm text-white">{e.description || "Sessão de trabalho"}</p><p className="text-[11px] text-slate-500 mt-1">{e.user.name}</p></div>) : <div className="text-center py-6 text-slate-500"><Clock size={24} className="mx-auto mb-2 opacity-30" /><p className="text-xs">Nenhum lançamento</p></div>}</div></div>
                            </motion.div>
                        )}

                        {activeTab === "comments" && (
                            <motion.div key="comments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-col h-full">
                                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                                    {comments.length > 0 ? comments.map(c => <div key={c.id} className="flex items-start gap-3"><div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{c.user.name.charAt(0)}</div><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-white">{c.user.name}</span><span className="text-[10px] text-slate-600">{new Date(c.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div><p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">{c.text}</p></div></div>) : <div className="text-center py-10 text-slate-500"><MessageSquare size={32} className="mx-auto mb-2 opacity-30" /><p className="text-xs">Nenhum comentário</p></div>}
                                </div>
                                <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] bg-slate-900"><div className="flex items-end gap-2"><div className="flex-1"><textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Escrever comentário..." rows={2} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }} className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 resize-none" /></div><button onClick={handleSendComment} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors shadow-lg shadow-blue-600/20 shrink-0"><Send size={16} /></button></div></div>
                            </motion.div>
                        )}

                        {activeTab === "bugs" && (
                            <motion.div key="bugs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-6 space-y-4">
                                {bugEntries.length > 0 && <div className="grid grid-cols-3 gap-2"><div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 text-center"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Total</p><p className="text-xl font-bold text-red-400 mt-1">{bugEntries.length}</p></div><div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-center"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Horas</p><p className="text-xl font-bold text-amber-400 mt-1">{totalBugHours.toFixed(1)}h</p></div><div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-center"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Corrigidos</p><p className="text-xl font-bold text-blue-400 mt-1">{bugEntries.filter(b => b.status === "fixed").length}</p></div></div>}
                                {bugEntries.length > 0 ? bugEntries.map(bug => { const cat = BUG_CATEGORIES[bug.category] || BUG_CATEGORIES.functional; return (<div key={bug.id} className={`p-4 rounded-xl border ${bug.status === "fixed" ? "bg-blue-500/5 border-blue-500/20" : "bg-slate-900/40 border-slate-700/30"}`}><div className="flex items-start justify-between gap-3 mb-2"><div className="flex items-center gap-2 flex-wrap"><span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${cat.color}`}>{cat.label}</span><span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${bug.priority === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{bug.priority === "critical" ? "Crítica" : "Alta"}</span>{bug.status === "fixed" && <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">Corrigido</span>}</div><span className="text-[10px] text-slate-600 shrink-0">{new Date(bug.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span></div><p className="text-sm text-slate-300 mb-2">{bug.description}</p>{bug.attachmentIds && bug.attachmentIds.length > 0 && <div className="flex gap-2 overflow-x-auto pb-2 mb-2">{bug.attachmentIds.map(attId => { const url = getAttachmentUrl(attId); return <img key={attId} src={url} alt="Bug attachment" onClick={() => setLightboxUrl(url)} className="w-16 h-16 rounded-lg object-cover border border-slate-700/40 cursor-pointer hover:border-red-500/40 hover:scale-105 transition-all shadow-md" />; })}</div>}<div className="flex items-center justify-between pt-2 border-t border-slate-700/20"><span className="text-xs text-slate-500">{bug.reporter.name}{bug.assignee && ` → ${bug.assignee.name}`}</span>{bug.status !== "fixed" && <button onClick={() => markBugFixed(bug.id)} className="px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">Corrigido</button>}</div></div>); }) : <div className="flex flex-col items-center py-10 text-center"><Bug size={28} className="text-slate-600 mb-3" /><p className="text-sm text-slate-400 font-medium">Nenhum bug reportado</p><p className="text-xs text-slate-600 mt-1">Use &quot;Reportar Bug&quot; no rodapé</p></div>}
                            </motion.div>
                        )}

                        {activeTab === "history" && (() => {
                            const actionColors: Record<string,string> = { status_change: "bg-blue-500", comment: "bg-indigo-500", bug_report: "bg-red-500", bug_fixed: "bg-green-500", time_log: "bg-emerald-500", attachment_upload: "bg-amber-500", attachment_delete: "bg-orange-500", assignment: "bg-violet-500", priority_change: "bg-pink-500", description_update: "bg-cyan-500", blocked_change: "bg-yellow-500", task_created: "bg-teal-500" };
                            const actionIcons: Record<string,string> = { status_change: "🔄", comment: "💬", bug_report: "🐛", bug_fixed: "✅", time_log: "⏱️", attachment_upload: "📎", attachment_delete: "🗑️", assignment: "👤", priority_change: "⚡", description_update: "📝", blocked_change: "🚧", task_created: "✨" };
                            // Build unified timeline from all sources
                            const timeline: { id: string; action: string; description: string; userName: string; date: string }[] = [];
                            // From API history
                            historyEntries.forEach(e => timeline.push({ id: e.id, action: e.action, description: e.description, userName: e.user.name, date: e.createdAt }));
                            // From bugs (if not already in history)
                            const historyIds = new Set(historyEntries.map(h => h.id));
                            bugEntries.forEach(bug => {
                                if (!historyEntries.some(h => h.action === "bug_report" && h.description.includes(bug.description.substring(0, 30)))) {
                                    timeline.push({ id: `bug-${bug.id}`, action: "bug_report", description: `Bug reportado: "${bug.description.substring(0, 80)}${bug.description.length > 80 ? "..." : ""}"${bug.status === "fixed" ? " (Corrigido)" : ""}`, userName: bug.reporter.name, date: bug.createdAt });
                                }
                            });
                            // From hours logs (if not already in history)
                            hoursLog.forEach(log => {
                                if (!historyEntries.some(h => h.action === "time_log" && new Date(h.createdAt).getTime() - new Date(log.date).getTime() < 60000)) {
                                    timeline.push({ id: `log-${log.id}`, action: "time_log", description: `${log.hours}h registradas — ${log.description || "Sessão de trabalho"}`, userName: log.user.name, date: log.date });
                                }
                            });
                            // From attachments (if not already in history)
                            taskAttachments.forEach(att => {
                                if (!historyEntries.some(h => h.action === "attachment_upload" && h.description.includes(att.originalName.substring(0, 30)))) {
                                    timeline.push({ id: `att-${att.id}`, action: "attachment_upload", description: `Arquivo anexado: "${att.originalName}"`, userName: "—", date: att.createdAt });
                                }
                            });
                            // From comments (if not already in history)
                            comments.forEach(c => {
                                if (!historyEntries.some(h => h.action === "comment" && h.description.includes(c.text.substring(0, 30)))) {
                                    timeline.push({ id: `cmt-${c.id}`, action: "comment", description: `Comentário: "${c.text.substring(0, 80)}${c.text.length > 80 ? "..." : ""}"`, userName: c.user.name, date: c.createdAt });
                                }
                            });
                            timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                            return (
                            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-6 space-y-3">
                                {timeline.length > 0 ? timeline.map(entry => (
                                    <div key={entry.id} className="flex items-start gap-3">
                                        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${actionColors[entry.action] || "bg-slate-500"}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-300">
                                                <span className="mr-1.5">{actionIcons[entry.action] || "📌"}</span>
                                                {entry.description}
                                            </p>
                                            <p className="text-[10px] text-slate-600 mt-0.5">
                                                {entry.userName} · {new Date(entry.date).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                )) : <div className="text-center py-10 text-slate-500"><History size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">Nenhum registro</p></div>}
                            </motion.div>);
                        })()}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] flex items-center justify-between bg-slate-900">
                    <div className="flex gap-2">
                        <select value={taskStatus} onChange={e => setTaskStatus(e.target.value as TaskStatus)} className="px-3 py-2 bg-slate-800/60 border border-white/[0.06] rounded-lg text-xs font-medium text-slate-300 focus:outline-none">
                            <option value="todo">A Fazer</option><option value="in_progress">Em Desenvolvimento</option><option value="review">Em Revisão</option><option value="done">Concluída</option>
                        </select>
                        <button onClick={() => { setShowBugModal(true); setBugDescription(""); setBugDeveloper(task.assignee); setBugPriority("high"); setBugCategory("functional"); setBugAttachments([]); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">
                            <Bug size={13} /> Reportar Bug
                        </button>
                    </div>
                    <button onClick={handleSaveTask} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20">Salvar</button>
                </div>

                {/* Bug Report Modal */}
                <AnimatePresence>
                    {showBugModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex items-center justify-center p-6" onClick={() => setShowBugModal(false)}>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-md bg-slate-900 border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between"><div className="flex items-center gap-2"><Bug size={18} className="text-red-400" /><h3 className="text-lg font-bold text-white">Reportar Bug</h3></div><button onClick={() => setShowBugModal(false)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"><X size={18} /></button></div>
                                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15"><p className="text-xs text-red-400">O card <strong className="text-white">&quot;{task.title}&quot;</strong> voltará para &quot;A Fazer&quot; com registro no histórico.</p></div>
                                    <div><label className="text-[11px] text-slate-400 font-medium block mb-1.5">Descrição do Bug</label><textarea value={bugDescription} onChange={e => setBugDescription(e.target.value)} rows={3} placeholder="Descreva o bug..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 resize-none" /></div>
                                    <div><label className="text-[11px] text-slate-400 font-medium block mb-1.5">Categoria</label><div className="grid grid-cols-3 gap-1.5">{Object.entries(BUG_CATEGORIES).map(([key, cat]) => <button key={key} onClick={() => setBugCategory(key)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${bugCategory === key ? cat.color : "bg-slate-800/50 text-slate-500 border-white/[0.06]"}`}>{cat.label}</button>)}</div></div>
                                    <div><label className="text-[11px] text-slate-400 font-medium block mb-1.5">Desenvolvedor</label><select value={bugDeveloper} onChange={e => setBugDeveloper(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none">{developers.map(dev => <option key={dev.id} value={dev.name}>{dev.name} ({dev.position || dev.role})</option>)}</select></div>
                                    <div><label className="text-[11px] text-slate-400 font-medium block mb-1.5">Prioridade</label><div className="flex gap-2"><button onClick={() => setBugPriority("high")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${bugPriority === "high" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-slate-800/50 text-slate-400 border-white/[0.06]"}`}>Alta</button><button onClick={() => setBugPriority("critical")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${bugPriority === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-slate-800/50 text-slate-400 border-white/[0.06]"}`}>Crítica</button></div></div>
                                    <div onClick={() => bugFileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleBugFiles(e.dataTransfer.files); }}
                                        className="border-2 border-dashed border-white/[0.06] rounded-lg p-4 text-center cursor-pointer hover:border-red-500/30 transition-all">
                                        <Upload size={20} className="mx-auto mb-1.5 text-slate-600" /><p className="text-xs text-slate-500">Arraste ou clique para anexar</p>
                                        <input ref={bugFileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={e => { handleBugFiles(e.target.files); e.target.value = ""; }} />
                                    </div>
                                    {bugAttachments.length > 0 && <div className="flex gap-2 overflow-x-auto pb-1">{bugAttachments.map((att, i) => { const isImage = att.type?.startsWith("image/"); const url = getAttachmentUrl(att.id); return (<div key={att.id} className="relative group shrink-0">{isImage ? (<img src={url} alt={att.name} onClick={() => setLightboxUrl(url)} className="w-16 h-16 rounded-lg object-cover border border-slate-700/40 cursor-pointer hover:border-red-500/40 hover:scale-105 transition-all" />) : (<div className="w-16 h-16 rounded-lg bg-slate-800/60 border border-slate-700/40 flex flex-col items-center justify-center gap-0.5">{getFileIcon(att.type)}<span className="text-[7px] text-slate-500 truncate max-w-[50px] px-0.5">{att.name}</span></div>)}<button onClick={() => setBugAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={8} className="text-white" /></button></div>); })}</div>}
                                </div>
                                <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
                                    <button onClick={() => setShowBugModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                                    <button disabled={!bugDescription.trim()} onClick={handleConfirmBug}
                                        className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-red-600/20 disabled:shadow-none">
                                        <Bug size={14} /> Confirmar Bug
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Lightbox */}
                <AnimatePresence>
                    {lightboxUrl && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer"
                            onClick={() => setLightboxUrl(null)}>
                            <button onClick={() => setLightboxUrl(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-10">
                                <X size={24} />
                            </button>
                            <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                src={lightboxUrl} alt="Attachment preview"
                                className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
                                onClick={e => e.stopPropagation()} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════
// PROJECT BACKLOG PAGE
// ═══════════════════════════════════════════════════
export default function ProjectBacklogPage() {
    const params = useParams();
    const projectId = params.projectId as string;
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
    const [activePhase, setActivePhase] = useState<TaskStatus>("todo");
    const [activeUser, setActiveUser] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<ApiTask | null>(null);
    const [initialDialogTab, setInitialDialogTab] = useState<"details" | "hours" | "bugs" | "comments" | "history">("details");
    const [tasks, setTasks] = useState<ApiTask[]>([]);
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recentComments, setRecentComments] = useState<(ApiComment & { task: { id: string; title: string } })[]>([]);
    const [feedbackPanelOpen, setFeedbackPanelOpen] = useState(false);
    const { getTimer, toggleTimer } = useWorkTimers();
    const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
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

    const fetchUsers = useCallback(async () => {
        const res = await api<SystemUser[]>(`/api/users`);
        if (res.success && res.data) setAllUsers(res.data);
    }, []);

    const fetchRecentComments = useCallback(async () => {
        const res = await api<any[]>(`/api/dev-projects/${projectId}/recent-comments`);
        if (res.success && res.data) setRecentComments(res.data);
    }, [projectId]);

    useEffect(() => { fetchProject(); fetchUsers(); fetchRecentComments(); }, [fetchProject, fetchUsers, fetchRecentComments]);
    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const handleOpenTaskComment = (taskId: string, commentId: string) => {
        setFeedbackPanelOpen(false);
        router.push(`/dashboard/backlog/${projectId}/${taskId}?chat=open&hl=${commentId}`);
    };

    const columns: { status: TaskStatus; label: string; color: string }[] = [
        { status: "todo", label: "A Fazer", color: "border-t-slate-500" },
        { status: "in_progress", label: "Em Desenvolvimento", color: "border-t-blue-500" },
        { status: "review", label: "Em Revisão", color: "border-t-amber-500" },
        { status: "done", label: "Concluído", color: "border-t-green-500" },
    ];

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Link href="/dashboard/backlog"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors mb-3">
                    <ArrowLeft size={14} /> Voltar aos Projetos
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
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefa na fase ativa..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50" />
                </div>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as TaskPriority | "all")}
                    className="px-3 py-2 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todas prioridades</option>
                    <option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Média</option><option value="low">Baixa</option>
                </select>
                <div className="flex-1" />
                <button
                    onClick={() => router.push(`/dashboard/backlog/${projectId}/new`)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
                >
                    + Tarefa
                </button>
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
                                                                    <div id={`task-card-${task.id}`} key={task.id} onClick={() => router.push(`/dashboard/backlog/${projectId}/${task.id}`)}
                                                                        className="p-6 rounded-2xl bg-slate-900/80 border border-slate-700/40 hover:border-blue-500/40 transition-all cursor-pointer group shadow-md hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 flex flex-col relative overflow-hidden h-full">
                                                                        
                                                                        {task.blocked && <div className="absolute top-0 right-0 w-10 h-10 flex justify-end items-start p-2 bg-red-500/10 rounded-bl-2xl"><AlertTriangle size={16} className="text-red-400 animate-pulse" /></div>}
                                                                        
                                                                        <h4 className="text-base text-white font-bold leading-relaxed group-hover:text-blue-400 transition-colors break-words pr-8 mb-3">{task.title}</h4>
                                                                        
                                                                        {task.story && <p className="text-xs text-slate-400 line-clamp-4 mt-2 italic flex-1 break-words leading-loose">&quot;{task.story}&quot;</p>}
                                                                        
                                                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/80">
                                                                            <span className={`px-3 py-1.5 text-[11px] font-black tracking-widest uppercase rounded flex items-center gap-1.5 bg-slate-900 ${getPriorityColor(task.priority)}`}>
                                                                                {getPriorityLabel(task.priority)}
                                                                            </span>
                                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                                <span className="text-sm font-medium text-slate-400 truncate">{name}</span>
                                                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm shadow-blue-900/50">
                                                                                    {initials}
                                                                                </div>
                                                                            </div>
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

            {/* Task Drawer */}
            <AnimatePresence>
                {selectedTask && (
                    <TaskDetailDrawer 
                        task={selectedTask as any} 
                        initialTab={initialDialogTab}
                        timer={getTimer(selectedTask.id)} 
                        onToggleTimer={() => toggleTimer(selectedTask.id)} 
                        onRefresh={fetchTasks} 
                        allUsers={allUsers} 
                        onClose={() => { setSelectedTask(null); setInitialDialogTab("details"); }} 
                    />
                )}
            </AnimatePresence>

            {/* Floating Feedback Button */}
            {recentComments.length > 0 && (
                <button
                    onClick={() => setFeedbackPanelOpen(true)}
                    className="fixed bottom-8 right-8 z-[60] flex items-center gap-2.5 px-5 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-[0_0_30px_rgba(220,38,38,0.4)] hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] hover:scale-105 active:scale-95"
                >
                    <MessageCircle size={18} />
                    Feedback do Cliente
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-red-600 text-xs font-black animate-pulse">
                        {recentComments.length}
                    </span>
                </button>
            )}

            {/* Side Panel Dashboard */}
            <AnimatePresence>
                {feedbackPanelOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                            onClick={() => setFeedbackPanelOpen(false)} />
                        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[400px] bg-slate-900 border-l border-white/[0.06] shadow-2xl z-[101] flex flex-col">
                            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <MessageCircle size={20} className="text-red-500" /> Feedback Recente
                                </h3>
                                <button onClick={() => setFeedbackPanelOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {Object.values(recentComments.reduce((acc, c) => {
                                    if (!c.task) return acc;
                                    if (!acc[c.task.id]) {
                                        acc[c.task.id] = { task: c.task, comments: [], latestDate: c.createdAt, latestUser: c.user };
                                    }
                                    acc[c.task.id].comments.push(c);
                                    return acc;
                                }, {} as Record<string, { task: any, comments: typeof recentComments, latestDate: string, latestUser: any }>))
                                .sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
                                .map(g => (
                                    <div key={g.task.id} onClick={() => handleOpenTaskComment(g.task.id, g.comments[0].id)}
                                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800 hover:border-red-500/30 cursor-pointer transition-colors group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0 text-white">
                                                    {g.latestUser?.name?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate max-w-[200px]">{g.task.title}</p>
                                                    <p className="text-[10px] text-slate-500">{new Date(g.latestDate).toLocaleString("pt-BR")}</p>
                                                </div>
                                            </div>
                                            <span className="flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-red-600/20 text-red-400 text-[10px] font-black border border-red-500/30">
                                                {g.comments.length}
                                            </span>
                                        </div>
                                        <div className="pl-10">
                                            <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">&quot;{g.comments[0].text}&quot;</p>
                                            <div className="flex -space-x-1 mt-3 pt-3 border-t border-slate-700/50">
                                                {Array.from(new Set(g.comments.map(x => x.user.name))).map(name => (
                                                    <div key={name} title={name} className="w-5 h-5 rounded-full bg-slate-600 border border-slate-800 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                                                        {name.charAt(0)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </div>
    );
}
