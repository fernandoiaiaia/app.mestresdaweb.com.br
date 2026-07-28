"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    Building2,
    Plus,
    Search,
    Trash2,
    Phone,
    Mail,
    Globe,
    MapPin,
    X,
    User,
    Users,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Hash,
    Tag,
    AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

interface CompanyContact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string | null;
    status: string;
}

interface Company {
    id: string;
    userId: string;
    name: string;
    cnpj: string | null;
    segment: string | null;
    website: string | null;
    city: string | null;
    state: string | null;
    address: string | null;
    notes: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    clients: CompanyContact[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: "Ativa", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    inactive: { label: "Inativa", color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
    new_lead: { label: "Novo Lead", color: "text-red-400 bg-red-500/10 border-red-500/30" },
};

export default function CompaniesPage() {
    const { toast } = useToast();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSegment, setFilterSegment] = useState("all");
    const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const loadCompanies = async () => {
        setIsLoading(true);
        try {
            const res = await api<Company[]>("/api/companies");
            if (res?.success && res.data) setCompanies(res.data);
        } catch (e) {
            console.error(e);
            setCompanies([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { loadCompanies(); }, []);

    const segments = Array.from(new Set(companies.map(c => c.segment).filter((s): s is string => Boolean(s))));

    const filtered = companies
        .filter(c => {
            const q = searchQuery.toLowerCase();
            return c.name.toLowerCase().includes(q) || (c.cnpj || "").includes(q);
        })
        .filter(c => filterSegment === "all" || c.segment === filterSegment);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Reset to page 1 when filters change
    const handleSearch = (v: string) => { setSearchQuery(v); setCurrentPage(1); };
    const handleSegmentFilter = (v: string) => { setFilterSegment(v); setCurrentPage(1); };
    const handlePageSize = (v: number) => { setPageSize(v); setCurrentPage(1); };

    const expandCompany = async (company: Company) => {
        const isExpanding = expandedCompany !== company.id;
        setExpandedCompany(isExpanding ? company.id : null);
        // Mark as seen on first expand
        if (isExpanding && company.status === "new_lead") {
            setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: "active" } : c));
            try {
                await api(`/api/companies/${company.id}`, { method: "PUT", body: { status: "active" } });
            } catch { /* non-critical */ }
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const res = await api(`/api/companies/${deleteTarget.id}`, { method: "DELETE" });
            if (res.success) {
                setCompanies(prev => prev.filter(c => c.id !== deleteTarget.id));
                if (selectedCompany?.id === deleteTarget.id) setSelectedCompany(null);
            }
        } catch (e) {
            toast.error("Erro ao excluir a empresa.");
        } finally {
            setDeleteTarget(null);
        }
    };

    const totalContacts = companies.reduce((s, c) => s + c.clients.length, 0);

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
                            <Building2 size={20} className="text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Empresas</h1>
                            <p className="text-sm text-slate-400">Gerencie empresas e seus contatos vinculados</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard/crm/clients/companies/new" className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                            <Plus size={16} /> Nova Empresa
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total Empresas", value: companies.length, icon: Building2, color: "text-blue-400" },
                    { label: "Contatos Vinculados", value: totalContacts, icon: Users, color: "text-blue-400" },
                    { label: "Segmentos", value: segments.length, icon: Tag, color: "text-purple-400" },
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
                    <input type="text" placeholder="Buscar empresa ou CNPJ..." value={searchQuery} onChange={e => handleSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40" />
                </div>
                <select value={filterSegment} onChange={e => handleSegmentFilter(e.target.value)} className="px-3 py-2.5 bg-slate-800/50 border border-white/[0.08] rounded-xl text-sm text-slate-300 focus:outline-none">
                    <option value="all">Todos segmentos</option>
                    {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Company List */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {paginated.length === 0 && (
                    <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl text-center py-12 text-slate-600">
                        <Building2 size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma empresa encontrada</p>
                    </div>
                )}

                {paginated.map(company => (
                    <div
                        key={company.id}
                        className={`rounded-2xl overflow-hidden transition-all ${
                            company.status === "new_lead"
                                ? "bg-red-500/[0.04] border border-red-500/30"
                                : "bg-slate-800/40 border border-white/[0.06]"
                        }`}
                    >
                        {/* Company Header */}
                        <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors">
                        <button
                                onClick={() => expandCompany(company)}
                                className="flex items-center gap-4 flex-1 text-left"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {company.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">{company.name}</h3>
                                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-500">
                                        <span className="flex items-center gap-1"><Users size={10} /> {company.clients.length} contato{company.clients.length !== 1 ? 's' : ''}</span>
                                        {company.segment && <span>· {company.segment}</span>}
                                        {company.city && company.state && <span>· {company.city}, {company.state}</span>}
                                        {company.cnpj && <span className="hidden md:inline">· {company.cnpj}</span>}
                                    </div>
                                </div>
                            </button>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusConfig[company.status]?.color || statusConfig.active.color}`}>
                                    {statusConfig[company.status]?.label || "Ativa"}
                                </span>
                                <Link href={`/dashboard/crm/clients/companies/${company.id}/edit`} className="p-1.5 rounded-lg text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                                    <Edit3 size={14} />
                                </Link>
                                <button onClick={() => setDeleteTarget({ id: company.id, name: company.name })} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-all">
                                    <Trash2 size={14} />
                                </button>
                                <ChevronRight size={16} className={`text-slate-500 transition-transform duration-200 ${expandedCompany === company.id ? 'rotate-90' : ''}`} />
                            </div>
                        </div>

                        {/* Expanded Contacts */}
                        <AnimatePresence>
                            {expandedCompany === company.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="border-t border-white/[0.04]">
                                        {/* Company details */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-900/20">
                                            {company.cnpj && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    <Hash size={10} className="text-slate-600" /> {company.cnpj}
                                                </div>
                                            )}
                                            {company.website && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    <Globe size={10} className="text-slate-600" /> {company.website}
                                                </div>
                                            )}
                                            {company.city && company.state && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    <MapPin size={10} className="text-slate-600" /> {company.city}, {company.state}
                                                </div>
                                            )}
                                            {company.segment && (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    <Tag size={10} className="text-slate-600" /> {company.segment}
                                                </div>
                                            )}
                                        </div>

                                        {/* Contacts */}
                                        {company.clients.length > 0 ? (
                                            <div className="divide-y divide-white/[0.03]">
                                                {company.clients.map(c => (
                                                    <div key={c.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                                                {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-medium text-white">{c.name}</span>
                                                                {c.role && <span className="text-[10px] text-slate-500 ml-2">{c.role}</span>}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {c.email && <span className="text-[11px] text-slate-400 hidden lg:flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                                                            {c.phone && <span className="text-[11px] text-slate-500 hidden md:flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="px-5 py-4 text-center text-slate-600 text-sm italic">
                                                Nenhum contato vinculado a esta empresa.
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </motion.div>

            {/* Pagination */}
            {filtered.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-5 border-t border-white/[0.04]">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>Exibindo {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, filtered.length)} de {filtered.length}</span>
                        <select value={pageSize} onChange={e => handlePageSize(Number(e.target.value))} className="px-2 py-1 bg-slate-800/50 border border-white/[0.08] rounded-lg text-xs text-slate-300 focus:outline-none">
                            <option value={10}>10 / página</option>
                            <option value={30}>30 / página</option>
                            <option value={50}>50 / página</option>
                            <option value={100}>100 / página</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let page: number;
                            if (totalPages <= 7) {
                                page = i + 1;
                            } else if (currentPage <= 4) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 3) {
                                page = totalPages - 6 + i;
                            } else {
                                page = currentPage - 3 + i;
                            }
                            return (
                                <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                                    {page}
                                </button>
                            );
                        })}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-slate-900 border border-red-500/20 rounded-2xl p-6 max-w-md w-full shadow-2xl shadow-red-500/10">
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={24} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-white text-center mb-2">Excluir Empresa</h3>
                            <p className="text-sm text-slate-400 text-center mb-1">Tem certeza que deseja excluir a empresa</p>
                            <p className="text-sm font-bold text-red-400 text-center mb-4">"{deleteTarget.name}"?</p>
                            <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 mb-6">
                                <p className="text-xs text-red-400 text-center font-medium">⚠️ Esta ação é destrutiva e irreversível. Os contatos vinculados serão desvinculados, mas NÃO excluídos.</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors">Cancelar</button>
                                <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"><Trash2 size={14} /> Excluir</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
