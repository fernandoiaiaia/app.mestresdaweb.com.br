"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Pencil, Trash2, Plus, Save, X, Check,
    Layers, ShieldCheck, BrainCircuit, GripVertical,
    Loader2, AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

interface Phase {
    name: string;
    checklist: string[];
}

interface RoleConfig {
    name: string;
    permissions: string[];
}

interface AiRule {
    description: string;
    threshold: number;
    unit: string;
    enabled: boolean;
}

interface ProjectSettings {
    id: string | null;
    phases: Phase[];
    roles: RoleConfig[];
    aiRules: AiRule[];
}

// ═══════════════════════════════════════
// Phase Editor Modal
// ═══════════════════════════════════════

function PhaseEditorModal({
    phase, onSave, onClose
}: { phase: Phase | null; onSave: (p: Phase) => void; onClose: () => void }) {
    const [name, setName] = useState(phase?.name || "");
    const [checklist, setChecklist] = useState<string[]>(phase?.checklist || [""]);

    const addItem = () => setChecklist([...checklist, ""]);
    const removeItem = (idx: number) => setChecklist(checklist.filter((_, i) => i !== idx));
    const updateItem = (idx: number, val: string) => {
        const updated = [...checklist];
        updated[idx] = val;
        setChecklist(updated);
    };

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), checklist: checklist.filter(c => c.trim()) });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-4">{phase ? "Editar Fase" : "Nova Fase"}</h3>

                <label className="text-xs font-medium text-slate-400 mb-1 block">Nome da Fase</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Levantamento de Requisitos"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 mb-4" />

                <label className="text-xs font-medium text-slate-400 mb-2 block">Checklist de Prontidão</label>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {checklist.map((item, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <GripVertical size={14} className="text-slate-600 shrink-0" />
                            <input value={item} onChange={e => updateItem(i, e.target.value)} placeholder="Item do checklist..."
                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
                            <button onClick={() => removeItem(i)} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
                <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mb-5">
                    <Plus size={14} /> Adicionar item
                </button>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={!name.trim()}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
                        <Check size={14} /> Salvar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════
// Role Editor Modal
// ═══════════════════════════════════════

function RoleEditorModal({
    role, onSave, onClose
}: { role: RoleConfig | null; onSave: (r: RoleConfig) => void; onClose: () => void }) {
    const [name, setName] = useState(role?.name || "");
    const [permissions, setPermissions] = useState<string[]>(role?.permissions || [""]);

    const addPerm = () => setPermissions([...permissions, ""]);
    const removePerm = (idx: number) => setPermissions(permissions.filter((_, i) => i !== idx));
    const updatePerm = (idx: number, val: string) => {
        const updated = [...permissions];
        updated[idx] = val;
        setPermissions(updated);
    };

    const handleSave = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), permissions: permissions.filter(p => p.trim()) });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-4">{role ? "Editar Papel" : "Novo Papel"}</h3>

                <label className="text-xs font-medium text-slate-400 mb-1 block">Nome do Papel</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Tech Lead"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 mb-4" />

                <label className="text-xs font-medium text-slate-400 mb-2 block">Permissões</label>
                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {permissions.map((perm, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <ShieldCheck size={14} className="text-slate-600 shrink-0" />
                            <input value={perm} onChange={e => updatePerm(i, e.target.value)} placeholder="Permissão..."
                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/40 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50" />
                            <button onClick={() => removePerm(i)} className="p-1 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
                <button onClick={addPerm} className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors mb-5">
                    <Plus size={14} /> Adicionar permissão
                </button>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={!name.trim()}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
                        <Check size={14} /> Salvar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════
// AI Rule Editor Modal
// ═══════════════════════════════════════

function AiRuleEditorModal({
    rule, onSave, onClose
}: { rule: AiRule | null; onSave: (r: AiRule) => void; onClose: () => void }) {
    const [description, setDescription] = useState(rule?.description || "");
    const [threshold, setThreshold] = useState(rule?.threshold ?? 0);
    const [unit, setUnit] = useState(rule?.unit || "dias");
    const [enabled, setEnabled] = useState(rule?.enabled ?? true);

    const handleSave = () => {
        if (!description.trim()) return;
        onSave({ description: description.trim(), threshold, unit, enabled });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-white mb-4">{rule ? "Editar Regra de IA" : "Nova Regra de IA"}</h3>

                <label className="text-xs font-medium text-slate-400 mb-1 block">Descrição da Regra</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Atraso > 3 dias ativa alerta de risco"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 mb-4" />

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 block">Limiar</label>
                        <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-sm text-white focus:outline-none focus:border-blue-500/50" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-400 mb-1 block">Unidade</label>
                        <select value={unit} onChange={e => setUnit(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/40 text-sm text-white focus:outline-none focus:border-blue-500/50">
                            <option value="dias">Dias</option>
                            <option value="%">Porcentagem (%)</option>
                            <option value="horas">Horas</option>
                        </select>
                    </div>
                </div>

                <label className="flex items-center gap-3 mb-5 cursor-pointer select-none">
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-slate-700"}`}
                        onClick={() => setEnabled(!enabled)}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-sm text-slate-300">{enabled ? "Regra ativa" : "Regra desativada"}</span>
                </label>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                    <button onClick={handleSave} disabled={!description.trim()}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5">
                        <Check size={14} /> Salvar
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════
// Confirmation Dialog
// ═══════════════════════════════════════

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-red-500/10"><AlertTriangle size={20} className="text-red-400" /></div>
                    <p className="text-sm text-slate-300">{message}</p>
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-sm font-medium text-white transition-colors">Excluir</button>
                </div>
            </motion.div>
        </div>
    );
}

// ═══════════════════════════════════════
// Toast
// ═══════════════════════════════════════

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const timer = setTimeout(onClose, 3000); return () => clearTimeout(timer); }, [onClose]);
    return (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-2
            ${type === "success" ? "bg-blue-900/80 border-blue-700/40 text-blue-300" : "bg-red-900/80 border-red-700/40 text-red-300"}`}>
            {type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
            {message}
        </motion.div>
    );
}

// ═══════════════════════════════════════
// Main Page
// ═══════════════════════════════════════

export default function ProjectSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<ProjectSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [dirty, setDirty] = useState(false);

    // Modal states
    const [editingPhase, setEditingPhase] = useState<{ index: number; phase: Phase } | null>(null);
    const [newPhaseOpen, setNewPhaseOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<{ index: number; role: RoleConfig } | null>(null);
    const [newRoleOpen, setNewRoleOpen] = useState(false);
    const [editingAiRule, setEditingAiRule] = useState<{ index: number; rule: AiRule } | null>(null);
    const [newAiRuleOpen, setNewAiRuleOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ section: string; index: number; label: string } | null>(null);

    // ── Load settings ──
    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            console.log("[ProjectSettings] Loading settings...");
            const res = await api<ProjectSettings>("/api/dev-settings");
            console.log("[ProjectSettings] API response:", res);
            if (res.success && res.data) {
                setSettings(res.data);
            } else {
                console.warn("[ProjectSettings] Failed:", res);
            }
        } catch (err) {
            console.error("[ProjectSettings] Exception:", err);
        }
        setLoading(false);
    }, []);

    useEffect(() => { loadSettings(); }, [loadSettings]);

    // ── Save settings ──
    const saveSettings = async (updated: ProjectSettings) => {
        setSaving(true);
        const res = await api<ProjectSettings>("/api/dev-settings", {
            method: "PUT",
            body: { phases: updated.phases, roles: updated.roles, aiRules: updated.aiRules },
        });
        if (res.success && res.data) {
            setSettings(res.data);
            setDirty(false);
            setToast({ message: "Configurações salvas com sucesso!", type: "success" });
        } else {
            setToast({ message: "Erro ao salvar configurações.", type: "error" });
        }
        setSaving(false);
    };

    // ── Generic mutation helpers ──
    const updateAndSave = (mutator: (s: ProjectSettings) => ProjectSettings) => {
        if (!settings) return;
        const updated = mutator({ ...settings });
        setSettings(updated);
        setDirty(true);
        saveSettings(updated);
    };

    // ── Phase handlers ──
    const handleSavePhase = (phase: Phase, index?: number) => {
        updateAndSave(s => {
            const phases = [...s.phases];
            if (index !== undefined) phases[index] = phase;
            else phases.push(phase);
            return { ...s, phases };
        });
        setEditingPhase(null);
        setNewPhaseOpen(false);
    };

    // ── Role handlers ──
    const handleSaveRole = (role: RoleConfig, index?: number) => {
        updateAndSave(s => {
            const roles = [...s.roles];
            if (index !== undefined) roles[index] = role;
            else roles.push(role);
            return { ...s, roles };
        });
        setEditingRole(null);
        setNewRoleOpen(false);
    };

    // ── AI Rule handlers ──
    const handleSaveAiRule = (rule: AiRule, index?: number) => {
        updateAndSave(s => {
            const aiRules = [...s.aiRules];
            if (index !== undefined) aiRules[index] = rule;
            else aiRules.push(rule);
            return { ...s, aiRules };
        });
        setEditingAiRule(null);
        setNewAiRuleOpen(false);
    };

    // ── Toggle AI Rule enabled ──
    const toggleAiRule = (index: number) => {
        updateAndSave(s => {
            const aiRules = [...s.aiRules];
            aiRules[index] = { ...aiRules[index], enabled: !aiRules[index].enabled };
            return { ...s, aiRules };
        });
    };

    // ── Delete handler ──
    const handleDelete = () => {
        if (!confirmDelete) return;
        updateAndSave(s => {
            if (confirmDelete.section === "phase") return { ...s, phases: s.phases.filter((_, i) => i !== confirmDelete.index) };
            if (confirmDelete.section === "role") return { ...s, roles: s.roles.filter((_, i) => i !== confirmDelete.index) };
            if (confirmDelete.section === "aiRule") return { ...s, aiRules: s.aiRules.filter((_, i) => i !== confirmDelete.index) };
            return s;
        });
        setConfirmDelete(null);
    };

    // ── Loading state ──
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 size={32} className="animate-spin text-blue-400" />
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-slate-500">
                <AlertTriangle size={32} />
                <p className="text-sm">Erro ao carregar configurações.</p>
                <button onClick={loadSettings} className="text-sm text-blue-400 hover:underline">Tentar novamente</button>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-4xl">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={() => router.push("/dashboard/settings")}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors mb-3">
                    <ArrowLeft size={16} /> Voltar para Configurações
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Configurações de Projeto</h1>
                        <p className="text-slate-400 mt-1">Fases, papéis e regras de IA para seus projetos.</p>
                    </div>
                    {saving && (
                        <div className="flex items-center gap-2 text-sm text-blue-400">
                            <Loader2 size={16} className="animate-spin" /> Salvando...
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ═══ SECTION 1: Fases do Projeto ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="p-5 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-600/20">
                            <Layers size={18} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Fases do Projeto</h3>
                            <p className="text-xs text-slate-500">Configurar checklist de prontidão para cada fase.</p>
                        </div>
                    </div>
                    <button onClick={() => setNewPhaseOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 border border-blue-600/20 text-xs font-medium text-blue-400 hover:bg-blue-600/20 transition-colors">
                        <Plus size={14} /> Nova Fase
                    </button>
                </div>
                <div className="space-y-2">
                    {settings.phases.map((phase, i) => (
                        <div key={i} className="group p-3 rounded-lg bg-slate-900/40 border border-slate-700/30 hover:border-blue-600/20 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-600/20 flex items-center justify-center text-[10px] font-bold text-blue-400">{i + 1}</span>
                                    <span className="text-sm font-medium text-white">{phase.name}</span>
                                    <span className="text-[10px] text-slate-600 ml-1">{phase.checklist.length} itens</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingPhase({ index: i, phase })} className="p-1.5 rounded text-slate-500 hover:text-blue-400 transition-colors">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => setConfirmDelete({ section: "phase", index: i, label: phase.name })} className="p-1.5 rounded text-slate-500 hover:text-red-400 transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            {phase.checklist.length > 0 && (
                                <div className="mt-2 ml-8 flex flex-wrap gap-1.5">
                                    {phase.checklist.map((item, j) => (
                                        <span key={j} className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/30 text-[11px] text-slate-400">{item}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {settings.phases.length === 0 && (
                        <p className="text-sm text-slate-600 text-center py-4">Nenhuma fase configurada.</p>
                    )}
                </div>
            </motion.div>

            {/* ═══ SECTION 2: Papéis e Permissões ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="p-5 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-600/20">
                            <ShieldCheck size={18} className="text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Papéis e Permissões</h3>
                            <p className="text-xs text-slate-500">Definir permissões padrão por papel no sistema.</p>
                        </div>
                    </div>
                    <button onClick={() => setNewRoleOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 border border-blue-600/20 text-xs font-medium text-blue-400 hover:bg-blue-600/20 transition-colors">
                        <Plus size={14} /> Novo Papel
                    </button>
                </div>
                <div className="space-y-2">
                    {settings.roles.map((role, i) => (
                        <div key={i} className="group p-3 rounded-lg bg-slate-900/40 border border-slate-700/30 hover:border-blue-600/20 transition-colors">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <ShieldCheck size={14} className="text-blue-400/60" />
                                    <span className="text-sm font-medium text-white">{role.name}</span>
                                    <span className="text-[10px] text-slate-600 ml-1">{role.permissions.length} permissões</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingRole({ index: i, role })} className="p-1.5 rounded text-slate-500 hover:text-blue-400 transition-colors">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => setConfirmDelete({ section: "role", index: i, label: role.name })} className="p-1.5 rounded text-slate-500 hover:text-red-400 transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                            {role.permissions.length > 0 && (
                                <div className="mt-2 ml-6 text-xs text-slate-500">
                                    {role.permissions.join(" · ")}
                                </div>
                            )}
                        </div>
                    ))}
                    {settings.roles.length === 0 && (
                        <p className="text-sm text-slate-600 text-center py-4">Nenhum papel configurado.</p>
                    )}
                </div>
            </motion.div>

            {/* ═══ SECTION 3: Configurações de IA ═══ */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="p-5 rounded-xl bg-slate-800/40 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-600/20">
                            <BrainCircuit size={18} className="text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Configurações de IA</h3>
                            <p className="text-xs text-slate-500">Limiares para alertas automáticos da inteligência artificial.</p>
                        </div>
                    </div>
                    <button onClick={() => setNewAiRuleOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/10 border border-purple-600/20 text-xs font-medium text-purple-400 hover:bg-purple-600/20 transition-colors">
                        <Plus size={14} /> Nova Regra
                    </button>
                </div>
                <div className="space-y-2">
                    {settings.aiRules.map((rule, i) => (
                        <div key={i} className={`group p-3 rounded-lg border transition-colors
                            ${rule.enabled ? "bg-slate-900/40 border-slate-700/30 hover:border-purple-600/20" : "bg-slate-900/20 border-slate-800/30 opacity-50"}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    {/* Toggle */}
                                    <button onClick={() => toggleAiRule(i)}
                                        className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${rule.enabled ? "bg-purple-600" : "bg-slate-700"}`}>
                                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${rule.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                                    </button>
                                    <div className="min-w-0">
                                        <span className="text-sm text-slate-300 block truncate">{rule.description}</span>
                                        <span className="text-[10px] text-slate-600">Limiar: {rule.threshold}{rule.unit === "%" ? "%" : ` ${rule.unit}`}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                    <button onClick={() => setEditingAiRule({ index: i, rule })} className="p-1.5 rounded text-slate-500 hover:text-purple-400 transition-colors">
                                        <Pencil size={13} />
                                    </button>
                                    <button onClick={() => setConfirmDelete({ section: "aiRule", index: i, label: rule.description })} className="p-1.5 rounded text-slate-500 hover:text-red-400 transition-colors">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {settings.aiRules.length === 0 && (
                        <p className="text-sm text-slate-600 text-center py-4">Nenhuma regra de IA configurada.</p>
                    )}
                </div>
            </motion.div>

            {/* ═══ Stats footer ═══ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-6 py-3 text-[11px] text-slate-600">
                <span>{settings.phases.length} fases</span>
                <span>·</span>
                <span>{settings.roles.length} papéis</span>
                <span>·</span>
                <span>{settings.aiRules.filter(r => r.enabled).length} regras ativas</span>
            </motion.div>

            {/* ═══ Modals ═══ */}
            <AnimatePresence>
                {editingPhase && (
                    <PhaseEditorModal phase={editingPhase.phase}
                        onSave={p => handleSavePhase(p, editingPhase.index)} onClose={() => setEditingPhase(null)} />
                )}
                {newPhaseOpen && (
                    <PhaseEditorModal phase={null} onSave={p => handleSavePhase(p)} onClose={() => setNewPhaseOpen(false)} />
                )}
                {editingRole && (
                    <RoleEditorModal role={editingRole.role}
                        onSave={r => handleSaveRole(r, editingRole.index)} onClose={() => setEditingRole(null)} />
                )}
                {newRoleOpen && (
                    <RoleEditorModal role={null} onSave={r => handleSaveRole(r)} onClose={() => setNewRoleOpen(false)} />
                )}
                {editingAiRule && (
                    <AiRuleEditorModal rule={editingAiRule.rule}
                        onSave={r => handleSaveAiRule(r, editingAiRule.index)} onClose={() => setEditingAiRule(null)} />
                )}
                {newAiRuleOpen && (
                    <AiRuleEditorModal rule={null} onSave={r => handleSaveAiRule(r)} onClose={() => setNewAiRuleOpen(false)} />
                )}
                {confirmDelete && (
                    <ConfirmDialog
                        message={`Excluir "${confirmDelete.label}"? Esta ação não pode ser desfeita.`}
                        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
                )}
                {toast && (
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}
