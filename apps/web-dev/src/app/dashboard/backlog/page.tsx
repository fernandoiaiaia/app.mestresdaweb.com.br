"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ListTodo, Search, GripVertical, X, Clock, User, FolderKanban, Tag, CalendarDays,
    AlertTriangle, MessageSquare, Paperclip, LinkIcon, History, Send, Plus, Play, Square,
    UserPlus, ChevronDown, Bug, Upload, Image, Video, FileText as FileTextIcon, File,
} from "lucide-react";
import { api } from "@/lib/api";

// Types (matching API response)
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "critical";

interface ApiTask {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    epic: string | null;
    story: string | null;
    tags: string[];
    blocked: boolean;
    estimatedHours: number;
    loggedHours: number;
    deadline: string | null;
    createdAt: string;
    assignee: { id: string; name: string; avatar: string | null; position: string | null } | null;
    assigneeId: string | null;
    project: { id: string; name: string; client: string };
}

interface ApiProject {
    id: string;
    name: string;
    client: string;
}

// Compatibility wrapper so the drawer code continues to work
interface MockTask {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee: string;
    estimatedHours: number;
    loggedHours: number;
    epic: string;
    story: string;
    deadline: string;
    tags: string[];
    blocked: boolean;
    createdAt: string;
}

function apiTaskToMock(t: ApiTask): MockTask {
    return {
        id: t.id,
        projectId: t.projectId,
        title: t.title,
        description: t.description || "",
        status: t.status,
        priority: t.priority,
        assignee: t.assignee?.name || "Não atribuído",
        estimatedHours: t.estimatedHours,
        loggedHours: t.loggedHours,
        epic: t.epic || "",
        story: t.story || "",
        deadline: t.deadline || "",
        tags: t.tags,
        blocked: t.blocked,
        createdAt: t.createdAt,
    };
}

function getPriorityColor(priority: TaskPriority) {
    switch (priority) {
        case "low": return "text-slate-400 bg-slate-500/10";
        case "medium": return "text-blue-400 bg-blue-500/10";
        case "high": return "text-amber-400 bg-amber-500/10";
        case "critical": return "text-red-400 bg-red-500/10";
    }
}

function getPriorityLabel(priority: TaskPriority) {
    switch (priority) {
        case "low": return "Baixa";
        case "medium": return "Média";
        case "high": return "Alta";
        case "critical": return "Crítica";
    }
}

function getStatusLabel(status: TaskStatus) {
    switch (status) {
        case "todo": return "A Fazer";
        case "in_progress": return "Em Andamento";
        case "review": return "Em Revisão";
        case "done": return "Concluída";
    }
}

interface SystemUser {
    id: string;
    name: string;
    email: string;
    role: string;
    position?: string | null;
    avatar?: string | null;
}

interface ApiComment {
    id: string;
    text: string;
    createdAt: string;
    user: { id: string; name: string; avatar: string | null };
}

interface ApiTimeLog {
    id: string;
    hours: number;
    description: string | null;
    date: string;
    user: { id: string; name: string };
}

// Mock data removed — all comments, hours, and audit now fetched from API

// ═══════════════════════════════════════════════════
// WORK TIMER HOOK
// ═══════════════════════════════════════════════════
interface TimerState {
    isRunning: boolean;
    elapsed: number;       // seconds accumulated
    startedAt: number | null; // timestamp when current session started
}

function useWorkTimers() {
    const [timers, setTimers] = useState<Record<string, TimerState>>({});
    const intervalsRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

    const getTimer = useCallback((taskId: string): TimerState => {
        return timers[taskId] || { isRunning: false, elapsed: 0, startedAt: null };
    }, [timers]);

    const startTimer = useCallback((taskId: string) => {
        const now = Date.now();
        setTimers(prev => ({
            ...prev,
            [taskId]: { ...prev[taskId] || { elapsed: 0 }, isRunning: true, startedAt: now }
        }));
        // tick every second
        intervalsRef.current[taskId] = setInterval(() => {
            setTimers(prev => {
                const t = prev[taskId];
                if (!t || !t.isRunning || !t.startedAt) return prev;
                return { ...prev, [taskId]: { ...t, elapsed: t.elapsed + 1 } };
            });
        }, 1000);
    }, []);

    const stopTimer = useCallback((taskId: string) => {
        if (intervalsRef.current[taskId]) {
            clearInterval(intervalsRef.current[taskId]);
            delete intervalsRef.current[taskId];
        }
        setTimers(prev => ({
            ...prev,
            [taskId]: { ...prev[taskId], isRunning: false, startedAt: null }
        }));
    }, []);

    const toggleTimer = useCallback((taskId: string) => {
        const t = timers[taskId];
        if (t?.isRunning) {
            stopTimer(taskId);
        } else {
            startTimer(taskId);
        }
    }, [timers, startTimer, stopTimer]);

    // cleanup on unmount
    useEffect(() => {
        const refs = intervalsRef.current;
        return () => { Object.values(refs).forEach(clearInterval); };
    }, []);

    return { getTimer, toggleTimer };
}

function formatTimer(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatTimerShort(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m`;
    if (m > 0) return `${m}m${s.toString().padStart(2, "0")}s`;
    return `${s}s`;
}

// ═══════════════════════════════════════════════════
// ASSIGNEE PICKER
// ═══════════════════════════════════════════════════
function AssigneePicker({ currentAssignee, users, onAssign }: { currentAssignee: string; users: SystemUser[]; onAssign?: (userId: string) => void }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(currentAssignee);

    return (
        <div className="relative p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
            <div className="flex items-center gap-1.5 mb-1">
                <User size={12} className="text-slate-500" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Responsável</span>
            </div>
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="w-full flex items-center justify-between mt-1.5 hover:bg-slate-700/20 rounded-md px-1 py-0.5 -mx-1 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold">
                        {selected.charAt(0)}
                    </div>
                    <span className="text-sm text-white font-medium">{selected}</span>
                </div>
                <ChevronDown size={12} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl shadow-black/40 z-30 overflow-hidden"
                    >
                        <div className="p-1.5 max-h-48 overflow-y-auto">
                            {users.map(user => (
                                <button
                                    key={user.id}
                                    onClick={(e) => { e.stopPropagation(); setSelected(user.name); setOpen(false); onAssign?.(user.id); }}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${selected === user.name ? "bg-blue-500/10 text-blue-400" : "hover:bg-slate-800/60 text-slate-300"
                                        }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium truncate">{user.name}</p>
                                        <p className="text-[10px] text-slate-500">{user.position || user.role}</p>
                                    </div>
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
// TASK DETAIL DRAWER
// ═══════════════════════════════════════════════════
function TaskDetailDrawer({ task, onClose, timer, onToggleTimer, allUsers, onRefresh }: { task: MockTask; onClose: () => void; timer: TimerState; onToggleTimer: () => void; allUsers: SystemUser[]; onRefresh?: () => void }) {
    const [activeTab, setActiveTab] = useState<"details" | "hours" | "bugs" | "comments" | "history">("details");
    const [newComment, setNewComment] = useState("");
    const project = { name: task.epic || "Projeto" };
    const [comments, setComments] = useState<ApiComment[]>([]);
    const [hoursLog, setHoursLog] = useState<ApiTimeLog[]>([]);
    const [taskStatus, setTaskStatus] = useState<TaskStatus>(task.status);
    const [taskPriority, setTaskPriority] = useState<TaskPriority>(task.priority);
    const detailsFileRef = useRef<HTMLInputElement>(null);
    const [taskAttachments, setTaskAttachments] = useState<{ id: string; originalName: string; mimeType: string; size: number; createdAt: string }[]>([]);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
    const getAttachmentUrl = (attId: string) => `${API_BASE}/api/dev-projects/tasks/${task.id}/attachments/${attId}/download`;

    // Fetch real comments, time logs, and attachments
    useEffect(() => {
        api<ApiComment[]>(`/api/dev-projects/tasks/${task.id}/comments`).then(r => { if (r.success && r.data) setComments(r.data); });
        api<ApiTimeLog[]>(`/api/dev-projects/tasks/${task.id}/time-logs`).then(r => { if (r.success && r.data) setHoursLog(r.data); });
        api<any[]>(`/api/dev-projects/tasks/${task.id}/attachments`).then(r => { if (r.success && r.data) setTaskAttachments(r.data); });
    }, [task.id]);

    const uploadFile = async (file: File): Promise<any> => {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE}/api/dev-projects/tasks/${task.id}/attachments`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        const json = await res.json();
        if (json.success && json.data) return json.data;
        console.warn("Upload response:", json);
        return null;
    };

    const handleDetailsFiles = async (files: FileList | null) => {
        if (!files) return;
        for (const file of Array.from(files)) {
            try {
                const data = await uploadFile(file);
                if (data) setTaskAttachments(prev => [...prev, data]);
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

    // Bug Report state
    const [showBugModal, setShowBugModal] = useState(false);
    const [bugDescription, setBugDescription] = useState("");
    const [bugDeveloper, setBugDeveloper] = useState(task.assignee);
    const [bugPriority, setBugPriority] = useState<"high" | "critical">("high");
    const [bugCategory, setBugCategory] = useState("functional");
    const [bugAttachments, setBugAttachments] = useState<{ id: string; name: string; size: string; type: string }[]>([]);
    const bugFileRef = useRef<HTMLInputElement>(null);

    interface BugEntry {
        id: string;
        description: string;
        developer: string;
        originalDeveloper: string;
        priority: string;
        category: string;
        date: string;
        reporter: string;
        attachments: { id: string; name: string; size: string; type: string }[];
        hoursWorked: number;
        timerRunning: boolean;
        timerStart: number | null;
        status: "open" | "fixing" | "fixed";
        taskTitle: string;
        taskEpic: string;
    }

    const [bugEntries, setBugEntries] = useState<BugEntry[]>([]);

    const developers = allUsers.filter(u => ["DEV", "TECH_LEAD", "GESTOR", "ADMIN"].includes(u.role));

    const BUG_CATEGORIES: Record<string, { label: string; color: string }> = {
        functional: { label: "Funcional", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
        visual: { label: "Visual / UI", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
        performance: { label: "Performance", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
        integration: { label: "Integração", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
        data: { label: "Dados / BD", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
        security: { label: "Segurança", color: "text-red-400 bg-red-500/10 border-red-500/20" },
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith("image/")) return <Image size={14} className="text-blue-400" />;
        if (type.startsWith("video/")) return <Video size={14} className="text-purple-400" />;
        if (type === "application/pdf") return <FileTextIcon size={14} className="text-red-400" />;
        return <File size={14} className="text-blue-400" />;
    };

    const handleBugFiles = async (files: FileList | null) => {
        if (!files) return;
        for (const file of Array.from(files)) {
            try {
                const data = await uploadFile(file);
                if (data) setBugAttachments(prev => [...prev, { id: data.id, name: data.originalName, size: formatSize(data.size), type: data.mimeType }]);
            } catch (err) { console.warn("Upload failed:", err); }
        }
    };

    const toggleBugTimer = (bugId: string) => {
        setBugEntries(prev => prev.map(b => {
            if (b.id !== bugId) return b;
            if (b.timerRunning) {
                const elapsed = b.timerStart ? Math.round((Date.now() - b.timerStart) / 1000) : 0;
                return { ...b, timerRunning: false, timerStart: null, hoursWorked: b.hoursWorked + elapsed };
            }
            return { ...b, timerRunning: true, timerStart: Date.now() };
        }));
    };

    const markBugFixed = (bugId: string) => {
        setBugEntries(prev => prev.map(b => b.id === bugId ? { ...b, status: "fixed" as const, timerRunning: false } : b));
    };

    const totalBugHours = bugEntries.reduce((sum, b) => sum + b.hoursWorked, 0);

    const statusColors: Record<TaskStatus, string> = {
        todo: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        done: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };

    const tabs = [
        { key: "details" as const, label: "Detalhes", icon: ListTodo },
        { key: "hours" as const, label: "Horas", icon: Clock },
        { key: "bugs" as const, label: `Bugs (${bugEntries.length})`, icon: Bug },
        { key: "comments" as const, label: `Comentários (${comments.length})`, icon: MessageSquare },
        { key: "history" as const, label: "Histórico", icon: History },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex justify-end"
            onClick={onClose}
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-[640px] bg-slate-900 border-l border-white/[0.06] h-full overflow-hidden flex flex-col shadow-2xl shadow-black/60"
            >
                {/* Header */}
                <div className="shrink-0 px-6 py-4 border-b border-white/[0.06]">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${statusColors[task.status]}`}>
                                    {getStatusLabel(task.status)}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                </span>
                                {task.blocked && (
                                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse flex items-center gap-1">
                                        <AlertTriangle size={10} /> Bloqueada
                                    </span>
                                )}
                            </div>
                            <h2 className="text-lg font-bold text-white leading-tight">{task.title}</h2>
                            <p className="text-xs text-slate-500 mt-1">{project?.name} · {task.epic}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="shrink-0 px-6 border-b border-white/[0.06]">
                    <div className="flex gap-1 -mb-px">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-3 py-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-all ${activeTab === tab.key
                                    ? "border-blue-500 text-blue-400"
                                    : "border-transparent text-slate-500 hover:text-slate-300"
                                    }`}
                            >
                                <tab.icon size={13} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {activeTab === "details" && (
                            <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="p-6 space-y-5">
                                {/* Description */}
                                <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">Descrição</label>
                                    <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
                                        {task.description}
                                    </p>
                                </div>

                                {/* Story */}
                                <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">User Story</label>
                                    <p className="text-sm text-slate-400 italic bg-slate-800/30 rounded-lg p-3 border border-slate-700/20">
                                        &quot;{task.story}&quot;
                                    </p>
                                </div>

                                {/* Info Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <AssigneePicker currentAssignee={task.assignee} users={allUsers} onAssign={handleAssignUser} />
                                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <FolderKanban size={12} className="text-slate-500" />
                                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Épico</span>
                                        </div>
                                        <p className="text-sm text-white font-medium mt-1.5">{task.epic}</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <CalendarDays size={12} className="text-slate-500" />
                                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Prazo</span>
                                        </div>
                                        <p className="text-sm text-white font-medium mt-1.5">{new Date(task.deadline).toLocaleDateString("pt-BR")}</p>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block flex items-center gap-1">
                                        <Tag size={10} /> Tags
                                    </label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {task.tags.map(tag => (
                                            <span key={tag} className="px-2.5 py-1 text-[11px] font-medium bg-slate-800/60 border border-slate-700/40 rounded-lg text-slate-300">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Attachments */}
                                <div>
                                    <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block flex items-center gap-1">
                                        <Paperclip size={10} /> Anexos
                                    </label>
                                    <div onClick={() => detailsFileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleDetailsFiles(e.dataTransfer.files); }}
                                        className="border-2 border-dashed border-white/[0.06] rounded-lg p-4 text-center cursor-pointer hover:border-blue-500/30 transition-all">
                                        <Paperclip size={20} className="mx-auto mb-1.5 text-slate-600" />
                                        <p className="text-xs text-slate-500">Arraste arquivos ou clique para anexar</p>
                                        <input ref={detailsFileRef} type="file" multiple className="hidden" onChange={e => { handleDetailsFiles(e.target.files); e.target.value = ""; }} />
                                    </div>
                                    {(() => {
                                        const bugAttIds = new Set(bugEntries.flatMap(b => b.attachments.map(a => a.id)));
                                        const detailsOnly = taskAttachments.filter(a => !bugAttIds.has(a.id));
                                        return detailsOnly.length > 0 && (
                                        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                                            {detailsOnly.map(att => {
                                                const isImage = att.mimeType?.startsWith("image/");
                                                const url = getAttachmentUrl(att.id);
                                                return (
                                                    <div key={att.id} className="relative group shrink-0">
                                                        {isImage ? (
                                                            <img src={url} alt={att.originalName} onClick={() => setLightboxUrl(url)}
                                                                className="w-20 h-20 rounded-lg object-cover border border-slate-700/40 cursor-pointer hover:border-blue-500/40 hover:scale-105 transition-all shadow-md" />
                                                        ) : (
                                                            <div className="w-20 h-20 rounded-lg bg-slate-800/60 border border-slate-700/40 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-500/40 transition-all"
                                                                onClick={() => window.open(url, "_blank")}>
                                                                <File size={18} className="text-slate-400" />
                                                                <span className="text-[8px] text-slate-500 truncate max-w-[60px] px-1">{att.originalName}</span>
                                                            </div>
                                                        )}
                                                        <button onClick={() => handleDeleteAttachment(att.id)}
                                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                                            <X size={10} className="text-white" />
                                                        </button>
                                                        <span className="text-[8px] text-slate-600 block text-center mt-1 truncate max-w-[80px]">{formatSize(att.size)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        );
                                    })()}
                                </div>

                                {/* Created at */}
                                <div className="text-[11px] text-slate-600 pt-3 border-t border-slate-700/30">
                                    Criada em {new Date(task.createdAt).toLocaleDateString("pt-BR")} · ID: {task.id}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "hours" && (
                            <motion.div key="hours" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="p-6 space-y-4">

                                {/* Live Timer */}
                                <div className={`p-5 rounded-xl border transition-all ${timer.isRunning
                                    ? "bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-500/5"
                                    : "bg-slate-800/40 border-slate-700/30"
                                    }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className={timer.isRunning ? "text-blue-400" : "text-slate-500"} />
                                            <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Cronômetro de Trabalho</span>
                                        </div>
                                        {timer.isRunning && (
                                            <span className="px-2 py-0.5 text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full animate-pulse">Gravando</span>
                                        )}
                                    </div>
                                    <p className={`text-4xl font-bold font-mono text-center my-4 ${timer.isRunning ? "text-blue-400" : "text-white"}`}>
                                        {formatTimer(timer.elapsed)}
                                    </p>
                                    <button
                                        onClick={handleStopTimerAndLog}
                                        className={`w-full py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${timer.isRunning
                                            ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                                            : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                                            }`}
                                    >
                                        {timer.isRunning ? (
                                            <><Square size={14} className="fill-red-400" /> Parar Cronômetro</>
                                        ) : (
                                            <><Play size={14} className="fill-white" /> Iniciar Cronômetro</>
                                        )}
                                    </button>
                                </div>

                                {/* Summary */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center">
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Registradas</p>
                                        <p className={`text-xl font-bold mt-1 ${task.loggedHours > task.estimatedHours ? "text-red-400" : "text-blue-400"}`}>{task.loggedHours}h</p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 text-center">
                                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Sessão Atual</p>
                                        <p className="text-xl font-bold text-blue-400 mt-1">{timer.elapsed > 0 ? formatTimerShort(timer.elapsed) : "—"}</p>
                                    </div>
                                </div>

                                {/* Hours Log */}
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2">Histórico de Lançamentos</p>
                                    <div className="space-y-2">
                                        {hoursLog.length > 0 ? hoursLog.map((entry) => (
                                            <div key={entry.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs text-slate-400">{new Date(entry.date).toLocaleDateString("pt-BR")}</span>
                                                    <span className="text-sm font-bold text-blue-400">{entry.hours}h</span>
                                                </div>
                                                <p className="text-sm text-white">{entry.description || "Sessão de trabalho"}</p>
                                                <p className="text-[11px] text-slate-500 mt-1">{entry.user.name}</p>
                                            </div>
                                        )) : (
                                            <div className="text-center py-6 text-slate-500">
                                                <Clock size={24} className="mx-auto mb-2 opacity-30" />
                                                <p className="text-xs">Nenhum lançamento anterior</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "comments" && (
                            <motion.div key="comments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="flex flex-col h-full">
                                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                                    {comments.length > 0 ? comments.map(comment => (
                                        <div key={comment.id} className="flex items-start gap-3">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                {comment.user.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-white">{comment.user.name}</span>
                                                    <span className="text-[10px] text-slate-600">
                                                        {new Date(comment.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                                                    {comment.text}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 text-slate-500">
                                            <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-xs">Nenhum comentário ainda</p>
                                        </div>
                                    )}
                                </div>
                                {/* Comment Input */}
                                <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] bg-slate-900">
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1 relative">
                                            <textarea
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                placeholder="Escrever comentário..."
                                                rows={2}
                                                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                                                className="w-full px-4 py-3 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/50 resize-none"
                                            />
                                        </div>
                                        <button onClick={handleSendComment} className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors shadow-lg shadow-blue-600/20 shrink-0">
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "bugs" && (
                            <motion.div key="bugs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="p-6 space-y-4">

                                {/* Bug Stats */}
                                {bugEntries.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 text-center">
                                            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Total Bugs</p>
                                            <p className="text-xl font-bold text-red-400 mt-1">{bugEntries.length}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 text-center">
                                            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Horas em Bugs</p>
                                            <p className="text-xl font-bold text-amber-400 mt-1">{(totalBugHours / 3600).toFixed(1)}h</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-center">
                                            <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Corrigidos</p>
                                            <p className="text-xl font-bold text-blue-400 mt-1">{bugEntries.filter(b => b.status === "fixed").length}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Bug List */}
                                {bugEntries.length > 0 ? bugEntries.map(bug => {
                                    const cat = BUG_CATEGORIES[bug.category] || BUG_CATEGORIES.functional;
                                    const bugElapsed = bug.timerRunning && bug.timerStart ? Math.round((Date.now() - bug.timerStart) / 1000) + bug.hoursWorked : bug.hoursWorked;
                                    return (
                                        <div key={bug.id} className={`p-4 rounded-xl border transition-all ${bug.status === "fixed" ? "bg-blue-500/5 border-blue-500/20" :
                                            bug.timerRunning ? "bg-red-500/5 border-red-500/20 shadow-lg shadow-red-500/5" :
                                                "bg-slate-900/40 border-slate-700/30"
                                            }`}>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${cat.color}`}>{cat.label}</span>
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${bug.priority === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                        }`}>{bug.priority === "critical" ? "Crítica" : "Alta"}</span>
                                                    {bug.status === "fixed" && (
                                                        <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">Corrigido</span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-600 shrink-0">{bug.date}</span>
                                            </div>
                                            <p className="text-sm text-slate-300 mb-2">{bug.description}</p>

                                            {/* Traceability */}
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 mb-3">
                                                <span>Desenvolvedor original: <strong className="text-slate-300">{bug.originalDeveloper}</strong></span>
                                                <span>Correção: <strong className="text-white">{bug.developer}</strong></span>
                                                <span>Reportado por: <strong className="text-slate-300">{bug.reporter}</strong></span>
                                            </div>

                                            {/* Attachments */}
                                            {bug.attachments.length > 0 && (
                                                <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
                                                    {bug.attachments.map((att, ai) => {
                                                        const isImage = att.type?.startsWith("image/");
                                                        const url = att.id ? getAttachmentUrl(att.id) : "";
                                                        return (
                                                            <div key={ai} className="relative group shrink-0">
                                                                {isImage && url ? (
                                                                    <img src={url} alt={att.name} onClick={() => setLightboxUrl(url)}
                                                                        className="w-16 h-16 rounded-lg object-cover border border-slate-700/40 cursor-pointer hover:border-red-500/40 hover:scale-105 transition-all shadow-md" />
                                                                ) : (
                                                                    <div className="w-16 h-16 rounded-lg bg-slate-800/60 border border-slate-700/40 flex flex-col items-center justify-center gap-0.5"
                                                                        onClick={() => url && window.open(url, "_blank")}>
                                                                        {getFileIcon(att.type)}
                                                                        <span className="text-[7px] text-slate-500 truncate max-w-[50px] px-0.5">{att.name}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Timer + Actions */}
                                            <div className="flex items-center justify-between pt-2 border-t border-slate-700/20">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-mono font-bold text-white">{formatTimerShort(bugElapsed)}</span>
                                                    {bug.status !== "fixed" && (
                                                        <button onClick={() => toggleBugTimer(bug.id)}
                                                            className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${bug.timerRunning
                                                                ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                                                                : "bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25"
                                                                }`}>
                                                            {bug.timerRunning ? <Square size={12} className="fill-red-400" /> : <Play size={12} className="fill-green-400" />}
                                                        </button>
                                                    )}
                                                </div>
                                                {bug.status !== "fixed" && (
                                                    <button onClick={() => markBugFixed(bug.id)}
                                                        className="px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">
                                                        Marcar como Corrigido
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="flex flex-col items-center py-10 text-center">
                                        <Bug size={28} className="text-slate-600 mb-3" />
                                        <p className="text-sm text-slate-400 font-medium">Nenhum bug reportado</p>
                                        <p className="text-xs text-slate-600 mt-1">Use o botão "Reportar Bug" no rodapé</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === "history" && (
                            <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                className="p-6 space-y-3">

                                {/* Bug History Entries */}
                                {bugEntries.map((bug, i) => (
                                    <div key={`bug-${i}`} className="flex items-start gap-3">
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                        <div>
                                            <p className="text-sm text-red-400 font-medium flex items-center gap-1.5">
                                                <Bug size={12} /> Bug reportado — {BUG_CATEGORIES[bug.category]?.label} — Prioridade {bug.priority === "critical" ? "Crítica" : "Alta"}
                                                {bug.status === "fixed" && <span className="text-blue-400 text-[9px] ml-1">(Corrigido)</span>}
                                            </p>
                                            <p className="text-xs text-slate-300 mt-1">{bug.description}</p>
                                            <p className="text-[11px] text-slate-500 mt-1">
                                                Dev original: <strong className="text-slate-300">{bug.originalDeveloper}</strong> → Correção: <strong className="text-white">{bug.developer}</strong> · Fase: <strong className="text-amber-400">A Fazer</strong>
                                            </p>
                                            {bug.attachments.length > 0 && (
                                                <p className="text-[10px] text-slate-600 mt-0.5">{bug.attachments.length} anexo(s)</p>
                                            )}
                                            <p className="text-[10px] text-slate-600 mt-0.5">{bug.reporter} · {bug.date}{bug.hoursWorked > 0 ? ` · ${formatTimerShort(bug.hoursWorked)} trabalhadas` : ""}</p>
                                        </div>
                                    </div>
                                ))}

                                {/* Existing Audit Entries */}
                                {/* Audit trail from time logs */}
                                {hoursLog.map((log) => (
                                    <div key={log.id} className="flex items-start gap-3">
                                        <div className="mt-1.5 w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                        <div>
                                            <p className="text-sm text-slate-300">{log.hours}h registradas — {log.description || "Sessão de trabalho"}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {log.user.name} · {new Date(log.date).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="shrink-0 px-6 py-4 border-t border-white/[0.06] flex items-center justify-between bg-slate-900">
                    <div className="flex gap-2">
                        <select value={taskStatus} onChange={e => setTaskStatus(e.target.value as TaskStatus)}
                            className="px-3 py-2 bg-slate-800/60 border border-white/[0.06] rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-blue-600/50">
                            <option value="todo">A Fazer</option>
                            <option value="in_progress">Em Desenvolvimento</option>
                            <option value="review">Em Revisão</option>
                            <option value="done">Concluída</option>
                        </select>
                        <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as TaskPriority)}
                            className="px-3 py-2 bg-slate-800/60 border border-white/[0.06] rounded-lg text-xs font-medium text-slate-300 focus:outline-none focus:border-blue-600/50">
                            <option value="low">Baixa</option>
                            <option value="medium">Média</option>
                            <option value="high">Alta</option>
                            <option value="critical">Crítica</option>
                        </select>
                        <button onClick={() => { setShowBugModal(true); setBugDescription(""); setBugDeveloper(task.assignee); setBugPriority("high"); setBugCategory("functional"); setBugAttachments([]); }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold hover:bg-red-500/20 transition-colors">
                            <Bug size={13} /> Reportar Bug
                        </button>
                    </div>
                    <button onClick={handleSaveTask} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-blue-600/20">
                        Salvar Alterações
                    </button>
                </div>

                {/* Bug Report Modal */}
                <AnimatePresence>
                    {showBugModal && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 flex items-center justify-center p-6"
                            onClick={() => setShowBugModal(false)}
                        >
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-md bg-slate-900 border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bug size={18} className="text-red-400" />
                                        <h3 className="text-lg font-bold text-white">Reportar Bug</h3>
                                    </div>
                                    <button onClick={() => setShowBugModal(false)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                                        <p className="text-xs text-red-400 leading-relaxed">
                                            O card <strong className="text-white">"{task.title}"</strong> voltará para a fase <strong className="text-white">"A Fazer"</strong> com registro completo no histórico e aba de Bugs.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1.5">Descrição do Bug</label>
                                        <textarea value={bugDescription} onChange={e => setBugDescription(e.target.value)} rows={3}
                                            placeholder="Descreva o bug encontrado..."
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 resize-none" />
                                    </div>

                                    {/* Bug Category */}
                                    <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1.5">Categoria do Bug</label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            {Object.entries(BUG_CATEGORIES).map(([key, cat]) => (
                                                <button key={key} onClick={() => setBugCategory(key)}
                                                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${bugCategory === key ? cat.color : "bg-slate-800/50 text-slate-500 border-white/[0.06] hover:border-slate-600"}`}>
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1.5">Desenvolvedor Responsável pela Correção</label>
                                        <select value={bugDeveloper} onChange={e => setBugDeveloper(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-600/50">
                                            {developers.map(dev => (
                                                <option key={dev.id} value={dev.name}>{dev.name} ({dev.position || dev.role})</option>
                                            ))}
                                        </select>
                                        <p className="text-[9px] text-slate-600 mt-1">Desenvolvedor original: <strong className="text-slate-400">{task.assignee}</strong></p>
                                    </div>

                                    <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1.5">Prioridade do Bug</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => setBugPriority("high")}
                                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${bugPriority === "high"
                                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                                    : "bg-slate-800/50 text-slate-400 border-white/[0.06] hover:border-amber-500/20"
                                                    }`}>
                                                Alta
                                            </button>
                                            <button onClick={() => setBugPriority("critical")}
                                                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${bugPriority === "critical"
                                                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                                                    : "bg-slate-800/50 text-slate-400 border-white/[0.06] hover:border-red-500/20"
                                                    }`}>
                                                Crítica
                                            </button>
                                        </div>
                                    </div>

                                    {/* File Upload */}
                                    <div>
                                        <label className="text-[11px] text-slate-400 font-medium block mb-1.5">Anexos (Imagens, Vídeos, PDF, Word)</label>
                                        <div
                                            onClick={() => bugFileRef.current?.click()}
                                            onDragOver={e => e.preventDefault()}
                                            onDrop={e => { e.preventDefault(); handleBugFiles(e.dataTransfer.files); }}
                                            className="border-2 border-dashed border-white/[0.06] rounded-lg p-4 text-center cursor-pointer hover:border-red-500/30 hover:bg-red-500/5 transition-all">
                                            <Upload size={20} className="mx-auto mb-1.5 text-slate-600" />
                                            <p className="text-xs text-slate-500">Arraste ou clique para anexar arquivos</p>
                                            <p className="text-[9px] text-slate-600 mt-0.5">PNG, JPG, MP4, PDF, DOCX</p>
                                            <input ref={bugFileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden"
                                                onChange={e => { handleBugFiles(e.target.files); e.target.value = ""; }} />
                                        </div>
                                        {bugAttachments.length > 0 && (
                                            <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
                                                {bugAttachments.map((att, i) => {
                                                    const isImage = att.type?.startsWith("image/");
                                                    const url = getAttachmentUrl(att.id);
                                                    return (
                                                        <div key={att.id} className="relative group shrink-0">
                                                            {isImage ? (
                                                                <img src={url} alt={att.name} onClick={() => setLightboxUrl(url)}
                                                                    className="w-16 h-16 rounded-lg object-cover border border-slate-700/40 cursor-pointer hover:border-red-500/40 hover:scale-105 transition-all" />
                                                            ) : (
                                                                <div className="w-16 h-16 rounded-lg bg-slate-800/60 border border-slate-700/40 flex flex-col items-center justify-center gap-0.5">
                                                                    {getFileIcon(att.type)}
                                                                    <span className="text-[7px] text-slate-500 truncate max-w-[50px] px-0.5">{att.name}</span>
                                                                </div>
                                                            )}
                                                            <button onClick={() => setBugAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X size={8} className="text-white" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-end gap-3">
                                    <button onClick={() => setShowBugModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                                    <button
                                        disabled={!bugDescription.trim()}
                                        onClick={() => {
                                            const newBug: BugEntry = {
                                                id: `bug-${Date.now()}`,
                                                description: bugDescription,
                                                developer: bugDeveloper,
                                                originalDeveloper: task.assignee,
                                                priority: bugPriority,
                                                category: bugCategory,
                                                date: new Date().toLocaleString("pt-BR"),
                                                reporter: "Gestor",
                                                attachments: [...bugAttachments],
                                                hoursWorked: 0,
                                                timerRunning: false,
                                                timerStart: null,
                                                status: "open",
                                                taskTitle: task.title,
                                                taskEpic: task.epic,
                                            };
                                            setBugEntries(prev => [newBug, ...prev]);
                                            setShowBugModal(false);
                                            setBugAttachments([]);
                                            setActiveTab("bugs");
                                        }}
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
// BACKLOG PAGE — Project Cards Gateway
// ═══════════════════════════════════════════════════

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";

const HEALTH_COLORS: Record<string, string> = {
    on_track: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    at_risk: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    delayed: "text-red-400 bg-red-500/10 border-red-500/20",
};
const HEALTH_LABELS: Record<string, string> = { on_track: "No Prazo", at_risk: "Em Risco", delayed: "Atrasado" };

const STATUS_BAR_DEF: { key: TaskStatus; label: string; color: string; bar: string }[] = [
    { key: "todo", label: "A Fazer", color: "text-slate-400", bar: "bg-slate-500" },
    { key: "in_progress", label: "Em Desenvolvimento", color: "text-blue-400", bar: "bg-blue-500" },
    { key: "review", label: "Em Revisão", color: "text-amber-400", bar: "bg-amber-500" },
    { key: "done", label: "Concluído", color: "text-blue-400", bar: "bg-green-500" },
];

export default function BacklogPage() {
    const [projectSearch, setProjectSearch] = useState("");
    const [allTasks, setAllTasks] = useState<ApiTask[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [allUsers, setAllUsers] = useState<SystemUser[]>([]);

    const fetchAllTasks = useCallback(async () => {
        const res = await api<ApiTask[]>(`/api/dev-projects/tasks/all`);
        if (res.success && res.data) setAllTasks(res.data);
    }, []);

    const fetchProjects = useCallback(async () => {
        setLoadingProjects(true);
        const res = await api<any[]>(`/api/dev-projects?archived=false`);
        if (res.success && res.data) setProjects(res.data);
        setLoadingProjects(false);
    }, []);

    const fetchUsers = useCallback(async () => {
        const res = await api<SystemUser[]>(`/api/users`);
        if (res.success && res.data) setAllUsers(res.data);
    }, []);

    useEffect(() => { fetchProjects(); fetchAllTasks(); fetchUsers(); }, [fetchProjects, fetchAllTasks, fetchUsers]);

    const filteredProjects = projects.filter(p =>
        !projectSearch || p.name?.toLowerCase().includes(projectSearch.toLowerCase()) || p.client?.toLowerCase().includes(projectSearch.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Backlog & Board</h1>
                <p className="text-slate-400 mt-1">Selecione um projeto para acessar seu backlog e kanban.</p>
            </motion.div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    value={projectSearch}
                    onChange={e => setProjectSearch(e.target.value)}
                    placeholder="Buscar projeto ou cliente..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50"
                />
            </div>

            {/* Loading */}
            {loadingProjects && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Project Cards */}
            {!loadingProjects && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {filteredProjects.map((project, i) => {
                        const pTasks = allTasks.filter(t => t.projectId === project.id);
                        const total = pTasks.length;
                        const byStatus = {
                            todo: pTasks.filter(t => t.status === "todo").length,
                            in_progress: pTasks.filter(t => t.status === "in_progress").length,
                            review: pTasks.filter(t => t.status === "review").length,
                            done: pTasks.filter(t => t.status === "done").length,
                        };
                        const donePct = total > 0 ? Math.round((byStatus.done / total) * 100) : 0;

                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link href={`/dashboard/backlog/${project.id}`}>
                                    <div className="group p-6 rounded-2xl bg-slate-800/40 border border-white/[0.06] hover:border-blue-500/25 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-5">
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600/20 to-emerald-500/10 border border-blue-600/20 flex items-center justify-center">
                                                    <FolderKanban size={22} className="text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                                                        {project.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <Building2 size={12} className="text-slate-500" />
                                                        <span className="text-sm text-slate-400">{project.client}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${HEALTH_COLORS[project.health] || HEALTH_COLORS.on_track}`}>
                                                    {HEALTH_LABELS[project.health] || "No Prazo"}
                                                </span>
                                                <ChevronRight size={20} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </div>

                                        {total > 0 ? (
                                            <>
                                                {/* KPI Cards Grid */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
                                                    {STATUS_BAR_DEF.map(s => {
                                                        const pct = total > 0 ? Math.round((byStatus[s.key] / total) * 100) : 0;
                                                        const bgMap: Record<string, string> = {
                                                            "bg-slate-500": "bg-slate-500/8 border-slate-500/15",
                                                            "bg-blue-500": "bg-blue-500/8 border-blue-500/15",
                                                            "bg-amber-500": "bg-amber-500/8 border-amber-500/15",
                                                            "bg-green-500": "bg-green-500/8 border-blue-500/15",
                                                        };
                                                        return (
                                                            <div key={s.key} className={`p-3 rounded-xl border ${bgMap[s.bar] || "bg-slate-800/40 border-slate-700/30"} text-center`}>
                                                                <p className={`text-2xl font-extrabold ${s.color}`}>{pct}%</p>
                                                                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-tight">{s.label}</p>
                                                                <p className={`text-xs font-bold mt-0.5 ${s.color}`}>{byStatus[s.key]}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-500">{total} tarefas totais</span>
                                                        <span className="text-xs font-bold text-blue-400">{donePct}% concluído</span>
                                                    </div>
                                                    <div className="h-3 rounded-full bg-slate-700/40 overflow-hidden flex">
                                                        {STATUS_BAR_DEF.map(s => {
                                                            const pct = (byStatus[s.key] / total) * 100;
                                                            return pct > 0 ? (
                                                                <div key={s.key} className={`${s.bar} h-full transition-all`} style={{ width: `${pct}%` }} />
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-6 border border-dashed border-slate-700/40 rounded-xl">
                                                <ListTodo size={24} className="mx-auto mb-2 text-slate-600" />
                                                <p className="text-xs text-slate-500">Nenhuma tarefa criada</p>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {!loadingProjects && filteredProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mb-4">
                        <ListTodo size={28} className="text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Nenhum projeto encontrado</h3>
                    <p className="text-sm text-slate-500">{projects.length === 0 ? "Nenhum projeto ativo." : "Tente outro termo de busca."}</p>
                </div>
            )}
        </div>
    );
}

