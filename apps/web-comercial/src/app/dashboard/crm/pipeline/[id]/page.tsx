"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import confetti from "canvas-confetti";
import { useAuthStore } from "@/stores/auth";
import {
    ArrowLeft,
    MoreVertical,
    ThumbsDown,
    ThumbsUp,
    Phone,
    Mail,
    Plus,
    Building2,
    Calendar,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Info,
    CalendarPlus,
    CheckSquare,
    MessageSquare,
    FileText,
    Settings,
    User,
    Clock,
    UserCircle,
    Flag,
    FilePlus,
    Briefcase,
    Trash2,
    Check,
    X,
    Paperclip,
    Upload,
    Download,
    File,
    Image,
    FileSpreadsheet,
    FileArchive,
    Search,
    Edit3,
    Presentation,
    Eye,
    FileDown,
} from "lucide-react";

interface DealTask {
    id: string;
    title: string;
    description: string | null;
    touchPoint: string | null;
    date: string;
    status: string;
    clientId: string | null;
    dealId: string | null;
}

interface DealDetail {
    id: string;
    title: string;
    value: number;
    probability: number;
    stageId: string;
    tags: string[];
    assigneeIds: string[];
    createdAt: string;
    status: string;
    source?: string;
    temperature?: string;
    priority?: string;
    expectedClose?: string;
    client: {
        id: string;
        name: string;
        email: string;
        company: string | null;
        phone: string | null;
    } | null;
    consultant: {
        id: string;
        name: string;
        avatar: string | null;
    } | null;
    assignees: {
        id: string;
        name: string;
        avatar: string | null;
    }[];
    stage: {
        id: string;
        name: string;
        color: string;
    } | null;
    funnel: {
        id: string;
        name: string;
        stages?: {
            id: string;
            name: string;
            color: string;
            orderIndex: number;
        }[];
    } | null;
    notes?: {
        id: string;
        content: string;
        type: string;
        createdAt: string;
        user: { name: string; avatar: string | null };
    }[];
    tasks?: DealTask[];
    proposalActivities?: {
        id: string;
        proposalId: string;
        proposalClientName: string;
        event: string;
        viewerName: string | null;
        ip: string | null;
        createdAt: string;
    }[];
}

interface Funnel {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    isDefault: boolean;
    orderIndex: number;
}

interface LossReason {
    id: string;
    name: string;
    description: string | null;
    funnelId: string | null;
    stageId: string | null;
}

const TABS = [
    { id: "historico", label: "Histórico" },
    { id: "tarefas", label: "Tarefas" },
    { id: "produtos", label: "Produtos e Serviços" },
    { id: "propostas", label: "Propostas" },
    { id: "arquivos", label: "Arquivos" },
];

const SOURCE_OPTIONS = [
    "Google Ads",
    "Instagram",
    "Indicação de Clientes",
    "Google Orgânico (SEO)",
    "LinkedIn",
    "Contato Direto (Site)",
    "Meta Ads (Facebook)",
    "Eventos & Webinars",
];

const temperatureLabels: Record<string, { label: string; icon: string }> = {
    hot: { label: "Quente", icon: "🔥" },
    warm: { label: "Morna", icon: "☀️" },
    cold: { label: "Fria", icon: "❄️" },
};

export default function PipelineDealDetail() {
    const params = useParams();
    const router = useRouter();
    const { toast, confirm: showConfirm } = useToast();
    const [deal, setDeal] = useState<DealDetail | null>(null);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingStage, setIsUpdatingStage] = useState(false);
    const [activeTab, setActiveTab] = useState("historico");

    const [newNote, setNewNote] = useState("");
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    // User Session
    const { user } = useAuthStore();
    
    // Status update 
    const [showLossReasonModal, setShowLossReasonModal] = useState(false);
    const [showWonConfirmModal, setShowWonConfirmModal] = useState(false);
    const [showWonSuccess, setShowWonSuccess] = useState(false);
    const [lossReasons, setLossReasons] = useState<LossReason[]>([]);
    const [selectedLossReasonId, setSelectedLossReasonId] = useState("");
    const [isSubmittingLoss, setIsSubmittingLoss] = useState(false);

    // New states for wiring all buttons
    const [showClientDetails, setShowClientDetails] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Task creation modal
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isSubmittingTask, setIsSubmittingTask] = useState(false);
    const [newTask, setNewTask] = useState({ title: "", description: "", date: "", time: "09:00", touchPoint: "" });

    // Searchable dropdown states
    const [sourceSearch, setSourceSearch] = useState("");
    const [allClients, setAllClients] = useState<{ id: string; name: string; email: string; phone: string | null }[]>([]);
    const [contactSearch, setContactSearch] = useState("");
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [allCompanies, setAllCompanies] = useState<{ id: string; name: string; cnpj?: string; segment?: string }[]>([]);
    const [companySearch, setCompanySearch] = useState("");
    const [isEditingCompany, setIsEditingCompany] = useState(false);
    const sourceDropdownRef = useRef<HTMLDivElement>(null);
    const contactDropdownRef = useRef<HTMLDivElement>(null);
    const companyDropdownRef = useRef<HTMLDivElement>(null);

    // Multi-assignee state
    const [allUsers, setAllUsers] = useState<{ id: string; name: string; avatar: string | null }[]>([]);
    const [showAssigneePicker, setShowAssigneePicker] = useState(false);
    const assigneePickerRef = useRef<HTMLDivElement>(null);

    // Files tab state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedFiles, setUploadedFiles] = useState<{ id: string; originalName: string; size: number; mimeType: string; createdAt: string }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const loadFiles = async () => {
        if (!params.id) return;
        const res = await api<any[]>(`/api/deals/${params.id}/files`);
        if (res.success && res.data) setUploadedFiles(res.data);
    };

    // Proposals tab state
    const [clientProposals, setClientProposals] = useState<any[]>([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);

    const loadProposals = async () => {
        if (!deal?.client?.id) return;
        setIsLoadingProposals(true);
        try {
            const params = new URLSearchParams();
            params.set("clientId", deal.client.id);
            params.set("dealId", deal.id);
            if (deal.client.name) params.set("clientName", deal.client.name);
            const res = await api<any[]>(`/api/assembler/proposals?${params.toString()}`);
            if (res.success && res.data) setClientProposals(res.data);
        } catch (e) { console.error(e); }
        finally { setIsLoadingProposals(false); }
    };

    // Load proposals when switching to Propostas tab
    useEffect(() => {
        if (activeTab === "propostas" && deal?.client?.id) loadProposals();
    }, [activeTab, deal?.client?.id]);

    // Load files when switching to Arquivos tab
    useEffect(() => {
        if (activeTab === "arquivos") loadFiles();
    }, [activeTab, params.id]);

    const addFiles = async (files: FileList | null) => {
        if (!files || !params.id) return;
        setIsUploading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
        let hasError = false;
        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append("file", file);
            try {
                const response = await fetch(`${API_BASE}/api/deals/${params.id}/files`, {
                    method: "POST",
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    body: formData,
                });
                if (!response.ok) {
                    const errBody = await response.text();
                    console.error("Upload error:", response.status, errBody);
                    hasError = true;
                }
            } catch (err) {
                console.error("Erro no upload:", err);
                hasError = true;
            }
        }
        setIsUploading(false);
        if (hasError) {
            toast.error("Erro no upload", "Verifique se o servidor está rodando.");
        }
        await loadFiles();
    };

    const removeFile = async (id: string) => {
        await api(`/api/deals/${params.id}/files/${id}`, { method: "DELETE" });
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return Image;
        if (type.includes('pdf')) return FileText;
        if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
        if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return FileArchive;
        return File;
    };

    // Close menu and dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
            if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target as Node) && editingField === "source") {
                setEditingField(null);
            }
            if (contactDropdownRef.current && !contactDropdownRef.current.contains(e.target as Node)) {
                setIsEditingContact(false);
            }
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
                setIsEditingCompany(false);
            }
            if (assigneePickerRef.current && !assigneePickerRef.current.contains(e.target as Node)) {
                setShowAssigneePicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [editingField]);

    // Load clients for contact search
    useEffect(() => {
        (async () => {
            const res = await api<any[]>("/api/clients");
            if (res.success && res.data) setAllClients(res.data);
            const compRes = await api<any[]>("/api/companies");
            if (compRes.success && compRes.data) setAllCompanies(compRes.data);
            const usersRes = await api<any[]>("/api/users");
            if (usersRes.success && usersRes.data) {
                const advisors = usersRes.data.filter(u => u.allowedApps?.includes("growth"));
                setAllUsers(advisors);
            }
        })();
    }, []);

    useEffect(() => {
        if (params.id) {
            loadDeal(params.id as string);
        }
    }, [params.id]);

    const loadDeal = async (id: string, background = false) => {
        try {
            if (!background) setIsLoading(true);
            const [dealResponse, funnelsResponse, lossRes] = await Promise.all([
                api<DealDetail>(`/api/deals/${id}`, { method: "GET" }),
                api<Funnel[]>('/api/funnels', { method: "GET" }),
                api<LossReason[]>('/api/loss-reasons', { method: "GET" }),
            ]);

            if (dealResponse.success && dealResponse.data) {
                setDeal(dealResponse.data);
            } else {
                console.error("Deal fetch unsuccessful:", JSON.stringify(dealResponse));
            }

            if (funnelsResponse.success && funnelsResponse.data) {
                setFunnels(funnelsResponse.data);
            }

            if (lossRes.success && lossRes.data) {
                setLossReasons(lossRes.data);
            }
        } catch (error) {
            console.error("Error in loadDeal:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStageChange = async (newStageId: string) => {
        if (!deal || deal.stageId === newStageId || isUpdatingStage) return;

        try {
            setIsUpdatingStage(true);
            const response = await api<DealDetail>(`/api/deals/${deal.id}/stage`, {
                method: "PUT",
                body: { stageId: newStageId }
            });

            if (response.success && response.data) {
                const newStageInfo = deal.funnel?.stages?.find(s => s.id === newStageId);
                setDeal({
                    ...deal,
                    stageId: newStageId,
                    stage: newStageInfo ? {
                        id: newStageInfo.id,
                        name: newStageInfo.name,
                        color: newStageInfo.color
                    } : deal.stage
                });
            } else {
                toast.error("Erro ao mudar de etapa");
            }
        } catch (error) {
            console.error("Error updating stage:", error);
        } finally {
            setIsUpdatingStage(false);
        }
    };

    const handleFunnelChange = async (newFunnelId: string) => {
        if (!deal || deal.funnel?.id === newFunnelId || isUpdatingStage) return;

        try {
            setIsUpdatingStage(true);
            const response = await api<DealDetail>(`/api/deals/${deal.id}/funnel`, {
                method: "PUT",
                body: { funnelId: newFunnelId }
            });

            if (response.success && response.data) {
                await loadDeal(deal.id, true);
            } else {
                toast.error("Erro ao mudar de funil");
            }
        } catch (error) {
            console.error("Error updating funnel:", error);
        } finally {
            setIsUpdatingStage(false);
        }
    };

    const handleUpdateDealStatus = async (status: "won" | "lost") => {
        if (!deal) return;
        
        if (status === "lost") {
            setShowLossReasonModal(true);
            return;
        }

        if (status === "won" && !showWonConfirmModal) {
            setShowWonConfirmModal(true);
            return;
        }

        try {
            // Find the matching closing stage in the funnel
            const stages = deal.funnel?.stages || [];
            const targetStageName = status === "won" ? "Fechado — Ganho" : "Fechado — Perdido";
            const targetStage = stages.find(s => s.name === targetStageName);

            // Update status
            await api<DealDetail>(`/api/deals/${deal.id}`, {
                method: "PUT",
                body: { status }
            });

            // Also move to the correct stage if found
            if (targetStage) {
                await api(`/api/deals/${deal.id}/stage`, {
                    method: "PUT",
                    body: { stageId: targetStage.id }
                });
            }

            // Reload deal to get fresh data
            await loadDeal(deal.id, true);
            toast.success(`Negócio marcado como ${status === "won" ? "ganho" : "perdido"}!`);

            if (status === "won") {
                setShowWonConfirmModal(false);
                setShowWonSuccess(true);
                
                // Fire confetti
                const duration = 3000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

                const interval: any = setInterval(function() {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } });
                }, 250);
                
                setTimeout(() => {
                    setShowWonSuccess(false);
                }, 4000);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao alterar status do negócio.");
        }
    };

    const confirmLoss = async () => {
        if (!deal || !selectedLossReasonId) return;
        setIsSubmittingLoss(true);
        try {
            const stages = deal.funnel?.stages || [];
            const targetStage = stages.find(s => s.name === "Fechado — Perdido");

            await api<DealDetail>(`/api/deals/${deal.id}`, {
                method: "PUT",
                body: { status: "lost", lossReasonId: selectedLossReasonId }
            });

            if (targetStage) {
                await api(`/api/deals/${deal.id}/stage`, {
                    method: "PUT",
                    body: { stageId: targetStage.id }
                });
            }

            toast.success("Negócio marcado como perdido");
            setShowLossReasonModal(false);
            await loadDeal(deal.id, true);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao alterar status.");
        } finally {
            setIsSubmittingLoss(false);
        }
    };

    const handleInlineUpdate = async (field: string, val: any) => {
        if (!deal) return;
        try {
            const payload = { [field]: val };
            const response = await api<DealDetail>(`/api/deals/${deal.id}`, {
                method: "PUT",
                body: payload
            });
            if (response.success && response.data) {
                setDeal(response.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setEditingField(null);
        }
    };

    const handleAddNote = async () => {
        if (!deal || !newNote.trim()) return;
        setIsSubmittingNote(true);
        try {
            const response = await api<any>(`/api/deals/${deal.id}/notes`, {
                method: "POST",
                body: { content: newNote }
            });
            if (response.success) {
                setNewNote("");
                await loadDeal(deal.id, true);
            } else {
                toast.error("Erro ao salvar anotação");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmittingNote(false);
        }
    };

    const handleDeleteDeal = async () => {
        if (!deal) return;
        const confirmed = await showConfirm({
            title: "Excluir negociação?",
            description: `Tem certeza que deseja excluir "${deal.title}"? Esta ação não pode ser desfeita.`,
            confirmLabel: "Excluir",
            variant: "danger",
        });
        if (!confirmed) return;
        try {
            const response = await api(`/api/deals/${deal.id}`, { method: "DELETE" });
            if (response.success) {
                router.push("/dashboard/crm/pipeline");
            } else {
                toast.error("Erro ao excluir o negócio.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir o negócio.");
        }
    };

    const handleCreateTask = async () => {
        if (!deal || !newTask.title.trim() || !newTask.date) return;
        setIsSubmittingTask(true);
        try {
            const payload = {
                title: newTask.title.trim(),
                description: newTask.description.trim() || undefined,
                touchPoint: newTask.touchPoint || undefined,
                date: (() => {
                    const [hours, minutes] = newTask.time.split(':').map(Number);
                    const [year, month, day] = newTask.date.split('-').map(Number);
                    const dt = new Date(year, month - 1, day, hours, minutes, 0, 0);
                    return dt.toISOString();
                })(),
                dealId: deal.id,
                clientId: deal.client?.id || undefined,
            };
            const response = await api<any>("/api/tasks", {
                method: "POST",
                body: payload
            });
            if (response.success) {
                setNewTask({ title: "", description: "", date: "", time: "09:00", touchPoint: "" });
                setShowTaskModal(false);
                await loadDeal(deal.id, true);
            } else {
                toast.error("Erro ao criar tarefa", response.message || "Tente novamente.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao criar tarefa.");
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const handleToggleTaskStatus = async (task: DealTask) => {
        const newStatus = task.status === "completed" ? "pending" : "completed";
        try {
            const response = await api<any>(`/api/tasks/${task.id}`, {
                method: "PUT",
                body: { status: newStatus }
            });
            if (response.success) {
                await loadDeal(deal!.id, true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.20))] items-center justify-center p-6 bg-slate-950">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!deal) {
        return (
            <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] items-center justify-center p-6 bg-slate-950">
                <h2 className="text-xl font-bold text-white mb-2">Negócio não encontrado</h2>
                <button onClick={() => router.push('/dashboard/crm/pipeline')} className="text-blue-500 hover:text-blue-400">Voltar para o Pipeline</button>
            </div>
        );
    }

    const tempInfo = temperatureLabels[deal.temperature || "cold"] || temperatureLabels.cold;

    return (
        <div className="flex flex-col h-full min-h-screen overflow-hidden bg-transparent text-slate-900 dark:text-slate-100">
            {/* ═══ Header ═══ */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard/crm/pipeline')} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{deal.title}</h1>
                            {deal.tags?.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-purple-500 text-white leading-none">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center text-xs text-slate-500 gap-2">
                            <span>{deal.client?.company || deal.client?.name || deal.title}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* MoreVertical Menu */}
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreVertical size={20} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg shadow-xl z-50">
                                <button
                                    onClick={() => { setShowMenu(false); handleDeleteDeal(); }}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors rounded-lg"
                                >
                                    <Trash2 size={14} /> Excluir negócio
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => handleUpdateDealStatus("lost")}
                        disabled={deal.status === "lost"}
                        className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg transition-colors
                            ${deal.status === "lost"
                                ? 'bg-red-500/20 text-red-500 cursor-default'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400'}
                        `}
                    >
                        <ThumbsDown size={16} /> {deal.status === "lost" ? "Perdido" : "Marcar perda"}
                    </button>
                    <button
                        onClick={() => handleUpdateDealStatus("won")}
                        disabled={deal.status === "won"}
                        className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg transition-colors border
                            ${deal.status === "won"
                                ? 'bg-blue-500 text-white border-blue-500 cursor-default shadow-lg shadow-blue-500/20'
                                : 'bg-slate-900 text-white dark:bg-slate-800 hover:dark:bg-blue-500 border-slate-800 dark:border-white/10 dark:text-slate-200'}
                        `}
                    >
                        <ThumbsUp size={16} /> {deal.status === "won" ? "Ganho" : "Marcar venda"}
                    </button>
                </div>
            </div>

            {/* ═══ Funnels Visualizer ═══ */}
            <div className="px-6 py-2 border-b border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm overflow-x-auto flex gap-2 hide-scrollbar">
                {funnels.map(f => (
                    <button
                        key={f.id}
                        onClick={() => handleFunnelChange(f.id)}
                        disabled={isUpdatingStage}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap
                            ${deal.funnel?.id === f.id
                                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                                : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer'
                            }
                            ${isUpdatingStage ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {f.name}
                    </button>
                ))}
            </div>

            {/* ═══ Progress Bar (Stage Visualizer) ═══ */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm overflow-x-auto text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <div className="flex-1 flex px-1">
                    {deal.funnel?.stages && deal.funnel.stages.length > 0 ? (
                        (() => {
                            const stages = deal.funnel.stages;
                            const currentIndex = stages.findIndex(s => s.id === deal.stageId);

                            return stages.map((stage, idx) => {
                                const isFirst = idx === 0;
                                const isLast = idx === stages.length - 1;
                                const isPast = currentIndex > -1 && idx < currentIndex;
                                const isCurrent = idx === currentIndex;
                                const isLockedStage = stage.name === "Fechado — Ganho" || stage.name === "Fechado — Perdido";

                                let bgColor = "bg-slate-200 dark:bg-slate-800 text-slate-500";
                                let afterBorder = "after:border-l-slate-200 dark:after:border-l-slate-800";

                                if (isCurrent) {
                                    bgColor = "bg-cyan-500 text-white shadow-sm";
                                    afterBorder = "after:border-l-cyan-500";
                                } else if (isPast) {
                                    bgColor = "bg-cyan-600/90 text-white/90";
                                    afterBorder = "after:border-l-cyan-600/90";
                                }

                                return (
                                    <div
                                        key={stage.id}
                                        onClick={() => !isLockedStage && handleStageChange(stage.id)}
                                        className={`
                                            ${bgColor}
                                            ${isLockedStage ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:brightness-95'}
                                            transition-all duration-300
                                            px-6 py-2 truncate relative flex-1 min-w-[120px] text-center
                                            ${isUpdatingStage ? 'opacity-70 pointer-events-none' : ''}
                                            ${isFirst ? 'rounded-l-md pl-4' : 'ml-0.5'}
                                            ${isLast ? 'rounded-r-md pr-4' : ''}
                                            ${!isLast ? `after:content-[''] after:absolute after:top-0 after:-right-3 after:border-[16px] ${afterBorder} after:border-t-transparent after:border-b-transparent after:border-r-transparent after:z-10` : ''}
                                            ${!isFirst ? `before:content-[''] before:absolute before:top-0 before:left-0 before:border-[16px] before:border-l-white/40 dark:before:border-l-slate-900/40 before:border-t-transparent before:border-b-transparent before:border-r-transparent before:-ml-[16px] before:z-10` : ''}
                                        `}
                                        title={isLockedStage ? `Use os botões "Marcar venda" ou "Marcar perda"` : stage.name}
                                    >
                                        <span className="relative z-20 drop-shadow-sm">{stage.name}</span>
                                    </div>
                                );
                            });
                        })()
                    ) : (
                        <div className="bg-cyan-500 text-white px-4 py-1.5 rounded flex-1 text-center truncate">
                            {deal.stage?.name || 'Sem contato'}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ Main Content Area ═══ */}
            <div className="flex-1 flex overflow-hidden">

                {/* ═══ Left Sidebar (Details) ═══ */}
                <div className="w-[340px] border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto custom-scrollbar flex-shrink-0 p-4 space-y-4">

                    {/* Negociação */}
                    <div className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/[0.06] rounded-xl">
                        <div className="flex items-center justify-between mb-4 cursor-pointer">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Negociação</h3>
                            <ChevronDown size={16} className="text-slate-400" />
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start">
                                <span className="w-28 text-slate-500">Nome</span>
                                <span className="flex-1 font-medium text-slate-900 dark:text-white">{deal.title}</span>
                            </div>
                            <div className="flex items-start">
                                <span className="w-28 text-slate-500 shrink-0 pt-0.5">Temperatura</span>
                                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                                    {(["hot", "warm", "cold"] as const).map(temp => (
                                        <button
                                            key={temp}
                                            onClick={() => handleInlineUpdate("temperature", temp)}
                                            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold transition-all border ${
                                                deal.temperature === temp
                                                    ? temp === "hot" ? "bg-red-500/15 text-red-400 border-red-500/30"
                                                        : temp === "warm" ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                                                        : "bg-blue-500/15 text-blue-400 border-blue-500/30"
                                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                                            }`}
                                        >
                                            {temperatureLabels[temp].icon} {temperatureLabels[temp].label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-start">
                                <span className="w-28 text-slate-500">Criada em</span>
                                <span className="flex-1 font-medium text-slate-900 dark:text-white">{format(parseISO(deal.createdAt), "dd/MM/yyyy HH:mm")}</span>
                            </div>
                            <div className="flex items-start">
                                <span className="w-28 text-slate-500">Valor total</span>
                                {editingField === "value" ? (
                                    <input
                                        autoFocus
                                        type="number"
                                        className="flex-1 bg-white dark:bg-slate-950 border border-cyan-500 rounded px-2 py-0.5 text-sm text-slate-900 dark:text-white outline-none -ml-2"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => handleInlineUpdate("value", parseFloat(editValue) || 0)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleInlineUpdate("value", parseFloat(editValue) || 0)}
                                    />
                                ) : (
                                    <span
                                        onClick={() => { setEditingField("value"); setEditValue(deal.value.toString()); }}
                                        className="flex-1 font-medium text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded px-1 -ml-1 cursor-text min-h-5"
                                    >
                                        {deal.value > 0 ? `R$ ${deal.value.toLocaleString('pt-BR')}` : 'Adicionar valor...'}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-start">
                                <span className="w-28 text-slate-500 shrink-0 pt-0.5">Probabilidade</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-sm font-bold ${
                                            (deal.probability || 0) >= 70 ? "text-blue-400"
                                            : (deal.probability || 0) >= 40 ? "text-amber-400"
                                            : "text-red-400"
                                        }`}>{deal.probability || 0}%</span>
                                        <span className="text-[9px] text-slate-500 font-medium">
                                            {(deal.probability || 0) >= 70 ? "Alta" : (deal.probability || 0) >= 40 ? "Média" : "Baixa"}
                                        </span>
                                    </div>
                                    {/* Visual bar + invisible range slider stacked */}
                                    <div className="relative h-3 group">
                                        <div className="absolute inset-y-0 w-full h-2 top-0.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-150 ${
                                                    (deal.probability || 0) >= 70 ? "bg-blue-500"
                                                    : (deal.probability || 0) >= 40 ? "bg-amber-500"
                                                    : "bg-red-500"
                                                }`}
                                                style={{ width: `${deal.probability || 0}%` }}
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100" step="5"
                                            value={deal.probability || 0}
                                            onChange={(e) => setDeal(prev => prev ? { ...prev, probability: parseInt(e.target.value) } : prev)}
                                            onMouseUp={(e) => handleInlineUpdate("probability", parseInt((e.target as HTMLInputElement).value))}
                                            onTouchEnd={(e) => handleInlineUpdate("probability", parseInt((e.target as HTMLInputElement).value))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[9px] text-slate-500">
                                        <span>0%</span><span>50%</span><span>100%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <span className="w-28 text-slate-500">Previsão</span>
                                {editingField === "expectedClose" ? (
                                    <input
                                        autoFocus
                                        type="date"
                                        className="flex-1 bg-white dark:bg-slate-950 border border-cyan-500 rounded px-2 py-0.5 text-sm text-slate-900 dark:text-white outline-none -ml-2 dark:[color-scheme:dark]"
                                        value={editValue}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setEditValue(val);
                                            handleInlineUpdate("expectedClose", val ? new Date(val + "T12:00:00").toISOString() : null);
                                        }}
                                        onBlur={() => setEditingField(null)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleInlineUpdate("expectedClose", editValue ? new Date(editValue + "T12:00:00").toISOString() : null)}
                                    />
                                ) : (
                                    <span
                                        onClick={() => {
                                            setEditingField("expectedClose");
                                            setEditValue(deal.expectedClose ? deal.expectedClose.substring(0, 10) : "");
                                        }}
                                        className="flex-1 font-medium text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded px-1 -ml-1 cursor-text min-h-5"
                                    >
                                        {deal.expectedClose ? format(parseISO(deal.expectedClose), "dd/MM/yyyy") : 'Adicionar data...'}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-start relative">
                                <span className="w-28 text-slate-500">Fonte</span>
                                {editingField === "source" ? (
                                    <div ref={sourceDropdownRef} className="flex-1 relative -ml-2">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Buscar fonte..."
                                                className="w-full bg-white dark:bg-slate-950 border border-cyan-500 rounded px-2 py-0.5 pl-7 text-sm text-slate-900 dark:text-white outline-none"
                                                value={sourceSearch}
                                                onChange={(e) => setSourceSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                            {SOURCE_OPTIONS.filter(s => s.toLowerCase().includes(sourceSearch.toLowerCase())).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => { handleInlineUpdate("source", s); setSourceSearch(""); }}
                                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-cyan-500/10 transition-colors ${deal.source === s ? 'text-cyan-500 font-bold bg-cyan-500/5' : 'text-slate-700 dark:text-slate-300'
                                                        }`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                            {SOURCE_OPTIONS.filter(s => s.toLowerCase().includes(sourceSearch.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-2 text-xs text-slate-400">Nenhuma fonte encontrada</div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <span
                                        onClick={() => { setEditingField("source"); setSourceSearch(""); }}
                                        className="flex-1 font-medium text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded px-1 -ml-1 cursor-text min-h-5"
                                    >
                                        {deal.source || 'Adicionar origem...'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contatos */}
                    <div className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/[0.06] rounded-xl">
                        <div className="flex items-center justify-between mb-4 cursor-pointer">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Contatos</h3>
                            <ChevronDown size={16} className="text-slate-400" />
                        </div>
                        {deal.client ? (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">{deal.client.name}</span>
                                    <User size={14} className="text-cyan-500" />
                                </div>
                                {deal.client.phone && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium mb-1 group">
                                        <Phone size={14} className="text-slate-400" />
                                        {deal.client.phone}
                                        <a href={`https://wa.me/${deal.client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                                            <MessageSquare size={12} className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-1" />
                                        </a>
                                    </div>
                                )}
                                {deal.client.email && (
                                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-3">
                                        <Mail size={14} className="text-slate-400" />
                                        <a href={`mailto:${deal.client.email}`} className="hover:text-cyan-500 transition-colors">{deal.client.email}</a>
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowClientDetails(!showClientDetails)}
                                    className="flex items-center justify-between w-full text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 p-1.5 -mx-1.5 rounded transition-colors"
                                >
                                    Informações adicionais
                                    {showClientDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                </button>
                                {showClientDetails && (
                                    <div className="mt-3 space-y-2 text-sm border-t border-slate-200 dark:border-white/5 pt-3">
                                        <div className="flex items-start">
                                            <span className="w-24 text-slate-500">Empresa</span>
                                            <span className="flex-1 font-medium text-slate-900 dark:text-white">{deal.client.company || "—"}</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="w-24 text-slate-500">E-mail</span>
                                            <span className="flex-1 font-medium text-slate-900 dark:text-white">{deal.client.email || "—"}</span>
                                        </div>
                                        <div className="flex items-start">
                                            <span className="w-24 text-slate-500">Telefone</span>
                                            <span className="flex-1 font-medium text-slate-900 dark:text-white">{deal.client.phone || "—"}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500 mb-4">Sem contato vinculado</div>
                        )}

                        {/* Contact change / search */}
                        <div className="relative" ref={contactDropdownRef}>
                            <button
                                onClick={() => { setIsEditingContact(!isEditingContact); setContactSearch(""); }}
                                className="flex items-center gap-2 text-sm font-bold text-cyan-500 hover:text-cyan-600 transition-colors"
                            >
                                <Search size={14} /> {deal.client ? 'Alterar contato' : 'Vincular contato'}
                            </button>
                            {isEditingContact && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                                    <div className="p-2 border-b border-slate-100 dark:border-white/5">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Buscar contato..."
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 pl-8 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                                                value={contactSearch}
                                                onChange={(e) => setContactSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {allClients.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.email.toLowerCase().includes(contactSearch.toLowerCase())).map(c => (
                                            <button
                                                key={c.id}
                                                onClick={async () => {
                                                    await handleInlineUpdate("clientId", c.id);
                                                    setIsEditingContact(false);
                                                    setContactSearch("");
                                                }}
                                                className={`w-full text-left px-3 py-2.5 hover:bg-cyan-500/10 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0 ${deal.client?.id === c.id ? 'bg-cyan-500/5' : ''
                                                    }`}
                                            >
                                                <p className={`text-sm font-medium ${deal.client?.id === c.id ? 'text-cyan-500' : 'text-slate-700 dark:text-white'}`}>{c.name}</p>
                                                <p className="text-[10px] text-slate-400">{c.email}{c.phone ? ` • ${c.phone}` : ''}</p>
                                            </button>
                                        ))}
                                        {allClients.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.email.toLowerCase().includes(contactSearch.toLowerCase())).length === 0 && (
                                            <div className="px-3 py-3 text-xs text-slate-400 text-center">Nenhum contato encontrado</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Empresa */}
                    <div className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/[0.06] rounded-xl">
                        <div className="flex items-center justify-between mb-4 cursor-pointer">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Empresa</h3>
                            <ChevronDown size={16} className="text-slate-400" />
                        </div>
                        <div className="space-y-3 text-sm mb-4">
                            <div className="flex items-start">
                                <span className="w-28 text-slate-500">Nome</span>
                                <span className="flex-1 font-medium text-slate-900 dark:text-white">{deal.client?.company || "Não informada"}</span>
                            </div>
                        </div>
                        {/* Company change / search */}
                        <div className="relative" ref={companyDropdownRef}>
                            <button
                                onClick={() => { setIsEditingCompany(!isEditingCompany); setCompanySearch(""); }}
                                className="flex items-center gap-2 text-sm font-bold text-cyan-500 hover:text-cyan-600 transition-colors"
                            >
                                <Search size={14} /> {deal.client?.company ? 'Alterar empresa' : 'Vincular empresa'}
                            </button>
                            {isEditingCompany && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
                                    <div className="p-2 border-b border-slate-100 dark:border-white/5">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Buscar empresa..."
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 pl-8 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                                                value={companySearch}
                                                onChange={(e) => setCompanySearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {allCompanies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).map(c => (
                                            <button
                                                key={c.id}
                                                onClick={async () => {
                                                    if (deal.client) {
                                                        await api(`/api/clients/${deal.client.id}`, {
                                                            method: "PUT",
                                                            body: { companyId: c.id, company: c.name },
                                                        });
                                                        // Reload deal to reflect the change
                                                        await loadDeal(deal.id);
                                                    }
                                                    setIsEditingCompany(false);
                                                    setCompanySearch("");
                                                }}
                                                className={`w-full text-left px-3 py-2.5 hover:bg-cyan-500/10 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0`}
                                            >
                                                <p className="text-sm font-medium text-slate-700 dark:text-white">{c.name}</p>
                                                <p className="text-[10px] text-slate-400">{c.segment || 'Sem segmento'}{c.cnpj ? ` • ${c.cnpj}` : ''}</p>
                                            </button>
                                        ))}
                                        {allCompanies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                                            <div className="px-3 py-3 text-xs text-slate-400 text-center">Nenhuma empresa encontrada</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Responsável */}
                    <div className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/[0.06] rounded-xl">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Responsável</h3>
                            <ChevronDown size={16} className="text-slate-400" />
                        </div>
                        <div className="space-y-2" ref={assigneePickerRef}>
                            {/* Current assignees */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                {(deal.assignees || []).length === 0 && (
                                    <span className="text-sm text-slate-400 italic">Nenhum responsável atribuído</span>
                                )}
                                {(deal.assignees || []).map(u => (
                                    <div key={u.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/60 border border-white/10 rounded-full">
                                        <div className="w-5 h-5 rounded-full bg-cyan-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                                            {u.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-xs text-white font-medium">{u.name}</span>
                                        <button
                                            onClick={() => {
                                                const newIds = (deal.assigneeIds || []).filter(id => id !== u.id);
                                                handleInlineUpdate("assigneeIds", newIds);
                                            }}
                                            className="ml-0.5 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <X size={11} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add assignee button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowAssigneePicker(v => !v)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-300 border border-dashed border-slate-700 hover:border-slate-500 rounded-lg transition-all w-full justify-center"
                                >
                                    <Plus size={12} /> Atribuir responsável
                                </button>

                                {showAssigneePicker && (
                                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                        <div className="p-2 max-h-48 overflow-y-auto">
                                            {allUsers.length === 0 && (
                                                <p className="text-xs text-slate-500 px-2 py-2">Nenhum usuário encontrado</p>
                                            )}
                                            {allUsers.map(u => {
                                                const isSelected = (deal.assigneeIds || []).includes(u.id);
                                                return (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => {
                                                            const newIds = isSelected
                                                                ? (deal.assigneeIds || []).filter(id => id !== u.id)
                                                                : [...(deal.assigneeIds || []), u.id];
                                                            handleInlineUpdate("assigneeIds", newIds);
                                                        }}
                                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-left ${
                                                            isSelected
                                                                ? 'bg-cyan-500/15 text-cyan-400'
                                                                : 'hover:bg-slate-800 text-slate-300'
                                                        }`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                                            isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-400'
                                                        }`}>
                                                            {u.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm flex-1">{u.name}</span>
                                                        {isSelected && <Check size={13} className="text-cyan-400 shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Right Side (Activity & History) ═══ */}
                <div className="flex-1 flex flex-col bg-transparent">
                    <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar max-w-4xl space-y-8">

                        {/* Próximas Tarefas */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Próximas tarefas</h3>
                                <CalendarPlus size={16} className="text-cyan-500 cursor-pointer hover:text-cyan-400 transition-colors" onClick={() => setShowTaskModal(true)} />
                            </div>
                            {deal.tasks && deal.tasks.filter(t => t.status === "pending").length > 0 ? (
                                <div className="space-y-2">
                                    {deal.tasks.filter(t => t.status === "pending").slice(0, 3).map(task => (
                                        <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg group">
                                            <button onClick={() => handleToggleTaskStatus(task)} className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 hover:border-cyan-500 dark:hover:border-cyan-500 flex items-center justify-center transition-colors shrink-0">
                                                {/* empty checkbox */}
                                            </button>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{task.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[11px] text-slate-500">{format(parseISO(task.date), "dd/MM/yyyy")}</p>
                                                    {task.touchPoint && <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded font-medium">{task.touchPoint}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 font-bold text-sm rounded-lg transition-colors border border-slate-200 dark:border-white/5 w-full justify-center mt-2"
                                    >
                                        <Plus size={16} /> Criar tarefa
                                    </button>
                                </div>
                            ) : (
                                <div className="border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50/50 dark:bg-slate-900/20 p-8 flex flex-col items-center justify-center text-center">
                                    <div className="mb-4 text-slate-300 dark:text-slate-700">
                                        <Calendar size={48} strokeWidth={1} />
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium mb-4">Não existem tarefas pendentes para essa Negociação</p>
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 font-bold text-sm rounded-lg transition-colors border border-slate-200 dark:border-white/5"
                                    >
                                        <Plus size={16} /> Criar tarefa
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tabs Activity */}
                        <div>
                            <div className="flex border-b border-slate-200 dark:border-white/10 gap-6 mb-6">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-cyan-500' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <motion.div layoutId="dealTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* ═══ Histórico Tab ═══ */}
                            {activeTab === "historico" && (
                                <div className="space-y-6 mt-6">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-white/10">
                                        <textarea
                                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 resize-none min-h-[80px]"
                                            placeholder="Adicione uma anotação neste negócio..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                        />
                                        <div className="flex justify-end mt-3">
                                            <button
                                                onClick={handleAddNote}
                                                disabled={isSubmittingNote || !newNote.trim()}
                                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors"
                                            >
                                                <Plus size={16} /> {isSubmittingNote ? 'Salvando...' : 'Salvar Anotação'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-4 before:bottom-0 before:w-px before:bg-slate-200 dark:before:bg-white/10">

                                        {deal.notes && deal.notes.length > 0 ? deal.notes.map((note) => (
                                            <div key={note.id} className="relative pl-4 space-y-1">
                                                <div className="absolute -left-7 top-1 w-5 h-5 rounded-full bg-white dark:bg-[#0B1015] border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                                </div>

                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {note.user?.name || "Usuário"}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        deixou uma anotação
                                                    </span>
                                                    <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {format(parseISO(note.createdAt), "dd/MM/yyyy HH:mm")}
                                                    </span>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                                                    {note.content}
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="text-sm text-slate-500 italic pl-4"></div>
                                        )}

                                        {/* Proposal Activities (views & downloads) */}
                                        {deal.proposalActivities && deal.proposalActivities.map((activity) => (
                                            <div key={activity.id} className="relative pl-4 space-y-1">
                                                <div className={`absolute -left-7 top-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0B1015] ${activity.event === "view" ? "bg-blue-500" : "bg-purple-500"
                                                    }`}>
                                                    {activity.event === "view" ? <Eye size={10} className="text-white" /> : <FileDown size={10} className="text-white" />}
                                                </div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {activity.viewerName || "Visitante"}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {activity.event === "view" ? "abriu a proposta" : "fez download do PDF"}
                                                    </span>
                                                    <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {format(parseISO(activity.createdAt), "dd/MM/yyyy HH:mm")}
                                                    </span>
                                                </div>
                                                <div className={`text-[11px] px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 border ${activity.event === "view"
                                                        ? "bg-blue-500/5 text-blue-500 border-blue-500/20"
                                                        : "bg-purple-500/5 text-purple-500 border-purple-500/20"
                                                    }`}>
                                                    {activity.event === "view" ? <Eye size={10} /> : <FileDown size={10} />}
                                                    Proposta: {activity.proposalClientName}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Timeline Generic Event */}
                                        <div className="relative pl-4 space-y-1">
                                            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-slate-400 border-[3px] border-white dark:border-[#0B1015]" />
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                <span className="font-bold">{deal.consultant?.name || "Sistema"}</span> alterou a etapa para <span className="font-bold">{deal.stage?.name || 'Sem contato'}</span> a partir do funil <span className="font-bold">{deal.funnel?.name || 'Funil Padrão'}</span>
                                            </p>
                                            <p className="text-[11px] text-slate-500">{format(parseISO(deal.createdAt), "dd/MM/yyyy HH:mm")}</p>
                                        </div>

                                        {/* Timeline Create Event */}
                                        <div className="relative pl-4 space-y-1">
                                            <div className="absolute -left-7 top-0.5 w-5 h-5 rounded-full bg-pink-500 text-white flex items-center justify-center border-2 border-white dark:border-[#0B1015]">
                                                <Flag size={10} className="fill-current" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                                Negociação criada
                                            </p>
                                            <p className="text-[11px] text-slate-500">{format(parseISO(deal.createdAt), "dd/MM/yyyy HH:mm")}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ Tarefas Tab ═══ */}
                            {activeTab === "tarefas" && (
                                <div className="space-y-4 mt-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Tarefas desta negociação</span>
                                        <button
                                            onClick={() => setShowTaskModal(true)}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-colors"
                                        >
                                            <Plus size={14} /> Nova Tarefa
                                        </button>
                                    </div>

                                    {deal.tasks && deal.tasks.length > 0 ? (
                                        <div className="space-y-2">
                                            {deal.tasks.map(task => (
                                                <div key={task.id} className={`flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-lg ${task.status === "completed" ? "opacity-60" : ""}`}>
                                                    <button
                                                        onClick={() => handleToggleTaskStatus(task)}
                                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${task.status === "completed"
                                                            ? "bg-blue-500 border-blue-500 text-white"
                                                            : "border-slate-300 dark:border-slate-600 hover:border-cyan-500 dark:hover:border-cyan-500"
                                                            }`}
                                                    >
                                                        {task.status === "completed" && <Check size={12} />}
                                                    </button>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-slate-500" : "text-slate-900 dark:text-white"}`}>{task.title}</p>
                                                        <div className="flex items-center gap-2">
                                                            {task.description && <p className="text-[11px] text-slate-500 truncate">{task.description}</p>}
                                                            {task.touchPoint && <span className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded font-medium shrink-0">{task.touchPoint}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[11px] text-slate-500">{format(parseISO(task.date), "dd/MM/yyyy")}</p>
                                                        <span className={`text-[9px] uppercase font-bold tracking-wider ${task.status === "completed" ? "text-blue-500" : "text-amber-500"}`}>
                                                            {task.status === "completed" ? "Concluída" : "Pendente"}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50/50 dark:bg-slate-900/20 p-8 flex flex-col items-center justify-center text-center">
                                            <Calendar size={40} strokeWidth={1} className="text-slate-300 dark:text-slate-700 mb-3" />
                                            <p className="text-sm text-slate-500">Nenhuma tarefa para este negócio</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ═══ Produtos Tab ═══ */}
                            {activeTab === "produtos" && (
                                <div className="border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50/50 dark:bg-slate-900/20 p-8 flex flex-col items-center justify-center text-center mt-6">
                                    <Briefcase size={40} strokeWidth={1} className="text-slate-300 dark:text-slate-700 mb-3" />
                                    <p className="text-sm text-slate-500 font-medium">Produtos e serviços em breve</p>
                                    <p className="text-xs text-slate-400 mt-1">Esta funcionalidade será disponibilizada em uma próxima atualização.</p>
                                </div>
                            )}

                            {/* ═══ Propostas Tab ═══ */}
                            {activeTab === "propostas" && (
                                <div className="space-y-4 mt-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Propostas deste cliente</span>
                                        <button
                                            onClick={() => {
                                                const clientId = deal?.client?.id || '';
                                                router.push(`/dashboard/crm/assembler/new?clientId=${clientId}&dealId=${deal?.id}`);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-colors"
                                        >
                                            <Plus size={14} /> Nova Proposta
                                        </button>
                                    </div>

                                    {isLoadingProposals ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : clientProposals.length > 0 ? (
                                        <div className="space-y-3">
                                            {clientProposals.map(p => {
                                                const title = p.title && p.title !== "Nova Proposta" ? p.title : (p.scopeData?.projectSummary || "Escopo Sem Título");
                                                const clientName = p.client?.name || p.clientName || "Sem Nome";
                                                const d = new Date(p.createdAt);
                                                
                                                const totalHours = p.totalHours || 0;
                                                let modsCount = 0;
                                                let screensCount = 0;
                                                if (p.scopeData) {
                                                    (p.scopeData.users || []).forEach((u: any) => (u.platforms || []).forEach((plat: any) => {
                                                        modsCount += (plat.modules || []).length;
                                                        (plat.modules || []).forEach((m: any) => {
                                                            screensCount += (m.screens || []).length;
                                                        });
                                                    }));
                                                }
                                                
                                                return (
                                                    <div key={p.id} className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl hover:border-cyan-500/30 transition-all group">
                                                        <div className="flex items-start justify-between gap-3 mb-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <FileText size={14} className="text-cyan-500 shrink-0" />
                                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{title}</h4>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border bg-cyan-500/10 text-cyan-500 border-cyan-500/20">
                                                                        IA
                                                                    </span>
                                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{clientName}</span>
                                                                    {modsCount > 0 && (
                                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{modsCount} módulos ({screensCount} telas)</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                {totalHours > 0 ? (
                                                                    <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{totalHours} Horas</p>
                                                                ) : (
                                                                    <p className="text-xs text-slate-400">Sem horas geradas</p>
                                                                )}
                                                                <p className="text-[10px] text-slate-400">{d.toLocaleDateString('pt-BR')}</p>
                                                            </div>
                                                        </div>

                                                        {/* Action Shortcuts */}
                                                        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                                                            <button
                                                                onClick={() => {
                                                                    const scope = p.scopeData;
                                                                    if (scope) {
                                                                        scope.id = p.id;
                                                                        if (typeof window !== "undefined") {
                                                                            localStorage.setItem("proposals_assembler_current_scope", JSON.stringify(scope));
                                                                            router.push("/dashboard/crm/assembler/new/editor");
                                                                        }
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition-colors"
                                                            >
                                                                <Edit3 size={12} /> Editar (IA)
                                                            </button>
                                                            {p.publicId && (
                                                                <button
                                                                    onClick={() => window.open(`/proposal/${p.publicId}`, '_blank')}
                                                                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition-colors"
                                                                >
                                                                    <Presentation size={12} /> Apresentação
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => {
                                                                    const scope = p.scopeData;
                                                                    if (scope) {
                                                                        scope.id = p.id;
                                                                        if (typeof window !== "undefined") {
                                                                            localStorage.setItem("proposals_assembler_current_scope", JSON.stringify(scope));
                                                                            router.push("/dashboard/crm/assembler/new/editor");
                                                                        }
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-lg transition-colors ml-auto"
                                                            >
                                                                <ExternalLink size={12} /> Abrir
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50/50 dark:bg-slate-900/20 p-8 flex flex-col items-center justify-center text-center">
                                            <FileText size={40} strokeWidth={1} className="text-slate-300 dark:text-slate-700 mb-3" />
                                            <p className="text-sm text-slate-500 font-medium">Nenhuma proposta para este cliente</p>
                                            <p className="text-xs text-slate-400 mt-1">Crie uma nova proposta para {deal?.client?.name || 'este cliente'}</p>
                                            <button
                                                onClick={() => {
                                                    const clientId = deal?.client?.id || '';
                                                    router.push(`/dashboard/crm/assembler/new?clientId=${clientId}&dealId=${deal?.id}`);
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-lg transition-colors mt-4"
                                            >
                                                <Plus size={16} /> Nova Proposta
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ═══ Arquivos Tab ═══ */}
                            {activeTab === "arquivos" && (
                                <div className="mt-6 space-y-4">
                                    {/* Hidden file input */}
                                    <input type="file" ref={fileInputRef} multiple onChange={async (e) => { await addFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="hidden" />

                                    {/* Drop Zone */}
                                    <div
                                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={async (e) => { e.preventDefault(); setIsDragging(false); await addFiles(e.dataTransfer.files); }}
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isUploading
                                            ? 'border-cyan-500/50 bg-cyan-500/5 opacity-60'
                                            : isDragging
                                                ? 'border-cyan-500 bg-cyan-500/5'
                                                : 'border-slate-300 dark:border-white/10 hover:border-cyan-500/40 hover:bg-cyan-500/5'
                                            }`}
                                    >
                                        <Upload size={32} strokeWidth={1.5} className={`mx-auto mb-3 ${isDragging || isUploading ? 'text-cyan-500' : 'text-slate-400 dark:text-slate-600'}`} />
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                                            {isUploading ? 'Enviando arquivo...' : isDragging ? 'Solte os arquivos aqui' : 'Arraste e solte arquivos aqui'}
                                        </p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500">ou clique para selecionar • Qualquer tipo de arquivo</p>
                                    </div>

                                    {/* File List */}
                                    {uploadedFiles.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Paperclip size={12} /> {uploadedFiles.length} arquivo{uploadedFiles.length > 1 ? 's' : ''}
                                                </h4>
                                            </div>
                                            {uploadedFiles.map(file => {
                                                const FileIcon = getFileIcon(file.mimeType);
                                                const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
                                                const downloadUrl = `${API_BASE}/api/deals/${params.id}/files/${file.id}/download`;
                                                const d = new Date(file.createdAt);
                                                return (
                                                    <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-white/[0.06] rounded-xl group hover:border-slate-300 dark:hover:border-white/10 transition-colors">
                                                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                                                            <FileIcon size={16} className="text-cyan-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-slate-700 dark:text-white truncate">{file.originalName}</p>
                                                            <p className="text-[10px] text-slate-400">
                                                                {formatFileSize(file.size)} • {d.toLocaleDateString('pt-BR')} às {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                            <a href={downloadUrl} download={file.originalName} onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors" title="Baixar">
                                                                <Download size={14} />
                                                            </a>
                                                            <button onClick={() => removeFile(file.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Excluir">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {uploadedFiles.length === 0 && (
                                        <div className="text-center py-4">
                                            <p className="text-xs text-slate-400">Nenhum arquivo adicionado ainda</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Task Creation Modal ═══ */}
            <AnimatePresence>
                {showTaskModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center"
                        onClick={() => setShowTaskModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nova Tarefa</h3>
                                <button onClick={() => setShowTaskModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Título *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Ligar para o cliente..."
                                        value={newTask.title}
                                        onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white text-sm"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data *</label>
                                    <input
                                        type="date"
                                        value={newTask.date}
                                        onChange={e => setNewTask(p => ({ ...p, date: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white text-sm dark:[color-scheme:dark]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horário *</label>
                                    <input
                                        type="time"
                                        value={newTask.time}
                                        onChange={e => setNewTask(p => ({ ...p, time: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white text-sm dark:[color-scheme:dark]"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Touch Point *</label>
                                    <select
                                        value={newTask.touchPoint}
                                        onChange={e => setNewTask(p => ({ ...p, touchPoint: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white text-sm"
                                    >
                                        <option value="">Selecionar touch point...</option>
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
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição (opcional)</label>
                                    <textarea
                                        placeholder="Detalhes da tarefa..."
                                        value={newTask.description}
                                        onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white text-sm resize-none min-h-[60px]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={() => setShowTaskModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateTask}
                                    disabled={isSubmittingTask || !newTask.title.trim() || !newTask.date || !newTask.touchPoint}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors"
                                >
                                    <Plus size={16} /> {isSubmittingTask ? "Criando..." : "Criar Tarefa"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Loss Reason Modal ═══ */}
            <AnimatePresence>
                {showLossReasonModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowLossReasonModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                                    <ThumbsDown size={20} className="text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Marcar perda</h3>
                                    <p className="text-xs text-slate-500">
                                        Explique o motivo de ter perdido para a etapa <strong>{deal.stage?.name}</strong>.
                                    </p>
                                </div>
                                <button title="Cancelar Perda" onClick={() => setShowLossReasonModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Motivo da Perda *</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1 -mr-1">
                                        {lossReasons.filter(lr => lr.funnelId === deal.funnel?.id && lr.stageId === deal.stageId).length === 0 ? (
                                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 text-center">
                                                <p className="text-sm text-slate-500">Nenhum motivo configurado para esta etapa específica.</p>
                                                <p className="text-xs text-slate-400 mt-1">Configure em <strong>Configurações &gt; Motivos de Perda</strong></p>
                                            </div>
                                        ) : (
                                            lossReasons
                                                .filter(lr => lr.funnelId === deal.funnel?.id && lr.stageId === deal.stageId)
                                                .map(reason => (
                                                    <label 
                                                        key={reason.id} 
                                                        className={`flex flex-col p-3 rounded-xl border relative cursor-pointer transition-all ${
                                                            selectedLossReasonId === reason.id 
                                                            ? 'border-red-500 bg-red-50 dark:bg-red-500/10' 
                                                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-white/20'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                                selectedLossReasonId === reason.id 
                                                                ? 'border-red-500' 
                                                                : 'border-slate-300 dark:border-slate-600'
                                                            }`}>
                                                                {selectedLossReasonId === reason.id && (
                                                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                                                )}
                                                            </div>
                                                            <span className="flex items-center gap-2 font-medium text-sm text-slate-900 dark:text-white">
                                                                {reason.name}
                                                            </span>
                                                        </div>
                                                        {reason.description && (
                                                            <p className="text-xs text-slate-500 ml-7 mt-1">{reason.description}</p>
                                                        )}
                                                    </label>
                                                ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                                <button
                                    onClick={() => setShowLossReasonModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmLoss}
                                    disabled={isSubmittingLoss || !selectedLossReasonId}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors"
                                >
                                    {isSubmittingLoss ? "Marcando..." : "Confirmar perda"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Won Confirm Modal */}
            <AnimatePresence>
                {showWonConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden"
                        >
                            <div className="flex items-center gap-4 p-6 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                                    <ThumbsUp size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Marcar venda ganha</h3>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Você tem certeza que a venda foi finalizada? Cliente já pagou a entrada?
                                </p>
                                <div className="flex items-center gap-3 mt-6">
                                    <button
                                        onClick={() => setShowWonConfirmModal(false)}
                                        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg transition-colors"
                                    >
                                        Não
                                    </button>
                                    <button
                                        onClick={() => handleUpdateDealStatus("won")}
                                        className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-lg transition-colors"
                                    >
                                        Sim
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Won Success Message overlay */}
            <AnimatePresence>
                {showWonSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4"
                    >
                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-white/20 p-8 rounded-3xl shadow-2xl text-center max-w-xl shadow-blue-500/20">
                            <h2 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500 mb-4 uppercase tracking-tight">
                                Parabéns {user?.name || "Vendedor"}!
                            </h2>
                            <p className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">
                                Vamooooooo! Uhuuuuuuuuuuuuuu! Pra cimaaaaaaaaaa! 🚀
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
