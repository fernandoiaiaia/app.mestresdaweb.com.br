"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import {
    ArrowLeft,
    Building2,
    Calendar,
    ExternalLink,
    ChevronDown,
    CalendarPlus,
    Plus,
    Info,
    Save,
    Search,
    X,
    Check,
} from "lucide-react";

const SERVICES = [
    "Desenvolvimento",
    "Product Discovery & Strategy",
    "UX/UI Design",
    "Cloud & DevOps",
    "Integrações & Automação",
    "Inteligência Artificial",
    "Data & Analytics",
    "Modernização de Sistemas (Legacy)",
    "Staff Augmentation",
    "Growth & Optimization",
] as const;

interface Funnel {
    id: string;
    name: string;
    stages?: {
        id: string;
        name: string;
        color: string;
        orderIndex: number;
    }[];
}

interface ItemBase {
    id: string;
    name: string;
}

const TABS = [
    { id: "historico", label: "Histórico" },
    { id: "email", label: "E-mail" },
    { id: "tarefas", label: "Tarefas" },
    { id: "produtos", label: "Produtos e Serviços" },
    { id: "arquivos", label: "Arquivos" },
    { id: "propostas", label: "Propostas" }
];

export default function NewOpportunityPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Dependencies
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [clients, setClients] = useState<ItemBase[]>([]);
    const [consultants, setConsultants] = useState<ItemBase[]>([]);

    // Form State
    const [form, setForm] = useState({
        title: "",
        value: "0",
        probability: "50",
        clientId: "",
        consultantId: "",
        funnelId: "",
        stageId: "",
        expectedClose: "",
        source: "",
        priority: "medium",
        temperature: "warm"
    });

    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientForm, setNewClientForm] = useState({
        name: "",
        company: "",
        email: "",
        phone: ""
    });

    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [servicesOpen, setServicesOpen] = useState(false);
    const [initialNote, setInitialNote] = useState("");
    const [clientSearch, setClientSearch] = useState("");
    const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
    const clientDropdownRef = useRef<HTMLDivElement>(null);

    // Close client dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
                setClientDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    );
    const selectedClient = clients.find(c => c.id === form.clientId);

    const activeTab = "historico";

    const formatCurrency = (value: string) => {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(num);
    };

    const formatPhone = (value: string) => {
        let raw = value.replace(/\D/g, "");
        if (raw.length > 11) raw = raw.slice(0, 11);
        if (raw.length === 0) return "";
        if (raw.length <= 2) return `(${raw}`;
        if (raw.length <= 6) return `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
        if (raw.length <= 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
        return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    };

    useEffect(() => {
        loadDependencies();

        // Pre-fill from query params (e.g., coming from WhatsApp Inbox unknown contact)
        const urlParams = new URLSearchParams(window.location.search);
        const autoPhone = urlParams.get('phone');
        const autoName = urlParams.get('name');

        if (autoPhone || autoName) {
            setIsCreatingClient(true);
            setNewClientForm(prev => ({
                ...prev,
                name: autoName || "",
                phone: autoPhone || ""
            }));
            if (autoName && autoName !== "Novo Contato") {
                setForm(prev => ({
                    ...prev,
                    title: `Negociação - ${autoName}`
                }));
            }
        }
    }, []);

    const loadDependencies = async () => {
        setIsLoading(true);
        try {
            const [funnelsRes, clientsRes, usersRes] = await Promise.all([
                api<Funnel[]>('/api/funnels', { method: "GET" }),
                api<ItemBase[]>('/api/clients', { method: "GET" }),
                api<ItemBase[]>('/api/users', { method: "GET" })
            ]);

            const loadedFunnels = funnelsRes.data || [];
            setFunnels(loadedFunnels);
            setClients(clientsRes.data || []);
            
            const loadedUsers = (usersRes.data as any[]) || [];
            // Filtra contas para exibir unicamente pessoas da equipe Growth
            const advisors = loadedUsers.filter(u => u.allowedApps?.includes("growth"));
            setConsultants(advisors);

            // Set defaults if available
            const defaultFunnel = loadedFunnels.find(f => (f as any).isDefault) || loadedFunnels[0];
            const defaultStage = defaultFunnel?.stages?.[0]?.id || "";

            setForm(prev => ({
                ...prev,
                funnelId: defaultFunnel?.id || "",
                stageId: defaultStage
            }));

        } catch (error) {
            console.error("Erro ao carregar dependencias:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const activeFunnel = funnels.find(f => f.id === form.funnelId);
    const stages = activeFunnel?.stages || [];

    const handleSave = async () => {
        if (!form.title || (!isCreatingClient && !form.clientId) || (isCreatingClient && !newClientForm.name)) {
            toast.warning("Campos obrigatórios", "Preencha o Nome da Oportunidade e o Cliente (ou dados do Novo Cliente).");
            return;
        }

        setIsSaving(true);
        try {
            let activeClientId = form.clientId;

            // 1) Create Client Phase
            if (isCreatingClient) {
                const clientPayload = {
                    name: newClientForm.name,
                    company: newClientForm.company,
                    email: newClientForm.email,
                    phone: newClientForm.phone,
                };
                const clientRes = await api<{ id: string }>('/api/clients', {
                    method: 'POST',
                    body: clientPayload
                });

                if (clientRes.success && clientRes.data) {
                    activeClientId = clientRes.data.id;
                } else {
                    toast.error("Erro ao criar cliente", clientRes.error?.message || clientRes.message || "Tente novamente.");
                    setIsSaving(false);
                    return;
                }
            }

            // 2) Create Deal Phase
            const payload = {
                title: form.title,
                value: parseFloat(form.value) || 0,
                probability: parseInt(form.probability, 10) || 0,
                clientId: activeClientId,
                consultantId: form.consultantId || undefined,
                funnelId: form.funnelId || undefined,
                stageId: form.stageId || undefined,
                expectedClose: form.expectedClose ? new Date(form.expectedClose).toISOString() : undefined,
                priority: form.priority,
                temperature: form.temperature,
                source: form.source,
            };

            const dealRes = await api<{ id: string }>('/api/deals', {
                method: 'POST',
                body: payload
            });

            if (dealRes.success && dealRes.data) {
                const newDealId = dealRes.data.id;

                // 3) Create Initial Note Phase
                if (initialNote.trim()) {
                    await api(`/api/deals/${newDealId}/notes`, {
                        method: 'POST',
                        body: { content: initialNote.trim() }
                    });
                }

                // Navigate to the newly created deal in pipeline
                router.push(`/dashboard/crm/pipeline/${newDealId}`);
            } else {
                toast.error("Erro ao salvar", dealRes.error?.message || dealRes.message || "Tente novamente.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro fatal", "Erro ao salvar a oportunidade.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-theme(spacing.20))] items-center justify-center p-6 bg-slate-950">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-screen overflow-hidden bg-transparent text-slate-900 dark:text-slate-100">
            {/* ═══ Header ═══ */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                                {form.title || "Nova Oportunidade"}
                            </h1>
                            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-purple-500 text-white leading-none">
                                RASCUNHO
                            </span>
                        </div>
                        <div className="flex items-center text-xs text-slate-500 gap-2">
                            <span>Preencha os dados para criar este negócio</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-lg transition-colors">
                        <X size={16} /> Cancelar
                    </button>
                    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm rounded-lg transition-colors shadow-lg shadow-blue-600/20">
                        <Save size={16} /> {isSaving ? "Salvando..." : "Salvar Oportunidade"}
                    </button>
                </div>
            </div>

            {/* ═══ Funnels Visualizer ═══ */}
            <div className="px-6 py-2 border-b border-slate-200 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm overflow-x-auto flex gap-2 hide-scrollbar">
                {funnels.map(f => (
                    <button
                        key={f.id}
                        onClick={() => {
                            setForm(prev => ({
                                ...prev,
                                funnelId: f.id,
                                stageId: f.stages?.[0]?.id || ""
                            }));
                        }}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap
                            ${form.funnelId === f.id
                                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10'
                                : 'bg-white text-slate-500 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer'
                            }
                        `}
                    >
                        {f.name}
                    </button>
                ))}
            </div>

            {/* ═══ Progress Bar (Stage Visualizer) ═══ */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10 flex bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm overflow-x-auto text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <div className="flex-1 flex px-1">
                    {stages.length > 0 ? (
                        stages.map((stage, idx) => {
                            const currentIndex = stages.findIndex(s => s.id === form.stageId);
                            const isFirst = idx === 0;
                            const isLast = idx === stages.length - 1;
                            const isPast = currentIndex > -1 && idx < currentIndex;
                            const isCurrent = idx === currentIndex;

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
                                    onClick={() => setForm(p => ({ ...p, stageId: stage.id }))}
                                    className={`
                                        ${bgColor}
                                        cursor-pointer hover:brightness-95
                                        transition-all duration-300
                                        px-6 py-2 truncate relative flex-1 min-w-[120px] text-center
                                        ${isFirst ? 'rounded-l-md pl-4' : 'ml-0.5'}
                                        ${isLast ? 'rounded-r-md pr-4' : ''}
                                        ${!isLast ? `after:content-[''] after:absolute after:top-0 after:-right-3 after:border-[16px] ${afterBorder} after:border-t-transparent after:border-b-transparent after:border-r-transparent after:z-10` : ''}
                                        ${!isFirst ? `before:content-[''] before:absolute before:top-0 before:left-0 before:border-[16px] before:border-l-white/40 dark:before:border-l-slate-900/40 before:border-t-transparent before:border-b-transparent before:border-r-transparent before:-ml-[16px] before:z-10` : ''}
                                    `}
                                    title={stage.name}
                                >
                                    <span className="relative z-20 drop-shadow-sm">{stage.name}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-slate-500 text-center flex-1">Selecione um funil com etapas ativas.</div>
                    )}
                </div>
            </div>

            {/* ═══ Main Content Area ═══ */}
            <div className="flex-1 flex overflow-hidden">

                {/* ═══ Left Sidebar (Editable Details) ═══ */}
                <div className="w-[340px] border-r border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 overflow-y-auto custom-scrollbar flex-shrink-0 p-4 space-y-4">

                    {/* Negociação */}
                    <div className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/[0.06] rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Negociação</h3>
                            <ChevronDown size={16} className="text-slate-400" />
                        </div>
                        <div className="space-y-4 text-sm">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Oportunidade *</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                    placeholder="Ex: Contrato Anual Sistêmico"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 relative">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Serviços</label>
                                <button
                                    type="button"
                                    onClick={() => setServicesOpen(prev => !prev)}
                                    className="w-full min-h-[38px] px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg flex items-center gap-1.5 flex-wrap text-left hover:border-cyan-500/30 transition-all"
                                >
                                    {selectedServices.length === 0 ? (
                                        <span className="text-sm text-slate-400">Selecionar serviços...</span>
                                    ) : (
                                        selectedServices.map(s => (
                                            <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-medium text-cyan-400">
                                                {s}
                                                <span
                                                    role="button"
                                                    onClick={e => { e.stopPropagation(); setSelectedServices(prev => prev.filter(x => x !== s)); }}
                                                    className="hover:text-cyan-200 cursor-pointer"
                                                >×</span>
                                            </span>
                                        ))
                                    )}
                                    <ChevronDown size={14} className={`ml-auto text-slate-400 flex-shrink-0 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {servicesOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                                        {SERVICES.map(service => {
                                            const isSelected = selectedServices.includes(service);
                                            return (
                                                <button
                                                    key={service}
                                                    type="button"
                                                    onClick={() => setSelectedServices(prev => isSelected ? prev.filter(s => s !== service) : [...prev, service])}
                                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                                                        isSelected ? 'text-cyan-400' : 'text-slate-600 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-cyan-500 text-white' : 'border border-slate-300 dark:border-slate-600'}`}>
                                                        {isSelected && <Check size={9} strokeWidth={3} />}
                                                    </div>
                                                    {service}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor total (R$)</label>
                                <input
                                    type="text"
                                    value={formatCurrency(form.value)}
                                    onChange={e => {
                                        const raw = e.target.value.replace(/\D/g, "");
                                        const cents = parseInt(raw || "0", 10);
                                        setForm(p => ({ ...p, value: (cents / 100).toString() }));
                                    }}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Probabilidade (%)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range" min="0" max="100" step="10"
                                        value={form.probability}
                                        onChange={e => setForm(p => ({ ...p, probability: e.target.value }))}
                                        className="flex-1 accent-cyan-500 dark:[color-scheme:dark]"
                                    />
                                    <span className="text-sm font-bold w-10 text-right text-slate-900 dark:text-white">{form.probability}%</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Previsão de Fechamento</label>
                                <input
                                    type="date"
                                    value={form.expectedClose}
                                    onChange={e => setForm(p => ({ ...p, expectedClose: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white dark:[color-scheme:dark]"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fonte Origem</label>
                                <select
                                    value={form.source}
                                    onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                >
                                    <option value="">Selecionar fonte...</option>
                                    <option value="Google Ads">Google Ads</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Indicação de Clientes">Indicação de Clientes</option>
                                    <option value="Google Orgânico (SEO)">Google Orgânico (SEO)</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="Contato Direto (Site)">Contato Direto (Site)</option>
                                    <option value="Meta Ads (Facebook)">Meta Ads (Facebook)</option>
                                    <option value="Eventos & Webinars">Eventos &amp; Webinars</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prioridade</label>
                                    <select
                                        value={form.priority}
                                        onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                        className="w-full px-2 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                    >
                                        <option value="low">Baixa</option>
                                        <option value="medium">Média</option>
                                        <option value="high">Alta</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Temperatura</label>
                                    <select
                                        value={form.temperature}
                                        onChange={e => setForm(p => ({ ...p, temperature: e.target.value }))}
                                        className="w-full px-2 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                    >
                                        <option value="cold">❄️ Fria</option>
                                        <option value="warm">☀️ Morna</option>
                                        <option value="hot">🔥 Quente</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contatos / Cliente */}
                    <div className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/[0.06] rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cliente / Contato</h3>
                            <ChevronDown size={16} className="text-slate-400" />
                        </div>

                        {!isCreatingClient ? (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vincular Cliente *</label>
                                <div className="relative" ref={clientDropdownRef}>
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente por nome..."
                                        value={clientDropdownOpen ? clientSearch : (selectedClient?.name || clientSearch)}
                                        onChange={e => {
                                            setClientSearch(e.target.value);
                                            setClientDropdownOpen(true);
                                            if (form.clientId) setForm(p => ({ ...p, clientId: "" }));
                                        }}
                                        onFocus={() => setClientDropdownOpen(true)}
                                        className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white text-sm"
                                    />
                                    {form.clientId && (
                                        <button
                                            onClick={() => { setForm(p => ({ ...p, clientId: "" })); setClientSearch(""); }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                    {clientDropdownOpen && (
                                        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg shadow-xl">
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => {
                                                            setForm(p => ({ ...p, clientId: c.id }));
                                                            setClientSearch(c.name);
                                                            setClientDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-cyan-500/10 ${form.clientId === c.id ? 'bg-cyan-500/10 text-cyan-500 font-bold' : 'text-slate-700 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        {c.name}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-3 py-3 text-xs text-slate-500 text-center">Nenhum cliente encontrado</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => setIsCreatingClient(true)}
                                    className="mt-2 text-xs font-bold text-cyan-500 hover:text-cyan-600 self-start transition-colors"
                                >
                                    + Cadastrar novo cliente
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-white/5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-cyan-500 uppercase tracking-wider">Novo Cliente</span>
                                    <button onClick={() => setIsCreatingClient(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <input
                                        type="text" placeholder="Nome do Cliente *"
                                        value={newClientForm.name}
                                        onChange={e => setNewClientForm(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                    />
                                    <input
                                        type="text" placeholder="Empresa (Opcional)"
                                        value={newClientForm.company}
                                        onChange={e => setNewClientForm(p => ({ ...p, company: e.target.value }))}
                                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                    />
                                    <input
                                        type="email" placeholder="E-mail (Opcional)"
                                        value={newClientForm.email}
                                        onChange={e => setNewClientForm(p => ({ ...p, email: e.target.value }))}
                                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                    />
                                    <input
                                        type="text" placeholder="Telefone (Opcional)"
                                        value={newClientForm.phone}
                                        onChange={e => setNewClientForm(p => ({ ...p, phone: formatPhone(e.target.value) }))}
                                        className="w-full px-3 py-1.5 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Responsável */}
                    <div className="p-4 bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-white/[0.06] rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Responsável</h3>
                            <ChevronDown size={16} className="text-slate-400" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Advisor</label>
                            <select
                                value={form.consultantId}
                                onChange={e => setForm(p => ({ ...p, consultantId: e.target.value }))}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg outline-none focus:border-cyan-500 text-slate-900 dark:text-white"
                            >
                                <option value="">Atribuir advisor...</option>
                                {consultants.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ═══ Right Side (Activity & History Blocked) ═══ */}
                <div className="flex-1 flex flex-col bg-transparent">

                    <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar max-w-4xl space-y-8">

                        {/* Tabs Activity */}
                        <div>
                            <div className="flex border-b border-slate-200 dark:border-white/10 gap-6 mb-6">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        className={`pb-3 text-sm font-bold transition-all relative ${activeTab === tab.id ? 'text-cyan-500' : 'text-slate-500'}`}
                                    >
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-900/70 rounded-xl p-4 border border-slate-200 dark:border-white/[0.06] mb-8 shadow-sm">
                                <textarea
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 resize-none min-h-[80px]"
                                    placeholder="Adicione uma anotação inicial neste negócio..."
                                    value={initialNote}
                                    onChange={(e) => setInitialNote(e.target.value)}
                                />
                                <div className="flex justify-end mt-3">
                                    <span className="text-xs text-slate-400 font-medium my-auto mr-4">
                                        A anotação será salva automaticamente junto com a oportunidade.
                                    </span>
                                    <button
                                        disabled className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-sm rounded-lg"
                                    >
                                        <Plus size={16} /> Salvar Anotação
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
