"use client";

import { useState } from "react";
import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Rocket,
    ArrowLeft,
    Search,
    Users,
    CheckSquare,
    Square,
    Eye,
    Mail,
    Phone,
    AlertCircle,
    ChevronDown,
} from "lucide-react";

export default function ActivationPage() {
    const { leads, cadences, activateLeads } = useSDRStore();
    const [search, setSearch] = useState("");
    const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
    const [selectedCadence, setSelectedCadence] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [segmentFilter, setSegmentFilter] = useState("all");

    const availableLeads = leads.filter(l => !l.cadenceId && l.status !== "opt_out");
    const segments = [...new Set(availableLeads.map(l => l.segment))];
    const activeCadences = cadences.filter(c => c.status === "active" || c.status === "draft");

    const filtered = availableLeads
        .filter(l => segmentFilter === "all" || l.segment === segmentFilter)
        .filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.company.toLowerCase().includes(search.toLowerCase()));

    const toggleAll = () => {
        if (selectedLeads.length === filtered.length) setSelectedLeads([]);
        else setSelectedLeads(filtered.map(l => l.id));
    };

    const toggleLead = (id: string) => {
        setSelectedLeads(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    };

    const handleActivate = () => {
        if (!selectedCadence || selectedLeads.length === 0) return;
        activateLeads(selectedLeads, selectedCadence);
        setSelectedLeads([]);
        setSelectedCadence("");
        setShowConfirm(false);
    };

    const selectedCadenceObj = cadences.find(c => c.id === selectedCadence);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span><span className="text-white font-medium">Ativar Leads</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center"><Rocket size={20} className="text-rose-500" /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Ativar Leads</h1>
                        <p className="text-sm text-slate-400">Selecione leads do CRM e vincule a uma cadência</p>
                    </div>
                </div>
            </motion.div>

            {/* Cadence Selection + Actions */}
            <div className="flex flex-col md:flex-row gap-3">
                <select value={selectedCadence} onChange={e => setSelectedCadence(e.target.value)} className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none min-w-[250px]">
                    <option value="">Selecionar cadência...</option>
                    {activeCadences.map(c => <option key={c.id} value={c.id}>{c.name} ({c.status})</option>)}
                </select>
                <button onClick={() => selectedCadence && selectedLeads.length > 0 && setShowConfirm(true)} disabled={!selectedCadence || selectedLeads.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                    <Rocket size={16} /> Ativar {selectedLeads.length > 0 ? `(${selectedLeads.length})` : ""}
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" placeholder="Buscar por nome ou empresa..." value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl w-full pl-10 pr-4 py-2.5 focus:border-rose-500 outline-none transition-all" />
                </div>
                <select value={segmentFilter} onChange={e => setSegmentFilter(e.target.value)} className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:border-rose-500 outline-none">
                    <option value="all">Todos Segmentos</option>
                    {segments.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Lead count & select all */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{filtered.length} lead{filtered.length !== 1 ? "s" : ""} disponívei{filtered.length !== 1 ? "s" : "l"}</span>
                <button onClick={toggleAll} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                    {selectedLeads.length === filtered.length && filtered.length > 0 ? <CheckSquare size={14} className="text-blue-400" /> : <Square size={14} />}
                    Selecionar Todos
                </button>
            </div>

            {/* Lead List */}
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <Users size={48} className="mx-auto mb-4 text-slate-600" />
                        <h3 className="text-lg font-bold text-white mb-1">Nenhum lead disponível</h3>
                        <p className="text-sm text-slate-400">Todos os leads já estão em cadências ou foram filtrados.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/30">
                        {filtered.map(lead => (
                            <div key={lead.id} onClick={() => toggleLead(lead.id)} className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-all ${selectedLeads.includes(lead.id) ? "bg-blue-500/5 border-l-2 border-l-blue-500" : "hover:bg-slate-700/10"}`}>
                                {selectedLeads.includes(lead.id) ? <CheckSquare size={18} className="text-blue-400 shrink-0" /> : <Square size={18} className="text-slate-600 shrink-0" />}
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-600 to-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">{lead.name.split(" ").map(n => n[0]).join("")}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-white">{lead.name}</div>
                                    <div className="text-[10px] text-slate-400">{lead.role} · {lead.company}</div>
                                </div>
                                <div className="text-xs text-slate-400 hidden md:block">{lead.segment}</div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    {lead.email && <Mail size={12} />}
                                    {lead.phone && <Phone size={12} />}
                                </div>
                                <div className="flex flex-wrap gap-1 hidden lg:flex">
                                    {lead.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] text-slate-400">{t}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowConfirm(false)}>
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mx-auto mb-4 flex items-center justify-center">
                                <Rocket size={28} className="text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Confirmar Ativação</h2>
                            <p className="text-sm text-slate-400 mb-6">
                                Você vai ativar <span className="text-white font-bold">{selectedLeads.length} lead{selectedLeads.length !== 1 ? "s" : ""}</span> na cadência{" "}
                                <span className="text-blue-400 font-bold">{selectedCadenceObj?.name}</span>.
                            </p>
                            {selectedCadenceObj && (
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6 text-left">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Primeira ação</div>
                                    <div className="text-sm text-slate-300">
                                        {selectedCadenceObj.nodes.find(n => n.type !== "start")?.data.label || "E-mail de apresentação"}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-300 hover:text-white transition-colors font-medium">Cancelar</button>
                            <button onClick={handleActivate} className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20">Ativar Leads</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
