"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Users,
    Plus,
    Search,
    Eye,
    Edit3,
    Trash2,
    Phone,
    Mail,
    Building2,
    MapPin,
    Globe,
    DollarSign,
    FileText,
    X,
    Star,
    StarOff,
    TrendingUp,
    Upload,
    CheckSquare,
    User,
    Briefcase,
    ChevronLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import * as Papa from "papaparse";
import * as XLSX from "xlsx";

interface Client {
    id: string;
    userId: string;
    name: string;
    company: string | null;
    companyId: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    city: string | null;
    state: string | null;
    website: string | null;
    segment: string | null;
    source: string | null;
    status: string;
    isFavorite: boolean;
    notes: string | null;
    lastContact: string | null;
    proposalCount: number;
    totalRevenue: number;
    createdAt: string;
    updatedAt: string;
    companyRef?: { id: string; name: string } | null;
    contacts?: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        role: string | null;
        isPrimary: boolean;
    }[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: "Ativo", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    inactive: { label: "Inativo", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
    prospect: { label: "Prospect", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    new_lead: { label: "Novo Lead", color: "text-red-400 bg-red-500/10 border-red-500/30" },
};

export default function ContactsPage() {
    const { toast } = useToast();
    const [clients, setClients] = useState<Client[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterSegment, setFilterSegment] = useState("all");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const [clientTasks, setClientTasks] = useState<any[]>([]);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDate, setNewTaskDate] = useState("");
    const [newTaskTime, setNewTaskTime] = useState("09:00");
    const [isSavingTask, setIsSavingTask] = useState(false);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            const res = await api<Client[]>("/api/clients");
            if (res && res.success && res.data) {
                setClients(res.data);
            }
        } catch (error) {
            console.error(error);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadClients(); }, []);

    useEffect(() => {
        if (selectedClient) {
            api<any[]>(`/api/tasks?clientId=${selectedClient.id}`).then(res => {
                if (res && res.success && res.data) setClientTasks(res.data);
            });
        } else {
            setClientTasks([]);
            setIsCreatingTask(false);
            setNewTaskTitle("");
            setNewTaskDate("");
        }
    }, [selectedClient]);

    const segments = Array.from(new Set(clients.map(c => c.segment).filter((s): s is string => Boolean(s))));

    const filtered = clients
        .filter(c => {
            const q = searchQuery.toLowerCase();
            return c.name.toLowerCase().includes(q) || (c.company || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q);
        })
        .filter(c => filterStatus === "all" || c.status === filterStatus)
        .filter(c => filterSegment === "all" || c.segment === filterSegment);

    useEffect(() => { setCurrentPage(1); }, [searchQuery, filterStatus, filterSegment]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginatedClients = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const confirmDeleteClient = async () => {
        if (!deleteTarget) return;
        try {
            const res = await api(`/api/clients/${deleteTarget.id}`, { method: "DELETE" });
            if (res.success) {
                setClients(prev => prev.filter(c => c.id !== deleteTarget.id));
                if (selectedClient?.id === deleteTarget.id) setSelectedClient(null);
            }
        } catch (e) {
            toast.error("Erro ao excluir o contato.");
        } finally {
            setDeleteTarget(null);
        }
    };

    const openContact = async (client: Client) => {
        setSelectedClient(client);
        // Mark as seen: update status from new_lead to prospect
        if (client.status === "new_lead") {
            setClients(prev => prev.map(c => c.id === client.id ? { ...c, status: "prospect" } : c));
            try {
                await api(`/api/clients/${client.id}`, { method: "PUT", body: { status: "prospect" } });
            } catch { /* non-critical */ }
        }
    };

    const toggleFavorite = async (id: string, isFav: boolean) => {
        setClients(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
        try {
            await api(`/api/clients/${id}`, { method: "PUT", body: { isFavorite: !isFav } });
        } catch (e) {
            setClients(prev => prev.map(c => c.id === id ? { ...c, isFavorite: isFav } : c));
        }
    };

    const handleCreateClientTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !newTaskTitle || !newTaskDate) return;
        setIsSavingTask(true);
        try {
            const [y, m, d] = newTaskDate.split('-');
            const [h, min] = newTaskTime.split(':');
            const dt = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min));
            const res = await api<any>("/api/tasks", {
                method: "POST",
                body: { title: newTaskTitle, clientId: selectedClient.id, date: dt.toISOString() }
            });
            if (res.success && res.data) {
                setClientTasks([...clientTasks, res.data]);
                setIsCreatingTask(false);
                setNewTaskTitle(""); setNewTaskDate(""); setNewTaskTime("09:00");
            }
        } catch (e) { console.error(e); } finally { setIsSavingTask(false); }
    };

    const toggleClientTaskStatus = async (task: any) => {
        const ns = task.status === "completed" ? "pending" : "completed";
        setClientTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: ns } : t));
        try { await api(`/api/tasks/${task.id}`, { method: "PUT", body: { status: ns } }); }
        catch { setClientTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t)); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            let data: any[] = [];
            const fn = file.name.toLowerCase();
            if (fn.endsWith(".csv")) {
                data = await new Promise<any[]>((resolve, reject) => {
                    Papa.parse(file, { header: true, skipEmptyLines: true, complete: r => resolve(r.data), error: reject });
                });
            } else if (fn.endsWith(".xlsx") || fn.endsWith(".xls")) {
                const buf = await file.arrayBuffer();
                const wb = XLSX.read(buf, { type: "array" });
                data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            }
            if (!data.length) { toast.warning("Nenhum dado encontrado."); return; }
            const payload = data.map(row => {
                const g = (keys: string[]) => { const k = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim())); return k ? String(row[k]).trim() : undefined; };
                return { name: g(["nome", "name", "cliente", "contato"]) || "Contato Importado", email: g(["email", "e-mail"]), phone: g(["telefone", "celular", "whatsapp", "phone"]), company: g(["empresa", "company"]), segment: g(["segmento", "setor"]), source: "Importação" };
            });
            const res = await api("/api/clients/bulk", { method: "POST", body: { clients: payload } });
            if (res.success) { toast.success("Importação concluída!"); loadClients(); }
        } catch { toast.error("Erro ao processar o arquivo."); }
        finally { if (fileInputRef.current) fileInputRef.current.value = ""; setIsImporting(false); }
    };

    const totalRevenue = clients.filter(c => c.status === "active").reduce((s, c) => s + c.totalRevenue, 0);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/crm/clients" className="flex items-center gap-1 text-slate-500 hover:text-slate-300 transition-colors text-sm mr-1">
                            <ChevronLeft size={16} />
                        </Link>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <User size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Contatos</h1>
                            <p className="text-sm text-slate-400">Gerencie seus contatos e leads</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.xls" className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-all border border-white/10 disabled:opacity-50">
                            <Upload size={16} /> {isImporting ? "Importando..." : "Importar"}
                        </button>
                        <Link href="/dashboard/crm/clients/contacts/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                            <Plus size={16} /> Novo Contato
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Contatos", value: clients.length, icon: User, color: "text-blue-400" },
                    { label: "Ativos", value: clients.filter(c => c.status === "active").length, icon: TrendingUp, color: "text-blue-400" },
                    { label: "Prospects", value: clients.filter(c => c.status === "prospect").length, icon: Star, color: "text-amber-400" },
                    { label: "Receita Total", value: `R$ ${(totalRevenue / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-purple-400" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <span className="text-xl font-bold text-white block">{s.value}</span>
                        <span className="text-[10px] uppercase tracking-widest text-slate-600">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Search + Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar por nome, empresa ou e-mail..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40" />
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todos status</option>
                    <option value="active">Ativos</option>
                    <option value="prospect">Prospects</option>
                    <option value="inactive">Inativos</option>
                </select>
                <select value={filterSegment} onChange={e => setFilterSegment(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todos segmentos</option>
                    {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/[0.04] bg-slate-900/50">
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-8"></th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Contato</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hidden lg:table-cell">Dados</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hidden md:table-cell">Empresa</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hidden md:table-cell">Segmento</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                            <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-16">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                        {paginatedClients.map(c => (
                            <tr
                                key={c.id}
                                onClick={() => openContact(c)}
                                className={`transition-colors group cursor-pointer ${
                                    c.status === "new_lead"
                                        ? "bg-red-500/[0.04] hover:bg-red-500/[0.07] border-l-2 border-red-500/40"
                                        : "hover:bg-white/[0.02]"
                                }`}
                            >
                                <td className="px-5 py-3">
                                    <button onClick={() => toggleFavorite(c.id, c.isFavorite)} className="text-slate-700 hover:text-amber-400 transition-colors">
                                        {c.isFavorite ? <Star size={14} className="text-amber-400 fill-amber-400" /> : <StarOff size={14} />}
                                    </button>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                            {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-white block">{c.name}</span>
                                            {c.role && <span className="text-[10px] text-slate-500 flex items-center gap-1"><Briefcase size={9} /> {c.role}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3 hidden lg:table-cell">
                                    <div className="space-y-1">
                                        <span className="text-[11px] text-slate-400 flex items-center gap-1"><Mail size={10} /> {c.email || "—"}</span>
                                        <span className="text-[11px] text-slate-500 flex items-center gap-1"><Phone size={10} /> {c.phone || "—"}</span>
                                    </div>
                                </td>
                                <td className="px-5 py-3 hidden md:table-cell">
                                    {c.company ? (
                                        <span className="text-xs text-slate-300 flex items-center gap-1"><Building2 size={10} className="text-slate-500" /> {c.company}</span>
                                    ) : (
                                        <span className="text-xs text-slate-600 italic">—</span>
                                    )}
                                </td>
                                <td className="px-5 py-3 hidden md:table-cell">
                                    <span className="text-xs text-slate-400">{c.segment || "—"}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusConfig[c.status]?.color || statusConfig.prospect.color}`}>{statusConfig[c.status]?.label || "Prospect"}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1">
                                        <Link href={`/dashboard/crm/clients/contacts/${c.id}/edit`} className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 transition-all opacity-0 group-hover:opacity-100"><Edit3 size={14} /></Link>
                                        <button onClick={() => setDeleteTarget({ id: c.id, name: c.name })} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="text-center py-12 text-slate-600">
                        <Users size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhum contato encontrado</p>
                    </div>
                )}
                {filtered.length > 0 && (
                    <div className="p-4 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/20">
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span>Mostrar</span>
                            <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-800 border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none">
                                <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                            </select>
                            <span>por página</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400 mr-2">Página {currentPage} de {totalPages || 1}</span>
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 text-sm font-medium">Anterior</button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 text-sm font-medium">Próxima</button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ═══ CONTACT DETAIL DRAWER ═══ */}
            <AnimatePresence>
                {selectedClient && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={() => setSelectedClient(null)}>
                        <motion.div
                            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 350 }}
                            onClick={e => e.stopPropagation()}
                            className="absolute right-0 top-0 h-full w-full max-w-lg bg-slate-900 border-l border-white/10 shadow-2xl overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusConfig[selectedClient.status]?.color || statusConfig.prospect.color}`}>{statusConfig[selectedClient.status]?.label || "Prospect"}</span>
                                    <button onClick={() => setSelectedClient(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400"><X size={18} /></button>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-lg font-bold">
                                        {selectedClient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{selectedClient.name}</h2>
                                        <p className="text-sm text-slate-400">{selectedClient.role || ""} {selectedClient.company ? `· ${selectedClient.company}` : ""}</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                                            <span className="text-lg font-bold text-white block">{selectedClient.proposalCount}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-slate-600">Propostas</span>
                                        </div>
                                        <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                                            <span className="text-lg font-bold text-blue-400 block">R$ {(selectedClient.totalRevenue / 1000).toFixed(0)}k</span>
                                            <span className="text-[9px] uppercase tracking-widest text-slate-600">Receita</span>
                                        </div>
                                        <div className="p-3 bg-slate-800/50 rounded-xl text-center">
                                            <span className="text-sm font-bold text-white block">{selectedClient.lastContact || "—"}</span>
                                            <span className="text-[9px] uppercase tracking-widest text-slate-600">Contato</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">Informações de Contato</h3>
                                        <div className="space-y-2">
                                            {[
                                                { icon: Mail, value: selectedClient.email },
                                                { icon: Phone, value: selectedClient.phone },
                                                { icon: MapPin, value: selectedClient.city && selectedClient.state ? `${selectedClient.city}, ${selectedClient.state}` : null },
                                                { icon: Globe, value: selectedClient.website },
                                                { icon: Building2, value: selectedClient.company },
                                            ].filter(i => i.value).map(item => (
                                                <div key={item.value} className="flex items-center gap-3 p-2.5 bg-slate-800/30 rounded-lg">
                                                    <item.icon size={14} className="text-slate-500 shrink-0" />
                                                    <span className="text-sm text-slate-300">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: "Segmento", value: selectedClient.segment },
                                            { label: "Origem", value: selectedClient.source },
                                            { label: "Cadastro", value: new Date(selectedClient.createdAt).toLocaleDateString('pt-BR') },
                                            { label: "Cargo", value: selectedClient.role },
                                        ].filter(d => d.value).map(d => (
                                            <div key={d.label} className="p-3 bg-slate-800/30 rounded-xl">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 block mb-1">{d.label}</span>
                                                <span className="text-sm text-white">{d.value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedClient.notes && (
                                        <div>
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Observações</h3>
                                            <p className="text-sm text-slate-400 p-3 bg-slate-800/30 rounded-xl">{selectedClient.notes}</p>
                                        </div>
                                    )}

                                    {/* Tasks */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-600 flex items-center gap-2">
                                                <CheckSquare size={12} className="text-blue-400" /> Tarefas
                                            </h3>
                                            <button onClick={() => setIsCreatingTask(!isCreatingTask)} className="text-[10px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                                                {isCreatingTask ? "Cancelar" : "+ Nova"}
                                            </button>
                                        </div>
                                        {isCreatingTask && (
                                            <form onSubmit={handleCreateClientTask} className="mb-4 p-3 bg-slate-800/40 border border-white/10 rounded-xl space-y-3">
                                                <input type="text" required value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Título da tarefa" className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                                                <div className="flex gap-3">
                                                    <input type="date" required value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                                                    <input type="time" required value={newTaskTime} onChange={e => setNewTaskTime(e.target.value)} className="w-24 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
                                                </div>
                                                <button type="submit" disabled={isSavingTask || !newTaskTitle || !newTaskDate} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-lg disabled:opacity-50">{isSavingTask ? "Salvando..." : "Agendar"}</button>
                                            </form>
                                        )}
                                        <div className="space-y-2">
                                            {clientTasks.length === 0 && !isCreatingTask ? (
                                                <p className="text-sm text-slate-500 italic p-3 text-center bg-slate-800/20 rounded-xl">Sem tarefas.</p>
                                            ) : clientTasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(task => {
                                                const done = task.status === "completed";
                                                const late = !done && new Date(task.date).getTime() < Date.now();
                                                return (
                                                    <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border ${done ? 'bg-slate-800/20 border-transparent opacity-60' : late ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-800/40 border-white/5'}`}>
                                                        <button onClick={() => toggleClientTaskStatus(task)} className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${done ? 'bg-blue-500 border-blue-500' : late ? 'border-red-400' : 'border-slate-500 hover:border-blue-400'}`}>
                                                            {done && <CheckSquare size={10} className="text-white" />}
                                                        </button>
                                                        <div className="min-w-0">
                                                            <p className={`text-sm font-medium truncate ${done ? 'line-through text-slate-400' : late ? 'text-red-400' : 'text-slate-200'}`}>{task.title}</p>
                                                            <p className={`text-xs ${late ? 'text-red-500' : 'text-slate-500'}`}>{new Date(task.date).toLocaleDateString('pt-BR')} às {new Date(task.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-white/[0.06]">
                                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm"><FileText size={14} /> Criar Proposta</button>
                                        <button onClick={() => setDeleteTarget({ id: selectedClient.id, name: selectedClient.name })} className="px-4 py-2.5 flex items-center justify-center text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-white/10 hover:border-red-500/20 transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-red-500/10">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white text-center mb-2">Excluir Contato</h3>
                            <p className="text-sm text-slate-400 text-center mb-1">Tem certeza que deseja excluir o contato</p>
                            <p className="text-sm font-bold text-red-400 text-center mb-4">"{deleteTarget.name}"?</p>
                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 mb-6">
                                <p className="text-xs text-red-400 text-center font-medium">⚠️ Esta ação é destrutiva e irreversível. Todos os dados deste contato serão permanentemente removidos.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">Cancelar</button>
                                <button onClick={confirmDeleteClient} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"><Trash2 size={14} /> Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
