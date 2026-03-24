"use client";

import { useState } from "react";
import { useSDRStore, type QualificationCriteria } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    Zap,
    ArrowLeft,
    Plus,
    Trash2,
    GripVertical,
    Flame,
    Thermometer,
    Snowflake,
    Save,
    BrainCircuit,
} from "lucide-react";

export default function QualificationPage() {
    const { criteria, thresholds, updateCriteria, updateThresholds } = useSDRStore();
    const [localCriteria, setLocalCriteria] = useState<QualificationCriteria[]>(criteria.map(c => ({ ...c })));
    const [localThresholds, setLocalThresholds] = useState({ ...thresholds });

    const handleSave = () => {
        updateCriteria(localCriteria);
        updateThresholds(localThresholds);
    };

    const addCriterion = () => {
        setLocalCriteria(c => [...c, {
            id: `crit_${Date.now()}`, name: "", description: "", type: "boolean" as const, weight: 0,
            aiPrompt: "", sortOrder: c.length,
        }]);
    };

    const removeCriterion = (id: string) => setLocalCriteria(c => c.filter(x => x.id !== id));

    const updateCriterion = (id: string, key: string, value: any) => {
        setLocalCriteria(c => c.map(x => x.id === id ? { ...x, [key]: value } : x));
    };

    const totalWeight = localCriteria.reduce((sum, c) => sum + c.weight, 0);

    const labelClass = "text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";
    const fieldClass = "bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-600";

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span><span className="text-white font-medium">Qualificação & Score</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><Zap size={20} className="text-amber-500" /></div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Qualificação & Score</h1>
                        <p className="text-sm text-slate-400">Critérios, pesos e ações por temperatura</p>
                    </div>
                </div>
                <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20"><Save size={16} /> Salvar</button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left — Temperature Triggers */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-5">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gatilhos de Temperatura</h3>

                    {/* Hot */}
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2"><Flame size={16} className="text-red-400" /><span className="text-sm font-bold text-red-400">Lead Quente</span></div>
                        <div>
                            <label className={labelClass}>Score mínimo (%)</label>
                            <input type="number" className={fieldClass} value={localThresholds.hotMin} onChange={e => setLocalThresholds(t => ({ ...t, hotMin: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Ação automática</label>
                            <select className={fieldClass} value={localThresholds.hotAction} onChange={e => setLocalThresholds(t => ({ ...t, hotAction: e.target.value }))}>
                                <option value="Agendar reunião automaticamente">Agendar reunião automaticamente</option>
                                <option value="Escalar para humano">Escalar para humano</option>
                                <option value="Continuar cadência">Continuar cadência</option>
                            </select>
                        </div>
                    </div>

                    {/* Warm */}
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2"><Thermometer size={16} className="text-amber-400" /><span className="text-sm font-bold text-amber-400">Lead Morno</span></div>
                        <div>
                            <label className={labelClass}>Score mínimo (%)</label>
                            <input type="number" className={fieldClass} value={localThresholds.warmMin} onChange={e => setLocalThresholds(t => ({ ...t, warmMin: parseInt(e.target.value) || 0 }))} />
                        </div>
                        <div>
                            <label className={labelClass}>Ação automática</label>
                            <select className={fieldClass} value={localThresholds.warmAction} onChange={e => setLocalThresholds(t => ({ ...t, warmAction: e.target.value }))}>
                                <option value="Continuar cadência e nutrir">Continuar cadência e nutrir</option>
                                <option value="Escalar para humano">Escalar para humano</option>
                                <option value="Pausar cadência">Pausar cadência</option>
                            </select>
                        </div>
                    </div>

                    {/* Cold */}
                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                        <div className="flex items-center gap-2"><Snowflake size={16} className="text-blue-400" /><span className="text-sm font-bold text-blue-400">Lead Frio</span></div>
                        <div className="text-xs text-slate-400">Score abaixo de <span className="text-white font-bold">{localThresholds.warmMin}%</span></div>
                        <div>
                            <label className={labelClass}>Ação automática</label>
                            <select className={fieldClass} value={localThresholds.coldAction} onChange={e => setLocalThresholds(t => ({ ...t, coldAction: e.target.value }))}>
                                <option value="Pausar cadência">Pausar cadência</option>
                                <option value="Continuar cadência">Continuar cadência</option>
                                <option value="Remover da cadência">Remover da cadência</option>
                            </select>
                        </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                        <div className="flex items-center gap-2 mb-2"><BrainCircuit size={14} className="text-purple-400" /><span className="text-xs font-bold text-purple-400">IA Reasoning</span></div>
                        <p className="text-xs text-slate-400">A IA analisa transcrições de ligações, respostas de e-mail e mensagens de WhatsApp para extrair dados de qualificação. Se a resposta for ambígua, o critério fica como "não informado" até confirmação.</p>
                    </div>
                </motion.div>

                {/* Right — Criteria */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Critérios de Qualificação</h3>
                        <div className={`text-xs font-bold ${totalWeight === 100 ? "text-blue-400" : "text-amber-400"}`}>{totalWeight}% / 100%</div>
                    </div>

                    <div className="space-y-3">
                        {localCriteria.map((c, i) => (
                            <div key={c.id} className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <GripVertical size={14} className="text-slate-600 cursor-grab" />
                                    <input className={`${fieldClass} flex-1`} placeholder="Nome do critério..." value={c.name} onChange={e => updateCriterion(c.id, "name", e.target.value)} />
                                    <select className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2 py-2 outline-none w-24" value={c.type} onChange={e => updateCriterion(c.id, "type", e.target.value)}>
                                        <option value="boolean">Sim/Não</option>
                                        <option value="text">Texto</option>
                                        <option value="number">Número</option>
                                    </select>
                                    <div className="flex items-center gap-1">
                                        <input type="number" min={0} max={100} className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg w-16 px-2 py-2 text-center outline-none" value={c.weight} onChange={e => updateCriterion(c.id, "weight", parseInt(e.target.value) || 0)} />
                                        <span className="text-[10px] text-slate-500">%</span>
                                    </div>
                                    <button onClick={() => removeCriterion(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 size={14} /></button>
                                </div>
                                <textarea className={`${fieldClass} min-h-[50px] resize-none text-xs`} placeholder="Prompt para a IA investigar..." value={c.aiPrompt} onChange={e => updateCriterion(c.id, "aiPrompt", e.target.value)} />
                            </div>
                        ))}
                    </div>

                    <button onClick={addCriterion} className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-700 rounded-xl text-sm text-slate-400 hover:text-white hover:border-slate-600 transition-all w-full justify-center">
                        <Plus size={14} /> Novo Critério
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
