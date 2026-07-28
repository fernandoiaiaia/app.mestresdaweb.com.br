"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths,
    isBefore,
    startOfDay,
    parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Plus,
    CheckSquare,
    Clock,
    User,
    Building2,
    Trash2,
    Edit3,
    X,
} from "lucide-react";

interface Client {
    id: string;
    name: string;
    company: string | null;
}

interface Task {
    id: string;
    title: string;
    description: string | null;
    touchPoint: string | null;
    date: string;
    status: "pending" | "completed";
    client: Client | null;
}

export default function TasksPage() {
    const { toast, confirm: showConfirm } = useToast();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Modal states
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDesc, setNewTaskDesc] = useState("");
    const [newTaskTime, setNewTaskTime] = useState("09:00");
    const [newTaskTouchPoint, setNewTaskTouchPoint] = useState("");
    const [newTaskClientId, setNewTaskClientId] = useState<string | null>(null);
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [clientSearch, setClientSearch] = useState("");
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch tasks for the current view
    const loadTasks = async () => {
        setIsLoading(true);
        try {
            // Fetch for a slightly wider range than the month to cover the grid
            const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
            const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });

            const res = await api<Task[]>(`/api/tasks?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
            if (res.success && res.data) {
                setTasks(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [currentMonth]);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // Calendar Grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const tasksForSelectedDay = tasks.filter((t) => isSameDay(parseISO(t.date), selectedDate)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const isOverdue = (taskDateStr: string, status: string) => {
        if (status === "completed") return false;
        const taskDate = parseISO(taskDateStr);
        return isBefore(taskDate, new Date());
    };

    const toggleTaskStatus = async (task: Task) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";
        // Optimistic
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
        try {
            await api(`/api/tasks/${task.id}`, {
                method: "PUT",
                body: { status: newStatus }
            });
        } catch (e) {
            // Revert
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
        }
    };

    const handleDeleteTask = async (id: string) => {
        const confirmed = await showConfirm({ title: "Excluir tarefa?", description: "Tem certeza que deseja excluir esta tarefa?", confirmLabel: "Excluir", variant: "danger" });
        if (!confirmed) return;
        setTasks(prev => prev.filter(t => t.id !== id));
        try {
            await api(`/api/tasks/${id}`, { method: "DELETE" });
        } catch (e) {
            loadTasks();
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Combine selectedDate with time — use local date parts to avoid UTC shift
            const [hours, minutes] = newTaskTime.split(':').map(Number);
            const taskDateTime = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), hours, minutes, 0, 0);

            const res = await api<Task>("/api/tasks", {
                method: "POST",
                body: {
                    title: newTaskTitle,
                    description: newTaskDesc,
                    touchPoint: newTaskTouchPoint || undefined,
                    clientId: newTaskClientId || undefined,
                    date: taskDateTime.toISOString()
                }
            });

            if (res.success && res.data) {
                setTasks([...tasks, res.data]);
                setIsModalOpen(false);
                setNewTaskTitle("");
                setNewTaskDesc("");
                setNewTaskTime("09:00");
                setNewTaskTouchPoint("");
                setNewTaskClientId(null);
                setClientSearch("");
            }
        } catch (error) {
            console.error("Erro ao criar tarefa", error);
            toast.error("Erro ao salvar tarefa");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto h-[calc(100vh-theme(spacing.20))] flex flex-col">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex-shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <CheckSquare size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Tarefas & Agenda</h1>
                            <p className="text-sm text-slate-400">Gerencie seus compromissos e follow-ups</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Plus size={16} /> Nova Tarefa
                    </button>
                </div>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                {/* Left: Calendar */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-[400px] flex-shrink-0 flex flex-col bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden p-5">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="relative flex items-center bg-slate-800 hover:bg-slate-700 border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors">
                                <select
                                    value={currentMonth.getMonth()}
                                    onChange={(e) => {
                                        const newDate = new Date(currentMonth);
                                        newDate.setMonth(parseInt(e.target.value));
                                        setCurrentMonth(newDate);
                                    }}
                                    className="bg-transparent text-sm font-bold text-white capitalize focus:outline-none cursor-pointer appearance-none pr-6 w-full"
                                >
                                    {Array.from({ length: 12 }).map((_, i) => (
                                        <option key={i} value={i} className="text-slate-900 capitalize">
                                            {format(new Date(2024, i, 1), "MMMM", { locale: ptBR })}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="text-slate-400 absolute right-2 pointer-events-none" />
                            </div>

                            <div className="relative flex items-center bg-slate-800 hover:bg-slate-700 border border-white/[0.06] rounded-lg px-3 py-1.5 transition-colors">
                                <select
                                    value={currentMonth.getFullYear()}
                                    onChange={(e) => {
                                        const newDate = new Date(currentMonth);
                                        newDate.setFullYear(parseInt(e.target.value));
                                        setCurrentMonth(newDate);
                                    }}
                                    className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer appearance-none pr-6 w-full"
                                >
                                    {Array.from({ length: 21 }).map((_, i) => {
                                        const year = new Date().getFullYear() - 10 + i;
                                        return (
                                            <option key={year} value={year} className="text-slate-900">
                                                {year}
                                            </option>
                                        );
                                    })}
                                </select>
                                <ChevronDown size={14} className="text-slate-400 absolute right-2 pointer-events-none" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={prevMonth} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                                <ChevronLeft size={16} />
                            </button>
                            <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors">
                                Hoje
                            </button>
                            <button onClick={nextMonth} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                            <div key={d} className="py-2">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 flex-1">
                        {days.map((day, i) => {
                            const formattedDate = format(day, dateFormat);
                            const cloneDay = day;
                            const isSelected = isSameDay(day, selectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isTodayDate = isToday(day);

                            // Check for tasks on this day
                            const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), day));
                            const hasPending = dayTasks.some(t => t.status === "pending");
                            const hasOverdue = dayTasks.some(t => isOverdue(t.date, t.status));

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(cloneDay)}
                                    className={`
                                        relative rounded-xl flex items-center justify-center text-sm font-medium transition-all h-[52px]
                                        ${!isCurrentMonth ? "text-slate-600 hover:bg-slate-800/30" : "text-slate-300 hover:bg-slate-800"}
                                        ${isSelected ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold" : "border border-transparent"}
                                        ${isTodayDate && !isSelected ? "bg-slate-700 text-white" : ""}
                                    `}
                                >
                                    <span>{formattedDate}</span>
                                    {dayTasks.length > 0 && (
                                        <div className="absolute bottom-1.5 flex gap-0.5 mt-1 justify-center w-full">
                                            {hasOverdue ? (
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            ) : hasPending ? (
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                            ) : (
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                            )}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Right: Daily Tasks */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden min-h-0">
                    <div className="p-6 border-b border-white/[0.04] flex items-center justify-between shadow-sm bg-slate-900/20">
                        <div>
                            <h2 className="text-xl font-bold text-white capitalize">
                                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </h2>
                            <p className="text-sm text-slate-400 mt-1">
                                {tasksForSelectedDay.length} {tasksForSelectedDay.length === 1 ? 'tarefa agendada' : 'tarefas agendadas'}
                            </p>
                        </div>
                        <CalendarIcon size={24} className="text-slate-500 opacity-20" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                        {isLoading && tasksForSelectedDay.length === 0 ? (
                            <div className="flex items-center justify-center h-40">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : tasksForSelectedDay.length === 0 ? (
                            <div className="text-center py-16 px-4 bg-slate-800/30 rounded-xl border border-white/[0.04] border-dashed">
                                <CheckSquare size={32} className="mx-auto mb-3 text-slate-600" />
                                <h3 className="text-base font-bold text-white mb-1">Dia Livre</h3>
                                <p className="text-sm text-slate-400">Nenhuma tarefa agendada para este dia.</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white rounded-lg transition-colors border border-white/5"
                                >
                                    Agendar Tarefa
                                </button>
                            </div>
                        ) : (
                            tasksForSelectedDay.map((task) => {
                                const isTaskOverdue = isOverdue(task.date, task.status);
                                const isCompleted = task.status === "completed";

                                return (
                                    <div
                                        key={task.id}
                                        className={`p-4 rounded-xl border transition-all flex gap-4 ${isCompleted
                                            ? "bg-slate-800/20 border-white/[0.02] opacity-60"
                                            : isTaskOverdue
                                                ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                                                : "bg-slate-800/60 border-white/[0.06] hover:border-white/10"
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleTaskStatus(task)}
                                            className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border ${isCompleted
                                                ? "bg-blue-500 border-blue-500 text-white"
                                                : isTaskOverdue
                                                    ? "border-red-400/50 hover:bg-red-500/20"
                                                    : "border-slate-500 hover:border-blue-400 hover:bg-blue-500/10"
                                                }`}
                                        >
                                            {isCompleted && <CheckSquare size={12} className="fill-current text-white" />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className={`text-base font-bold truncate ${isCompleted ? "text-slate-400 line-through" : isTaskOverdue ? "text-red-400" : "text-white"}`}>
                                                    {task.title}
                                                </h3>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${isCompleted ? "bg-slate-800 text-slate-500" : isTaskOverdue ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-slate-300"
                                                        }`}>
                                                        <Clock size={10} />
                                                        {format(parseISO(task.date), "HH:mm")}
                                                    </span>
                                                    <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {task.description && (
                                                <p className="text-sm text-slate-400 mb-2 line-clamp-2">{task.description}</p>
                                            )}

                                            {task.touchPoint && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-bold mb-2">
                                                    {task.touchPoint}
                                                </span>
                                            )}

                                            {task.client && (
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-900/50 border border-white/[0.04] rounded-md mt-1 cursor-pointer hover:bg-slate-800 transition-colors">
                                                    <User size={12} className="text-blue-400" />
                                                    <span className="text-[11px] font-medium text-slate-300 truncate max-w-[150px]">{task.client.name}</span>
                                                    {task.client.company && (
                                                        <>
                                                            <span className="text-[11px] text-slate-600">•</span>
                                                            <Building2 size={10} className="text-slate-500" />
                                                            <span className="text-[11px] text-slate-400 truncate max-w-[100px]">{task.client.company}</span>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Modal de Criação */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10 shadow-xl overflow-hidden">
                            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Plus size={18} className="text-blue-500" />
                                    Nova Tarefa para {format(selectedDate, "dd/MM")}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white p-1 rounded-lg transition-colors">
                                    <X size={16} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Título <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        placeholder="Ex: Ligar para confirmar proposta"
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Horário <span className="text-red-500">*</span></label>
                                        <input
                                            type="time"
                                            required
                                            value={newTaskTime}
                                            onChange={e => setNewTaskTime(e.target.value)}
                                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Cliente (Opcional)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Buscar cliente..."
                                                value={clientSearch}
                                                onChange={e => { setClientSearch(e.target.value); setShowClientDropdown(true); }}
                                                onFocus={async () => {
                                                    setShowClientDropdown(true);
                                                    if (allClients.length === 0) {
                                                        const res = await api<Client[]>('/api/clients');
                                                        if (res.success && res.data) setAllClients(res.data);
                                                    }
                                                }}
                                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            />
                                            {showClientDropdown && (
                                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                                                    {allClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(c => (
                                                        <button
                                                            type="button"
                                                            key={c.id}
                                                            onClick={() => {
                                                                setNewTaskClientId(c.id);
                                                                setClientSearch(c.name);
                                                                setShowClientDropdown(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors ${newTaskClientId === c.id ? 'text-blue-400 bg-blue-500/10' : 'text-white'
                                                                }`}
                                                        >
                                                            {c.name} {c.company && <span className="text-slate-500 text-xs">• {c.company}</span>}
                                                        </button>
                                                    ))}
                                                    {allClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                                                        <p className="px-4 py-2 text-sm text-slate-500">Nenhum cliente encontrado</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Touch Point</label>
                                    <select
                                        value={newTaskTouchPoint}
                                        onChange={e => setNewTaskTouchPoint(e.target.value)}
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Selecionar...</option>
                                        <option value="E-mail">E-mail</option>
                                        <option value="Ligação">Ligação</option>
                                        <option value="Vídeo Conferência">Vídeo Conferência</option>
                                        <option value="WhatsApp">WhatsApp</option>
                                        <option value="Reunião">Reunião</option>
                                        <option value="Enviar Artigo">Enviar Artigo</option>
                                        <option value="Enviar Apresentação">Enviar Apresentação</option>
                                        <option value="Enviar Vídeo">Enviar Vídeo</option>
                                        <option value="Enviar Depoimentos">Enviar Depoimentos</option>
                                        <option value="Mensagem Instagram">Mensagem Instagram</option>
                                        <option value="Mensagem Linkedin">Mensagem Linkedin</option>
                                        <option value="SMS">SMS</option>
                                        <option value="Telegram">Telegram</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Descrição (Opcional)</label>
                                    <textarea
                                        rows={3}
                                        value={newTaskDesc}
                                        onChange={e => setNewTaskDesc(e.target.value)}
                                        placeholder="Anotações para a tarefa..."
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                    />
                                </div>
                                <div className="pt-2 flex gap-3">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-semibold text-white hover:bg-white/5 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={isSaving || !newTaskTitle} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-50 flex justify-center items-center">
                                        {isSaving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Salvar Tarefa"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
