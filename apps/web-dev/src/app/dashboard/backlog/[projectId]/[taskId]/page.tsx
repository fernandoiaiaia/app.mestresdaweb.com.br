"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Clock, User, FolderKanban, Tag, CalendarDays,
    AlertTriangle, MessageSquare, Paperclip, History, Send, Play, Square,
    ChevronDown, Bug, Upload, Image, Video, FileText as FileTextIcon, File,
    X, CheckCircle2, ListTodo, Circle, Monitor,
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

function getPriorityColor(p: TaskPriority) {
    const m: Record<TaskPriority, string> = { low: "text-slate-400 bg-slate-500/10 border-slate-500/20", medium: "text-blue-400 bg-blue-500/10 border-blue-500/20", high: "text-amber-400 bg-amber-500/10 border-amber-500/20", critical: "text-red-400 bg-red-500/10 border-red-500/20" };
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
function formatTimer(s: number) {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}
function formatTimerShort(s: number) {
    const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
    if (h > 0) return `${h}h${m.toString().padStart(2, "0")}m`;
    if (m > 0) return `${m}m${sec.toString().padStart(2, "0")}s`;
    return `${sec}s`;
}
// Converts a decimal hours value (e.g. 1.5) to "1h 30m 00s"
function formatHoursDecimal(hours: number) {
    const totalSecs = Math.round(hours * 3600);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0 && m === 0 && s === 0) return `${h}h`;
    if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
    if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
    return `${s}s`;
}

// ── Assignee Picker ──
function AssigneePicker({ currentAssignee, users, onAssign }: { currentAssignee: string; users: SystemUser[]; onAssign?: (userId: string) => void }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(currentAssignee);
    return (
        <div className="relative p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="flex items-center gap-1.5 mb-2"><User size={12} className="text-slate-500" /><span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Responsável</span></div>
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }} className="w-full flex items-center justify-between hover:bg-slate-700/20 rounded-lg px-1 py-0.5 -mx-1 transition-colors">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[11px] font-bold">{selected.charAt(0)}</div>
                    <span className="text-sm text-white font-medium">{selected}</span>
                </div>
                <ChevronDown size={13} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
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

// ── Creatable Combobox ──
function CreatableCombobox({ value, onChange, options, placeholder, className, dropdownWidthClass = "w-full" }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; className?: string; dropdownWidthClass?: string }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    
    const displayOptions = search ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;
    const isExactMatch = options.some(o => o.toLowerCase() === search.toLowerCase());

    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center justify-between text-left transition-colors ${className}`}
            >
                <span className={value ? "text-white" : "text-slate-500"}>{value || placeholder}</span>
                <ChevronDown size={14} className={`text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className={`absolute left-0 top-full mt-2 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl z-40 overflow-hidden flex flex-col ${dropdownWidthClass}`}>
                        
                        {/* Search / Create Input */}
                        <div className="p-2 border-b border-white/[0.06]">
                            <input
                                autoFocus
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar ou adicionar novo..."
                                className="w-full px-3 py-2 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500/50"
                            />
                        </div>

                        {/* Options List */}
                        <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                            {displayOptions.map(opt => (
                                <button key={opt} onClick={() => { onChange(opt); setOpen(false); setSearch(""); }}
                                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-slate-800 focus:bg-slate-800 flex items-center justify-between">
                                    <span className={value === opt ? "text-blue-400 font-medium" : "text-slate-300"}>{opt}</span>
                                    {value === opt && <CheckCircle2 size={14} className="text-blue-500" />}
                                </button>
                            ))}
                            
                            {/* Create new option button */}
                            {search.trim().length > 0 && !isExactMatch && (
                                <button onClick={() => { onChange(search.trim()); setOpen(false); setSearch(""); }}
                                    className="w-full text-left px-4 py-2.5 text-sm text-blue-400 hover:bg-blue-500/10 focus:bg-blue-500/10 transition-colors flex items-center gap-2">
                                    <span className="font-medium">+ Criar "{search.trim()}"</span>
                                </button>
                            )}
                            
                            {displayOptions.length === 0 && search.trim().length === 0 && (
                                <div className="px-4 py-3 text-sm text-slate-500 text-center">Nenhuma opção disponível...</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ══════════════════════════════════════════
// TASK DETAIL PAGE
// ══════════════════════════════════════════
export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const taskId = params.taskId as string;
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";

    const [task, setTask] = useState<ApiTask | null>(null);
    const [loading, setLoading] = useState(true);
    const [allUsers, setAllUsers] = useState<SystemUser[]>([]);
    const [activeTab, setActiveTab] = useState<"tasks" | "details" | "bugs" | "history">("tasks");
    const [togglingTask, setTogglingTask] = useState<string | null>(null);

    // Edit Engine State 
    const [isEditing, setIsEditing] = useState(taskId === "new");
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editEpic, setEditEpic] = useState("");
    const [editPlatform, setEditPlatform] = useState("");
    const [editUser, setEditUser] = useState("");
    const [newFunctionalityTitle, setNewFunctionalityTitle] = useState("");
    const [newFunctionalityHours, setNewFunctionalityHours] = useState("");

    // Checklist (parsed from task.story)
    const [checklist, setChecklist] = useState<{ id: string; title: string; description: string; estimatedHours: number; done: boolean }[]>([]);

    // Comments
    const [comments, setComments] = useState<ApiComment[]>([]);
    const [newComment, setNewComment] = useState("");

    // Time logs
    const [hoursLog, setHoursLog] = useState<ApiTimeLog[]>([]);

    // Timer
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerElapsed, setTimerElapsed] = useState(0);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Ref to avoid stale closure in stopTimer — always holds the latest elapsed seconds
    const timerElapsedRef = useRef(0);

    // Attachments
    const [attachments, setAttachments] = useState<{ id: string; originalName: string; mimeType: string; size: number; createdAt: string }[]>([]);
    const detailsFileRef = useRef<HTMLInputElement>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    // Bugs
    const [bugEntries, setBugEntries] = useState<ApiBug[]>([]);
    const [showBugModal, setShowBugModal] = useState(false);
    const [bugDescription, setBugDescription] = useState("");
    const [bugDeveloper, setBugDeveloper] = useState("");
    const [bugPriority, setBugPriority] = useState<"high" | "critical">("high");
    const [bugCategory, setBugCategory] = useState("functional");
    const [bugAttachments, setBugAttachments] = useState<{ id: string; name: string; size: string; type: string }[]>([]);
    const bugFileRef = useRef<HTMLInputElement>(null);

    // History
    const [historyEntries, setHistoryEntries] = useState<{ id: string; action: string; description: string; createdAt: string; user: { id: string; name: string } }[]>([]);

    // Chat Drawer State
    const searchParams = useSearchParams();
    const initialChatOpen = searchParams.get("chat") === "open";
    const highlightMsgId = searchParams.get("hl");
    const [chatOpen, setChatOpen] = useState(initialChatOpen);
    const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(highlightMsgId);

    // Clear highlight and mark all task comments as read when chat is opened
    useEffect(() => {
        if (chatOpen) {
            api(`/api/dev-projects/tasks/${taskId}/comments/read`, { method: "PATCH" }).catch(console.error);
        }
        
        if (highlightedCommentId) {
            const t = setTimeout(() => setHighlightedCommentId(null), 4000);
            return () => clearTimeout(t);
        }
    }, [highlightedCommentId, chatOpen, taskId]);

    // Edit state
    const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
    const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
    const [projectTasks, setProjectTasks] = useState<ApiTask[]>([]);

    const existingEpics = Array.from(new Set(projectTasks.map(t => t.epic).filter(Boolean))) as string[];
    const existingTitles = Array.from(new Set(projectTasks.map(t => t.title).filter(Boolean)));
    const existingUsers = Array.from(new Set(projectTasks.flatMap(t => t.tags).filter(t => t.startsWith("user:")).map(t => t.replace("user:", ""))));
    const existingPlatforms = Array.from(new Set(projectTasks.flatMap(t => t.tags).filter(t => t.startsWith("platform:")).map(t => t.replace("platform:", ""))));

    const getAttachmentUrl = (attId: string) => `${API_BASE}/api/dev-projects/tasks/${taskId}/attachments/${attId}/download`;

    const fetchTask = useCallback(async () => {
        setLoading(true);
        const res = await api<ApiTask[]>(`/api/dev-projects/tasks/all?projectId=${projectId}`);
        if (res.success && res.data) {
            setProjectTasks(res.data);
            if (taskId === "new") {
                const projectRef = res.data.length > 0 ? res.data[0].project : { id: projectId, name: "Novo", client: "..." };
                const blankTask: ApiTask = {
                    id: "new", projectId, title: "Nova Tela", description: "",
                    status: "todo", priority: "medium", epic: "Novo Módulo", story: "[]",
                    tags: ["user:Usuário Comum", "platform:Web"], blocked: false, estimatedHours: 0, loggedHours: 0,
                    deadline: null, createdAt: new Date().toISOString(),
                    assignee: null, assigneeId: null,
                    project: projectRef
                };
                setTask(blankTask);
                setTaskStatus("todo");
                setTaskPriority("medium");
                setChecklist([]);
                
                setEditTitle(blankTask.title);
                setEditDescription(blankTask.description || "");
                setEditEpic(blankTask.epic || "");
                setEditUser("Usuário Comum");
                setEditPlatform("Web");
                setLoading(false);
                return;
            }

            const found = res.data.find(t => t.id === taskId);
            if (found) {
                setTask(found);
                setTaskStatus(found.status);
                setTaskPriority(found.priority);
                try {
                    if (found.story && found.story.trim().startsWith("[")) {
                        setChecklist(JSON.parse(found.story));
                    } else {
                        setChecklist([]);
                    }
                } catch (e) { setChecklist([]); }

                const uTag = found.tags.find(tag => tag.startsWith("user:"));
                const pTag = found.tags.find(tag => tag.startsWith("platform:"));
                setEditTitle(found.title);
                setEditDescription(found.description || "");
                setEditEpic(found.epic || "");
                setEditUser(uTag ? uTag.replace("user:", "") : "");
                setEditPlatform(pTag ? pTag.replace("platform:", "") : "");
            }
        }
        setLoading(false);
    }, [projectId, taskId]);

    useEffect(() => {
        fetchTask();
        api<SystemUser[]>(`/api/users`).then(r => { if (r.success && r.data) setAllUsers(r.data); });
        
        if (taskId !== "new") {
            api<ApiComment[]>(`/api/dev-projects/tasks/${taskId}/comments`).then(r => { if (r.success && r.data) setComments(r.data); });
            api<ApiTimeLog[]>(`/api/dev-projects/tasks/${taskId}/time-logs`).then(r => { if (r.success && r.data) setHoursLog(r.data); });
            api<ApiBug[]>(`/api/dev-projects/tasks/${taskId}/bugs`).then(r => { if (r.success && r.data) setBugEntries(r.data); });
            api<any[]>(`/api/dev-projects/tasks/${taskId}/attachments`).then(r => { if (r.success && r.data) setAttachments(r.data); });
            api<any[]>(`/api/dev-projects/tasks/${taskId}/history`).then(r => { if (r.success && r.data) setHistoryEntries(r.data); });
        }
    }, [taskId, fetchTask]);

    // Timer
    const startTimer = () => {
        setTimerRunning(true);
        timerIntervalRef.current = setInterval(() => {
            timerElapsedRef.current += 1;
            setTimerElapsed(timerElapsedRef.current);
        }, 1000);
    };
    const stopTimer = () => {
        setTimerRunning(false);
        if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
        const elapsed = timerElapsedRef.current;
        timerElapsedRef.current = 0;
        setTimerElapsed(0);
        if (elapsed > 0) {
            const hours = parseFloat((elapsed / 3600).toFixed(4));
            api(`/api/dev-projects/tasks/${taskId}/time-logs`, { method: "POST", body: { hours, description: "Sessão de trabalho" } }).then(() => {
                fetchTask(); // refresh loggedHours on the task
                api<ApiTimeLog[]>(`/api/dev-projects/tasks/${taskId}/time-logs`).then(r => { if (r.success && r.data) setHoursLog(r.data); });
            });
        }
    };
    useEffect(() => { return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); }; }, []);

    const handleSave = async () => {
        const payloadTags = [];
        if (editUser.trim()) payloadTags.push(`user:${editUser.trim()}`);
        if (editPlatform.trim()) payloadTags.push(`platform:${editPlatform.trim()}`);

        const payload = {
            title: editTitle,
            description: editDescription,
            epic: editEpic,
            tags: payloadTags,
            story: JSON.stringify(checklist),
            status: taskStatus,
            priority: taskPriority
        };

        if (taskId === "new") {
            const res = await api<any>(`/api/dev-projects/${projectId}/tasks`, { method: "POST", body: payload });
            if (res.success && res.data) {
                router.push(`/dashboard/backlog/${projectId}/${res.data.id}`);
            }
        } else {
            await api(`/api/dev-projects/tasks/${taskId}`, { method: "PATCH", body: payload });
            setIsEditing(false);
            fetchTask();
        }
    };

    const handleAssign = async (userId: string) => {
        await api(`/api/dev-projects/tasks/${taskId}`, { method: "PATCH", body: { assigneeId: userId } });
        fetchTask();
    };

    const handleSendComment = async () => {
        if (!newComment.trim()) return;
        const res = await api<ApiComment>(`/api/dev-projects/tasks/${taskId}/comments`, { method: "POST", body: { text: newComment } });
        if (res.success && res.data) { setComments(prev => [...prev, res.data!]); setNewComment(""); }
    };

    const handleDetailsFiles = async (files: FileList | null) => {
        if (!files) return;
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        for (const file of Array.from(files)) {
            const formData = new FormData(); formData.append("file", file);
            try {
                const res = await fetch(`${API_BASE}/api/dev-projects/tasks/${taskId}/attachments`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData });
                const json = await res.json();
                if (json.success && json.data) setAttachments(prev => [...prev, json.data]);
            } catch (err) { console.warn("Upload failed:", err); }
        }
    };

    const handleDeleteAttachment = async (attId: string) => {
        await api(`/api/dev-projects/tasks/${taskId}/attachments/${attId}`, { method: "DELETE" });
        setAttachments(prev => prev.filter(a => a.id !== attId));
    };

    const handleBugFiles = async (files: FileList | null) => {
        if (!files) return;
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        for (const file of Array.from(files)) {
            const formData = new FormData(); formData.append("file", file);
            try {
                const res = await fetch(`${API_BASE}/api/dev-projects/tasks/${taskId}/attachments`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData });
                const json = await res.json();
                if (json.success && json.data) setBugAttachments(prev => [...prev, { id: json.data.id, name: json.data.originalName, size: formatSize(json.data.size), type: json.data.mimeType }]);
            } catch (err) { console.warn("Upload failed:", err); }
        }
    };

    const handleConfirmBug = async () => {
        if (!bugDescription.trim()) return;
        const assignee = developers.find(d => d.name === bugDeveloper);
        const res = await api<ApiBug>(`/api/dev-projects/tasks/${taskId}/bugs`, { method: "POST", body: { description: bugDescription, category: bugCategory, priority: bugPriority, assigneeId: assignee?.id || null, attachmentIds: bugAttachments.map(a => a.id) } });
        if (res.success && res.data) { setBugEntries(prev => [res.data!, ...prev]); setShowBugModal(false); setBugAttachments([]); setActiveTab("bugs"); }
    };

    const markBugFixed = async (bugId: string) => {
        const res = await api<ApiBug>(`/api/dev-projects/tasks/${taskId}/bugs/${bugId}`, { method: "PATCH", body: { status: "fixed" } });
        if (res.success && res.data) setBugEntries(prev => prev.map(b => b.id === bugId ? res.data! : b));
    };

    const formatSize = (bytes: number) => { if (bytes < 1024) return `${bytes} B`; if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1048576).toFixed(1)} MB`; };
    const getFileIcon = (type: string) => { if (type?.startsWith("image/")) return <Image size={14} className="text-blue-400" />; if (type?.startsWith("video/")) return <Video size={14} className="text-purple-400" />; if (type === "application/pdf") return <FileTextIcon size={14} className="text-red-400" />; return <File size={14} className="text-blue-400" />; };

    const developers = allUsers.filter(u => ["DEV", "TECH_LEAD", "GESTOR", "ADMIN"].includes(u.role));
    const BUG_CATEGORIES: Record<string, { label: string; color: string }> = {
        functional: { label: "Funcional", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
        visual: { label: "Visual / UI", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
        performance: { label: "Performance", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
        integration: { label: "Integração", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
        data: { label: "Dados / BD", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
        security: { label: "Segurança", color: "text-red-400 bg-red-500/10 border-red-500/20" },
    };

    const statusColors: Record<TaskStatus, string> = { todo: "bg-slate-500/10 text-slate-400 border-slate-500/20", in_progress: "bg-blue-500/10 text-blue-400 border-blue-500/20", review: "bg-amber-500/10 text-amber-400 border-amber-500/20", done: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
    const totalBugHours = bugEntries.reduce((sum, b) => sum + b.hoursWorked, 0);

    // Screen name: extracted from title
    const screenName = isEditing ? editTitle : (task ? task.title : "");

    // Calculate progression
    const screenDone = checklist.filter(c => c.done).length;
    const screenPct = checklist.length > 0 ? Math.round((screenDone / checklist.length) * 100) : 0;

    const tabs = [
        { key: "tasks" as const, label: `Funcionalidades (${checklist.length})`, icon: Monitor },
        { key: "details" as const, label: "Detalhes", icon: ListTodo },
        { key: "bugs" as const, label: `Bugs (${bugEntries.length})`, icon: Bug },
        { key: "history" as const, label: "Histórico", icon: History },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!task) {
        return (
            <div className="p-8 text-center">
                <ListTodo size={48} className="mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">Tarefa não encontrada.</p>
                <Link href={`/dashboard/backlog/${projectId}`} className="mt-4 inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm">
                    <ArrowLeft size={14} /> Voltar ao backlog
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* ── Top bar ── */}
            <div className="border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
                    <Link
                        href={`/dashboard/backlog/${projectId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                    >
                        <ArrowLeft size={14} /> Voltar ao Backlog
                    </Link>
                    <div className="flex items-center gap-3">
                        {!isEditing && (
                            <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 text-xs font-bold rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-white/[0.06]">
                                Editar
                            </button>
                        )}
                        {!isEditing && (
                            <button onClick={() => setChatOpen(true)} className="px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors border border-white/[0.06] flex items-center gap-1.5">
                                <MessageSquare size={14} className="text-blue-400" />
                                Chat {comments.length > 0 && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded ml-0.5">{comments.length}</span>}
                            </button>
                        )}
                        <button onClick={handleSave} className="px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-lg shadow-blue-600/20">
                            Salvar
                        </button>
                        {task.blocked && (
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse flex items-center gap-1">
                                <AlertTriangle size={10} /> Bloqueada
                            </span>
                        )}
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${statusColors[task.status]}`}>{getStatusLabel(task.status)}</span>
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${getPriorityColor(task.priority)}`}>{getPriorityLabel(task.priority)}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* ── Title ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        {isEditing ? (
                            <CreatableCombobox 
                                value={editEpic} 
                                onChange={(val: string) => setEditEpic(val)} 
                                options={existingEpics} 
                                placeholder="Nome do Épico / Módulo" 
                                className="text-xs text-slate-400 font-bold uppercase tracking-widest bg-transparent border-b border-dashed border-slate-700 focus:border-blue-500 focus:outline-none w-64 pb-0.5 relative z-10" 
                                dropdownWidthClass="w-64"
                            />
                        ) : (
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{task.epic || "Módulo Geral"}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <Monitor size={20} className="text-blue-400" />
                        </div>
                        {isEditing ? (
                            <CreatableCombobox
                                value={editTitle}
                                onChange={(val: string) => setEditTitle(val)}
                                options={existingTitles}
                                placeholder="Título da Tela"
                                className="text-3xl font-bold text-white leading-tight bg-transparent border-b border-dashed border-slate-700 focus:border-blue-500 focus:outline-none w-full max-w-2xl pb-1"
                                dropdownWidthClass="w-full max-w-2xl"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold text-white leading-tight">{screenName}</h1>
                        )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-700 ${screenPct === 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                style={{ width: `${screenPct}%` }} />
                        </div>
                        <span className={`text-sm font-bold shrink-0 ${screenPct === 100 ? "text-emerald-400" : "text-blue-400"}`}>
                            {screenDone}/{checklist.length} · {screenPct}%
                        </span>
                    </div>

                    {/* ── Timer card (inline, always visible) ── */}
                    <div className={`mt-5 flex items-center gap-4 p-4 rounded-xl border transition-all ${timerRunning ? "bg-blue-500/5 border-blue-500/30" : "bg-slate-800/40 border-slate-700/30"}`}>
                        {/* Big clock display */}
                        <div className="flex items-center gap-2 shrink-0">
                            <Clock size={15} className={timerRunning ? "text-blue-400" : "text-slate-500"} />
                            <span className={`font-mono text-xl font-bold tabular-nums ${timerRunning ? "text-blue-400" : "text-white"}`}>
                                {formatTimer(timerElapsed)}
                            </span>
                            {timerRunning && (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-full animate-pulse">
                                    REC
                                </span>
                            )}
                        </div>

                        {/* Start / Stop */}
                        <button
                            onClick={() => timerRunning ? stopTimer() : startTimer()}
                            title={timerRunning ? "Parar cronômetro" : "Iniciar cronômetro"}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                timerRunning
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                    : "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"
                            }`}
                        >
                            {timerRunning
                                ? <><Square size={12} className="fill-red-400" /> Parar</>
                                : <><Play size={12} className="fill-white" /> Iniciar</>
                            }
                        </button>

                        {/* Divider */}
                        <div className="h-8 w-px bg-slate-700/50 shrink-0" />

                        {/* Hours summary */}
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-[9px] font-bold tracking-widest uppercase text-slate-600">Registradas</p>
                                <p className={`text-base font-bold tabular-nums ${task.loggedHours > task.estimatedHours ? "text-red-400" : "text-slate-200"}`}>
                                    {formatHoursDecimal(task.loggedHours)}
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>


                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                    {/* ── Main Content ── */}
                    <div className="space-y-4">
                        {/* Tabs */}
                        <div className="flex gap-1 border-b border-white/[0.06]">
                            {tabs.map(tab => (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2.5 text-xs font-medium flex items-center gap-1.5 border-b-2 transition-all -mb-px ${activeTab === tab.key ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300"}`}>
                                    <tab.icon size={13} /> {tab.label}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {/* TASKS (screen checklist) */}
                            {activeTab === "tasks" && (
                                <motion.div key="tasks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
                                    {checklist.length === 0 && (
                                        <div className="text-center py-16 text-slate-500">
                                            <Monitor size={36} className="mx-auto mb-3 opacity-30" />
                                            <p className="text-sm">Nenhuma funcionalidade vinculada.</p>
                                        </div>
                                    )}
                                    {checklist.map(item => {
                                        return (
                                            <div key={item.id}
                                                className={`flex items-start gap-4 group rounded-xl px-4 py-4 border transition-all ${
                                                    item.done
                                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                                        : "bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50"
                                                }`}
                                            >
                                                {/* Checkbox */}
                                                <button
                                                    title={item.done ? "Marcar como pendente" : "Marcar como concluído"}
                                                    disabled={togglingTask === item.id}
                                                    onClick={async () => {
                                                        setTogglingTask(item.id);
                                                        const newList = checklist.map(c => c.id === item.id ? { ...c, done: !c.done } : c);
                                                        setChecklist(newList);
                                                        
                                                        // Automatically change status of the DevTask to "Em Desenvolvimento" if it was "Todo"
                                                        let newDevTaskStatus = task.status;
                                                        if (task.status === "todo" && !item.done) {
                                                            newDevTaskStatus = "in_progress";
                                                            setTaskStatus("in_progress");
                                                        }
                                                        
                                                        await api(`/api/dev-projects/tasks/${task.id}`, { 
                                                            method: "PATCH", 
                                                            body: { 
                                                                story: JSON.stringify(newList),
                                                                ...(newDevTaskStatus !== task.status && { status: newDevTaskStatus })
                                                            } 
                                                        });
                                                        await fetchTask();
                                                        setTogglingTask(null);
                                                    }}
                                                    className="shrink-0 transition-all mt-0.5"
                                                >
                                                    {togglingTask === item.id
                                                        ? <div className="w-5 h-5 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin" />
                                                        : item.done
                                                        ? <CheckCircle2 size={20} className="text-emerald-400" />
                                                        : <Circle size={20} className="text-slate-600 group-hover:text-slate-400" />
                                                    }
                                                </button>

                                                {/* Meta Info */}
                                                <div className="flex-1 min-w-0 flex flex-col justify-start">
                                                    <div className="flex items-center justify-between gap-3 mb-1.5">
                                                        <p className={`text-sm font-bold transition-colors ${item.done ? "line-through text-slate-500" : "text-white"}`}>
                                                            {item.title}
                                                        </p>
                                                    </div>
                                                    {item.description && (
                                                        <p className={`text-xs leading-relaxed ${item.done ? "text-slate-600" : "text-slate-400"}`}>
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {/* Add Functionality */}
                                    {isEditing && (
                                        <div className="flex items-center gap-3 mt-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 border-dashed">
                                            <input 
                                                value={newFunctionalityTitle} 
                                                onChange={e => setNewFunctionalityTitle(e.target.value)}
                                                placeholder="Nova funcionalidade..."
                                                className="flex-1 px-3 py-2 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-600/50"
                                            />

                                            <button 
                                                onClick={() => {
                                                    if (!newFunctionalityTitle.trim()) return;
                                                    setChecklist([...checklist, {
                                                        id: Math.random().toString(36).substring(2, 11),
                                                        title: newFunctionalityTitle,
                                                        description: "",
                                                        estimatedHours: Number(newFunctionalityHours) || 2,
                                                        done: false
                                                    }]);
                                                    setNewFunctionalityTitle("");
                                                    setNewFunctionalityHours("");
                                                }}
                                                className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 rounded-lg text-sm font-semibold transition-colors border border-blue-500/30 shrink-0"
                                            >
                                                Adicionar
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* DETAILS */}
                            {activeTab === "details" && (
                                <motion.div key="details" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-5">
                                    <div>
                                        <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">Descrição</label>
                                        {isEditing ? (
                                            <textarea
                                                value={editDescription}
                                                onChange={e => setEditDescription(e.target.value)}
                                                placeholder="Adicione uma descrição detalhada..."
                                                rows={5}
                                                className="w-full text-sm text-white leading-relaxed bg-slate-800/80 rounded-xl p-5 border border-blue-500/50 focus:outline-none resize-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 rounded-xl p-5 border border-slate-700/30">{task.description || "Sem descrição."}</p>
                                        )}
                                    </div>
                                    {task.tags.length > 0 && (
                                        <div>
                                            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block flex items-center gap-1"><Tag size={10} /> Tags</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {task.tags.map(tag => <span key={tag} className="px-2.5 py-1 text-[11px] font-medium bg-slate-800/60 border border-slate-700/40 rounded-lg text-slate-300">{tag}</span>)}
                                            </div>
                                        </div>
                                    )}
                                    {/* Attachments */}
                                    <div>
                                        <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block flex items-center gap-1"><Paperclip size={10} /> Anexos</label>
                                        <div onClick={() => detailsFileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleDetailsFiles(e.dataTransfer.files); }}
                                            className="border-2 border-dashed border-white/[0.06] rounded-xl p-6 text-center cursor-pointer hover:border-blue-500/30 transition-all">
                                            <Paperclip size={22} className="mx-auto mb-2 text-slate-600" />
                                            <p className="text-xs text-slate-500">Arraste arquivos ou clique para anexar</p>
                                            <input ref={detailsFileRef} type="file" multiple className="hidden" onChange={e => { handleDetailsFiles(e.target.files); e.target.value = ""; }} />
                                        </div>
                                        {attachments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-3">
                                                {attachments.map(att => {
                                                    const isImg = att.mimeType?.startsWith("image/");
                                                    const url = getAttachmentUrl(att.id);
                                                    return (
                                                        <div key={att.id} className="relative group">
                                                            {isImg
                                                                ? <img src={url} alt={att.originalName} onClick={() => setLightboxUrl(url)} className="w-24 h-24 rounded-xl object-cover border border-slate-700/40 cursor-pointer hover:border-blue-500/40 hover:scale-105 transition-all shadow-md" />
                                                                : <div className="w-24 h-24 rounded-xl bg-slate-800/60 border border-slate-700/40 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-blue-500/40 transition-all" onClick={() => window.open(url, "_blank")}>{getFileIcon(att.mimeType)}<span className="text-[9px] text-slate-500 truncate max-w-[70px] px-1">{att.originalName}</span></div>
                                                            }
                                                            <button onClick={() => handleDeleteAttachment(att.id)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                                                <X size={10} className="text-white" />
                                                            </button>
                                                            <span className="text-[9px] text-slate-600 block text-center mt-1">{formatSize(att.size)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-slate-600 pt-4 border-t border-slate-700/30">
                                        Criada em {new Date(task.createdAt).toLocaleDateString("pt-BR")} · ID: {task.id}
                                    </div>
                                </motion.div>
                            )}

                            {/* BUGS */}
                            {activeTab === "bugs" && (
                                <motion.div key="bugs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                                    <button onClick={() => { setShowBugModal(true); setBugDescription(""); setBugDeveloper(task.assignee?.name || ""); setBugPriority("high"); setBugCategory("functional"); setBugAttachments([]); }}
                                        className="w-full py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-sm font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                                        <Bug size={15} /> Reportar Bug
                                    </button>
                                    {bugEntries.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-center"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Total</p><p className="text-xl font-bold text-red-400 mt-1">{bugEntries.length}</p></div>
                                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Horas</p><p className="text-xl font-bold text-amber-400 mt-1">{totalBugHours.toFixed(1)}h</p></div>
                                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center"><p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Corrigidos</p><p className="text-xl font-bold text-emerald-400 mt-1">{bugEntries.filter(b => b.status === "fixed").length}</p></div>
                                        </div>
                                    )}
                                    {bugEntries.length > 0 ? bugEntries.map(bug => {
                                        const cat = BUG_CATEGORIES[bug.category] || BUG_CATEGORIES.functional;
                                        return (
                                            <div key={bug.id} className={`p-4 rounded-xl border ${bug.status === "fixed" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-900/40 border-slate-700/30"}`}>
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${cat.color}`}>{cat.label}</span>
                                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${bug.priority === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>{bug.priority === "critical" ? "Crítica" : "Alta"}</span>
                                                        {bug.status === "fixed" && <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 size={9} /> Corrigido</span>}
                                                    </div>
                                                    <span className="text-[10px] text-slate-600 shrink-0">{new Date(bug.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                                </div>
                                                <p className="text-sm text-slate-300 mb-3">{bug.description}</p>
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-700/20">
                                                    <span className="text-xs text-slate-500">{bug.reporter.name}{bug.assignee && ` → ${bug.assignee.name}`}</span>
                                                    {bug.status !== "fixed" && <button onClick={() => markBugFixed(bug.id)} className="px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors">Corrigido</button>}
                                                </div>
                                            </div>
                                        );
                                    }) : <div className="text-center py-10 text-slate-500"><Bug size={32} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Nenhum bug reportado</p></div>}
                                </motion.div>
                            )}

                            {/* HISTORY */}
                            {activeTab === "history" && (() => {
                                const actionColors: Record<string, string> = { status_change: "bg-blue-500", comment: "bg-indigo-500", bug_report: "bg-red-500", bug_fixed: "bg-green-500", time_log: "bg-emerald-500", attachment_upload: "bg-amber-500", attachment_delete: "bg-orange-500", assignment: "bg-violet-500", priority_change: "bg-pink-500", description_update: "bg-cyan-500", blocked_change: "bg-yellow-500", task_created: "bg-teal-500" };
                                const actionIcons: Record<string, string> = { status_change: "🔄", comment: "💬", bug_report: "🐛", bug_fixed: "✅", time_log: "⏱️", attachment_upload: "📎", attachment_delete: "🗑️", assignment: "👤", priority_change: "⚡", description_update: "📝", blocked_change: "🚧", task_created: "✨" };
                                const timeline = [...historyEntries.map(e => ({ id: e.id, action: e.action, description: e.description, userName: e.user.name, date: e.createdAt }))];
                                timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                                return (
                                    <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                                        {timeline.length > 0 ? timeline.map(entry => (
                                            <div key={entry.id} className="flex items-start gap-3">
                                                <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${actionColors[entry.action] || "bg-slate-500"}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-slate-300"><span className="mr-1.5">{actionIcons[entry.action] || "📌"}</span>{entry.description}</p>
                                                    <p className="text-[10px] text-slate-600 mt-0.5">{entry.userName} · {new Date(entry.date).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                                                </div>
                                            </div>
                                        )) : <div className="text-center py-10 text-slate-500"><History size={28} className="mx-auto mb-2 opacity-30" /><p className="text-xs">Nenhum registro</p></div>}
                                    </motion.div>
                                );
                            })()}
                        </AnimatePresence>
                    </div>

                    {/* ── Sidebar ── */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
                        {/* Status */}
                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">Status</label>
                            <select value={taskStatus} onChange={e => setTaskStatus(e.target.value as TaskStatus)}
                                className="w-full px-3 py-2.5 bg-slate-800/60 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-600/50">
                                <option value="todo">A Fazer</option>
                                <option value="in_progress">Em Desenvolvimento</option>
                                <option value="review">Em Revisão</option>
                                <option value="done">Concluída</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-2 block">Prioridade</label>
                            <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as TaskPriority)}
                                className="w-full px-3 py-2.5 bg-slate-800/60 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-600/50">
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                                <option value="critical">Crítica</option>
                            </select>
                        </div>

                        {/* Assignee */}
                        <AssigneePicker currentAssignee={task.assignee?.name || "Não atribuído"} users={allUsers} onAssign={handleAssign} />

                        {/* Epic */}
                        {!isEditing && task.epic && (
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                                <div className="flex items-center gap-1.5 mb-2"><FolderKanban size={12} className="text-slate-500" /><span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Épico</span></div>
                                <p className="text-sm text-white font-medium">{task.epic}</p>
                            </div>
                        )}

                        {/* Tags (User and Platform) Edit Mode */}
                        {isEditing && (
                            <div className="p-4 rounded-xl bg-slate-800/80 border border-blue-500/30">
                                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-3 block">Cenário</label>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400 mb-1">Usuário / Persona</p>
                                        <CreatableCombobox
                                            value={editUser}
                                            onChange={(val: string) => setEditUser(val)}
                                            options={existingUsers.length > 0 ? existingUsers : ["Administrador", "Cliente", "Gestor", "Usuário Comum"]}
                                            placeholder="Ex: Gestor, Cliente..."
                                            className="w-full px-3 py-2 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-600/50"
                                            dropdownWidthClass="w-full"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-400 mb-1">Plataforma</p>
                                        <CreatableCombobox
                                            value={editPlatform}
                                            onChange={(val: string) => setEditPlatform(val)}
                                            options={existingPlatforms.length > 0 ? existingPlatforms : ["Web", "App / Mobile", "Backend"]}
                                            placeholder="Ex: Web, App..."
                                            className="w-full px-3 py-2 bg-slate-900/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-blue-600/50"
                                            dropdownWidthClass="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Deadline */}
                        {task.deadline && (
                            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                                <div className="flex items-center gap-1.5 mb-2"><CalendarDays size={12} className="text-slate-500" /><span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Prazo</span></div>
                                <p className="text-sm text-white font-medium">{new Date(task.deadline).toLocaleDateString("pt-BR")}</p>
                            </div>
                        )}

                        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                            <div className="flex items-center gap-1.5 mb-3"><Clock size={12} className="text-slate-500" /><span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">Horas</span></div>
                            <div className="flex items-end justify-between">
                                <div><p className="text-[10px] text-slate-500">Registradas</p><p className={`text-xl font-bold ${task.loggedHours > task.estimatedHours ? "text-red-400" : "text-blue-400"}`}>{task.loggedHours}h</p></div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Bug Report Modal */}
            <AnimatePresence>
                {showBugModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setShowBugModal(false)}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-slate-900 border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
                                <div className="flex items-center gap-2"><Bug size={18} className="text-red-400" /><h3 className="text-lg font-bold text-white">Reportar Bug</h3></div>
                                <button onClick={() => setShowBugModal(false)} title="Fechar" className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15"><p className="text-xs text-red-400">O card <strong className="text-white">&quot;{task?.title}&quot;</strong> voltará para &quot;A Fazer&quot; com registro no histórico.</p></div>
                                <div><label className="text-[11px] text-slate-400 font-medium block mb-1.5">Descrição do Bug</label><textarea value={bugDescription} onChange={e => setBugDescription(e.target.value)} rows={3} placeholder="Descreva o bug..." className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 resize-none" /></div>
                                <div><label className="text-[11px] text-slate-400 font-medium block mb-1.5">Categoria</label><div className="grid grid-cols-3 gap-1.5">{Object.entries(BUG_CATEGORIES).map(([key, cat]) => <button key={key} onClick={() => setBugCategory(key)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${bugCategory === key ? cat.color : "bg-slate-800/50 text-slate-500 border-white/[0.06]"}`}>{cat.label}</button>)}</div></div>
                                <div><label className="text-[11px] text-slate-400 font-medium block mb-1.5">Desenvolvedor</label><select value={bugDeveloper} onChange={e => setBugDeveloper(e.target.value)} className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none">{developers.map(dev => <option key={dev.id} value={dev.name}>{dev.name} ({dev.position || dev.role})</option>)}</select></div>
                                <div><label className="text-[11px] text-slate-400 font-medium block mb-1.5">Prioridade</label><div className="flex gap-2"><button onClick={() => setBugPriority("high")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${bugPriority === "high" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-slate-800/50 text-slate-400 border-white/[0.06]"}`}>Alta</button><button onClick={() => setBugPriority("critical")} className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${bugPriority === "critical" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-slate-800/50 text-slate-400 border-white/[0.06]"}`}>Crítica</button></div></div>
                                <div onClick={() => bugFileRef.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleBugFiles(e.dataTransfer.files); }} className="border-2 border-dashed border-white/[0.06] rounded-lg p-4 text-center cursor-pointer hover:border-red-500/30 transition-all">
                                    <Upload size={20} className="mx-auto mb-1.5 text-slate-600" /><p className="text-xs text-slate-500">Arraste ou clique para anexar</p>
                                    <input ref={bugFileRef} type="file" multiple accept="image/*,video/*,.pdf,.doc,.docx" className="hidden" onChange={e => { handleBugFiles(e.target.files); e.target.value = ""; }} />
                                </div>
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
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md cursor-pointer" onClick={() => setLightboxUrl(null)}>
                        <button onClick={() => setLightboxUrl(null)} title="Fechar" className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-10"><X size={24} /></button>
                        <motion.img initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                            src={lightboxUrl} alt="Attachment preview" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ── Chat Drawer ── */}
            <AnimatePresence>
                {chatOpen && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setChatOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        {/* Drawer */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/[0.06] shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/[0.06] bg-slate-900/80 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <MessageSquare size={18} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Comentários da Tela</h3>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{screenName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setChatOpen(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors">
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Chat History */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {comments.length > 0 ? comments.map(c => {
                                    const isHighlighted = c.id === highlightedCommentId;
                                    return (
                                        <div key={c.id} className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">{c.user.name.charAt(0)}</div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs font-bold text-white">{c.user.name}</span>
                                                    <span className="text-[9px] text-slate-500">{new Date(c.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                                                </div>
                                            </div>
                                            <div className={`ml-8 bg-slate-800/80 border rounded-2xl rounded-tl-sm p-3 inline-block self-start max-w-[90%] transition-colors duration-500 ${isHighlighted ? "border-emerald-500 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/50" : "border-slate-700/50"}`}>
                                                <p className="text-[13px] text-slate-300 leading-relaxed max-w-full break-words whitespace-pre-wrap">{c.text}</p>
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="text-center py-20 text-slate-500">
                                        <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
                                        <p className="text-xs">Nenhuma mensagem registrada.</p>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 bg-slate-900 border-t border-white/[0.06]">
                                <div className="flex gap-2">
                                    <textarea 
                                        value={newComment} 
                                        onChange={e => setNewComment(e.target.value)} 
                                        placeholder="Digite sua mensagem..." 
                                        rows={2}
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }}
                                        className="flex-1 px-4 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-600/50 resize-none shadow-inner" 
                                    />
                                    <button 
                                        onClick={handleSendComment} 
                                        disabled={!newComment.trim()}
                                        title="Enviar mensagem" 
                                        className="w-12 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl text-white transition-colors flex flex-col items-center justify-center shrink-0"
                                    >
                                        <Send size={16} className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
