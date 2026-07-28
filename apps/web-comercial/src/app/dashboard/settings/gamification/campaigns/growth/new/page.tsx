"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { api } from "@/lib/api";
import {
    ChevronLeft,
    Rocket,
    Save,
    CheckCircle2,
    ToggleLeft,
    ToggleRight,
    Trophy,
    DollarSign,
    Gift,
    Users,
    Info,
    TrendingUp,
    Target,
    ListTodo,
    Check,
    ChevronDown,
    Loader2
} from "lucide-react";

interface User {
    id: string;
    name: string;
    role: string;
    email?: string;
    position?: string;
    avatarUrl?: string;
}

interface FunnelStage {
    id: string;
    name: string;
    color: string;
}

interface Funnel {
    id: string;
    name: string;
    stages: FunnelStage[];
}

export default function NewGrowthCampaignPage() {
    // Data Loading
    const [isLoading, setIsLoading] = useState(true);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [availableFunnels, setAvailableFunnels] = useState<Funnel[]>([]);

    // Basic Info
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    
    // Selections
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [selectedFunnelId, setSelectedFunnelId] = useState<string>("");
    
    // Modules Toggles
    const [gamificationEnabled, setGamificationEnabled] = useState(false);
    const [commissionEnabled, setCommissionEnabled] = useState(false);
    const [rewardsEnabled, setRewardsEnabled] = useState(false);

    // Gamification Settings
    const [funnelKpiEnabled, setFunnelKpiEnabled] = useState(true);
    const [taskKpiEnabled, setTaskKpiEnabled] = useState(false);

    // Stages Config
    const [stageConfigs, setStageConfigs] = useState<Record<string, { active: boolean, points: number, goal: number }>>({});

    // Commission Settings
    const [commissionModel, setCommissionModel] = useState("percentage");

    // UI States
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [usersRes, funnelsRes] = await Promise.all([
                    api<User[]>("/api/users", { method: "GET" }),
                    api<Funnel[]>("/api/funnels", { method: "GET" })
                ]);
                
                if (usersRes?.success && usersRes.data) {
                    const growthUsers = usersRes.data.filter(u => {
                        const isDev = u.email === "fcesarf@hotmail.com" || 
                            (u.position && (
                                u.position.toLowerCase().includes("dev") || 
                                u.position.toLowerCase().includes("programador") ||
                                u.position.toLowerCase().includes("tech") ||
                                u.position.toLowerCase().includes("fullstack") ||
                                u.position.toLowerCase().includes("engenheiro")
                            ));
                        return (u.role === "MANAGER" || u.role === "USER") && !isDev;
                    });
                    setAvailableUsers(growthUsers);
                }
                
                if (funnelsRes?.success && funnelsRes.data) {
                    setAvailableFunnels(funnelsRes.data);
                }
            } catch (err) {
                console.error("Failed to load users or funnels", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const toggleUser = (id: string) => {
        setSelectedUsers(prev => 
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    const selectedFunnel = availableFunnels.find(f => f.id === selectedFunnelId);

    // Initialize stage configs when funnel changes
    useEffect(() => {
        if (selectedFunnel) {
            const initialConfigs: Record<string, { active: boolean, points: number, goal: number }> = {};
            selectedFunnel.stages.forEach(stage => {
                initialConfigs[stage.id] = { active: false, points: 10, goal: 0 };
            });
            setStageConfigs(initialConfigs);
        }
    }, [selectedFunnelId]);

    const updateStageConfig = (stageId: string, field: 'active' | 'points' | 'goal', value: any) => {
        setStageConfigs(prev => ({
            ...prev,
            [stageId]: {
                ...prev[stageId],
                [field]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 size={32} className="animate-spin text-slate-500" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto pb-32">
            {/* Header Sticky */}
            <div className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-md pt-4 pb-4 mb-8 border-b border-white/[0.06] -mx-6 px-6 md:-mx-10 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link 
                        href="/dashboard/settings/gamification/campaigns/growth" 
                        className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <Rocket size={16} className="text-blue-500" />
                            <h1 className="text-xl font-bold text-white tracking-tight">Nova Campanha</h1>
                        </div>
                        <p className="text-sm text-slate-400">Configuração completa da campanha de Growth</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-all border border-slate-700">
                        <Save size={16} /> Salvar Rascunho
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20">
                        <CheckCircle2 size={16} /> Publicar Campanha
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {/* 1. Dados Básicos */}
                <section className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Info size={16} className="text-blue-500" />
                        </div>
                        <h2 className="text-lg font-bold text-white">1. Informações Básicas</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Nome da Campanha <span className="text-blue-400">*</span></label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Caçadores de Leads Q3" className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Descrição (Opcional)</label>
                            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o objetivo principal da campanha..." className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 resize-none" />
                        </div>
                        
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Data de Início <span className="text-blue-400">*</span></label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" style={{ colorScheme: "dark" }} />
                        </div>
                        
                        <div>
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Data de Término <span className="text-blue-400">*</span></label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40" style={{ colorScheme: "dark" }} />
                        </div>

                        {/* Funnel Selection */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                                Funil de Vendas Alvo <span className="text-blue-400">*</span>
                            </label>
                            <select 
                                value={selectedFunnelId} 
                                onChange={e => setSelectedFunnelId(e.target.value)} 
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Selecione o funil cujas etapas farão parte desta campanha...</option>
                                {availableFunnels.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Participants Selection */}
                        <div className="md:col-span-2 relative">
                            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2 flex items-center gap-2">
                                <Users size={14} /> Participantes da Campanha
                            </label>
                            
                            <div 
                                onClick={() => setShowUserDropdown(!showUserDropdown)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-white/[0.08] rounded-xl text-sm text-white cursor-pointer flex justify-between items-center hover:border-blue-500/40 transition-colors"
                            >
                                <span className={selectedUsers.length === 0 ? "text-slate-500" : "text-white"}>
                                    {selectedUsers.length === 0 
                                        ? "Selecione os usuários (vendedores, pré-vendedores)..." 
                                        : `${selectedUsers.length} participante(s) selecionado(s)`}
                                </span>
                                <ChevronDown size={16} className={`text-slate-500 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                            </div>

                            <AnimatePresence>
                                {showUserDropdown && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute z-10 top-full left-0 right-0 mt-2 bg-slate-800 border border-white/[0.08] rounded-xl shadow-2xl max-h-60 overflow-y-auto"
                                    >
                                        <div className="p-2 space-y-1">
                                            {availableUsers.length === 0 ? (
                                                <div className="p-3 text-sm text-slate-500 text-center">Nenhum usuário encontrado.</div>
                                            ) : (
                                                availableUsers.map(user => {
                                                    const isSelected = selectedUsers.includes(user.id);
                                                    return (
                                                        <div 
                                                            key={user.id} 
                                                            onClick={() => toggleUser(user.id)}
                                                            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-slate-700/50 text-slate-300'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                                                    {user.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium">{user.name}</div>
                                                                    <div className="text-[11px] opacity-70">{user.role || 'Usuário'}</div>
                                                                </div>
                                                            </div>
                                                            {isSelected && <Check size={16} />}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </section>

                {/* 2. Gamificação */}
                <section className={`border rounded-2xl transition-colors duration-300 ${gamificationEnabled ? 'bg-slate-800/40 border-amber-500/30' : 'bg-slate-900/30 border-white/[0.06]'}`}>
                    <div className="p-6 md:p-8 flex items-start justify-between cursor-pointer" onClick={() => setGamificationEnabled(!gamificationEnabled)}>
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${gamificationEnabled ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500' : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                                <Trophy size={20} />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold transition-colors ${gamificationEnabled ? 'text-white' : 'text-slate-400'}`}>Módulo de Gamificação</h2>
                                <p className="text-sm text-slate-500 mt-1">Pontos, conquistas, níveis e ranking interativo.</p>
                            </div>
                        </div>
                        <button className={`p-2 rounded-lg transition-colors ${gamificationEnabled ? 'text-amber-500 bg-amber-500/10' : 'text-slate-600 hover:text-slate-400'}`}>
                            {gamificationEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {gamificationEnabled && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="p-6 md:p-8 pt-0 border-t border-white/[0.06] mt-4 space-y-6">
                                    
                                    {/* Sub-block: Funnel KPIs */}
                                    <div className="bg-slate-900/50 rounded-xl p-5 border border-white/[0.04]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <Target size={16} className="text-amber-400" />
                                                <h3 className="text-[13px] font-bold uppercase tracking-widest text-slate-300">KPIs de Funil</h3>
                                            </div>
                                            <button onClick={() => setFunnelKpiEnabled(!funnelKpiEnabled)} className={`text-sm flex items-center gap-1 ${funnelKpiEnabled ? 'text-amber-400' : 'text-slate-500'}`}>
                                                {funnelKpiEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} Ativo
                                            </button>
                                        </div>
                                        {funnelKpiEnabled && (
                                            <div className="space-y-4">
                                                <p className="text-sm text-slate-400 mb-4">
                                                    Defina pontuação para avanços de etapa no pipeline. Selecione quais etapas farão parte da meta.
                                                </p>

                                                {!selectedFunnel ? (
                                                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm text-center">
                                                        Por favor, selecione um Funil de Vendas nas Informações Básicas primeiro.
                                                    </div>
                                                ) : (
                                                    <div className="border border-white/[0.06] rounded-xl overflow-hidden bg-slate-800/30">
                                                        <div className="grid grid-cols-[auto_1fr_100px_100px] gap-4 p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/[0.06] bg-slate-900/50">
                                                            <div className="w-10 text-center">Ativa</div>
                                                            <div>Etapa do Funil</div>
                                                            <div className="text-center">Pontos</div>
                                                            <div className="text-center">Meta (Qtd)</div>
                                                        </div>
                                                        
                                                        {selectedFunnel.stages.map((stage) => {
                                                            const config = stageConfigs[stage.id] || { active: false, points: 10, goal: 0 };
                                                            return (
                                                                <div key={stage.id} className={`grid grid-cols-[auto_1fr_100px_100px] gap-4 p-4 items-center border-b border-white/[0.02] last:border-0 transition-colors ${config.active ? 'bg-amber-500/5' : ''}`}>
                                                                    <div className="w-10 flex justify-center">
                                                                        <button 
                                                                            onClick={() => updateStageConfig(stage.id, 'active', !config.active)}
                                                                            className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${config.active ? 'bg-amber-500 text-white' : 'bg-slate-700 border border-slate-600'}`}
                                                                        >
                                                                            {config.active && <Check size={12} strokeWidth={3} />}
                                                                        </button>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#64748b' }} />
                                                                        <span className={`text-sm font-medium ${config.active ? 'text-white' : 'text-slate-400'}`}>{stage.name}</span>
                                                                    </div>
                                                                    <div>
                                                                        <input 
                                                                            type="number" 
                                                                            value={config.points} 
                                                                            onChange={(e) => updateStageConfig(stage.id, 'points', Number(e.target.value))}
                                                                            disabled={!config.active}
                                                                            className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-sm text-center text-white disabled:opacity-50 focus:outline-none focus:border-amber-500/50" 
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <input 
                                                                            type="number" 
                                                                            value={config.goal} 
                                                                            onChange={(e) => updateStageConfig(stage.id, 'goal', Number(e.target.value))}
                                                                            disabled={!config.active}
                                                                            className="w-full px-3 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-sm text-center text-white disabled:opacity-50 focus:outline-none focus:border-amber-500/50" 
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Sub-block: Task KPIs */}
                                    <div className="bg-slate-900/50 rounded-xl p-5 border border-white/[0.04]">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <ListTodo size={16} className="text-amber-400" />
                                                <h3 className="text-[13px] font-bold uppercase tracking-widest text-slate-300">KPIs de Tarefas</h3>
                                            </div>
                                            <button onClick={() => setTaskKpiEnabled(!taskKpiEnabled)} className={`text-sm flex items-center gap-1 ${taskKpiEnabled ? 'text-amber-400' : 'text-slate-500'}`}>
                                                {taskKpiEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />} Ativo
                                            </button>
                                        </div>
                                        {taskKpiEnabled && (
                                            <div className="text-sm text-slate-400">
                                                Configuração de pontuação para e-mails, ligações e follow-ups rastreados pelo CRM.
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* 3. Comissionamento */}
                <section className={`border rounded-2xl transition-colors duration-300 ${commissionEnabled ? 'bg-slate-800/40 border-emerald-500/30' : 'bg-slate-900/30 border-white/[0.06]'}`}>
                    <div className="p-6 md:p-8 flex items-start justify-between cursor-pointer" onClick={() => setCommissionEnabled(!commissionEnabled)}>
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${commissionEnabled ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold transition-colors ${commissionEnabled ? 'text-white' : 'text-slate-400'}`}>Módulo de Comissionamento</h2>
                                <p className="text-sm text-slate-500 mt-1">Regras financeiras, percentuais e comissão parcial por etapa.</p>
                            </div>
                        </div>
                        <button className={`p-2 rounded-lg transition-colors ${commissionEnabled ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-600 hover:text-slate-400'}`}>
                            {commissionEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {commissionEnabled && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="p-6 md:p-8 pt-0 border-t border-white/[0.06] mt-4 space-y-6">
                                    
                                    <div>
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Modelo de Comissão</label>
                                        <select value={commissionModel} onChange={e => setCommissionModel(e.target.value)} className="w-full md:w-1/2 px-4 py-3 bg-slate-900/50 border border-white/[0.08] rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/40 appearance-none cursor-pointer">
                                            <option value="percentage">Percentual sobre Receita (%)</option>
                                            <option value="fixed">Valor Fixo por Fechamento (R$)</option>
                                            <option value="tiered">Tabela Escalonada (por faixa de Ticket)</option>
                                        </select>
                                    </div>

                                    {commissionModel === 'percentage' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/50 p-5 rounded-xl border border-white/[0.04]">
                                            <div>
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Percentual Base</label>
                                                <div className="relative">
                                                    <input type="number" defaultValue={5} className="w-full px-4 py-2.5 bg-slate-800 border border-white/[0.08] rounded-lg text-sm text-white pr-10 focus:outline-none focus:border-emerald-500/40" />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 block mb-2 flex items-center gap-1">Acelerador (Bater 120% Meta) <TrendingUp size={12} className="text-emerald-400"/></label>
                                                <div className="relative">
                                                    <input type="number" defaultValue={1.5} className="w-full px-4 py-2.5 bg-slate-800 border border-white/[0.08] rounded-lg text-sm text-white pr-10 focus:outline-none focus:border-emerald-500/40" />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">x</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                {/* 4. Premiação */}
                <section className={`border rounded-2xl transition-colors duration-300 ${rewardsEnabled ? 'bg-slate-800/40 border-purple-500/30' : 'bg-slate-900/30 border-white/[0.06]'}`}>
                    <div className="p-6 md:p-8 flex items-start justify-between cursor-pointer" onClick={() => setRewardsEnabled(!rewardsEnabled)}>
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${rewardsEnabled ? 'bg-purple-500/10 border border-purple-500/20 text-purple-500' : 'bg-slate-800 border border-slate-700 text-slate-500'}`}>
                                <Gift size={20} />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold transition-colors ${rewardsEnabled ? 'text-white' : 'text-slate-400'}`}>Módulo de Premiação</h2>
                                <p className="text-sm text-slate-500 mt-1">Catálogo de prêmios resgatáveis usando pontos.</p>
                            </div>
                        </div>
                        <button className={`p-2 rounded-lg transition-colors ${rewardsEnabled ? 'text-purple-500 bg-purple-500/10' : 'text-slate-600 hover:text-slate-400'}`}>
                            {rewardsEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {rewardsEnabled && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="p-6 md:p-8 pt-0 border-t border-white/[0.06] mt-4">
                                    <div className="bg-slate-900/50 rounded-xl p-6 border border-white/[0.04] text-center border-dashed border-2">
                                        <Gift size={32} className="mx-auto mb-3 text-slate-600" />
                                        <h3 className="text-sm font-semibold text-white mb-1">Selecione Prêmios da Biblioteca</h3>
                                        <p className="text-xs text-slate-400 mb-4">Os participantes poderão resgatar prêmios com base nos pontos acumulados na gamificação.</p>
                                        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-white font-medium transition-colors border border-slate-600">
                                            Abrir Catálogo Global
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

            </div>
        </div>
    );
}
