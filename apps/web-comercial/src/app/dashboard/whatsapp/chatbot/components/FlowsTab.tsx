"use client";

import { useState, useEffect } from "react";
import { GitMerge, Search, Plus, X, Save, ChevronLeft, ChevronRight, Loader2, Trash2, ArrowLeft, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { api } from "@/lib/api";
import {
    listChatbotFlows, createChatbotFlow, updateChatbotFlow, deleteChatbotFlow, toggleChatbotFlow,
    listWhatsappTemplates, syncWhatsappTemplates,
    type ChatbotFlow, type Pagination, type QualificationField, type WhatsappTemplate
} from "@/lib/chatbot-api";
import { toast } from "sonner";

interface FunnelOption {
    id: string;
    name: string;
    stages: { id: string; name: string }[];
}

export function FlowsTab() {
    const [flows, setFlows] = useState<ChatbotFlow[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Templates state
    const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
    const [syncing, setSyncing] = useState(false);

    // Funnel options for form
    const [funnels, setFunnels] = useState<FunnelOption[]>([]);
    const [funnelsLoaded, setFunnelsLoaded] = useState(false);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: "",
        description: "",
        funnelId: "",
        stageId: "",
        objective: "qualify",
        outboundTemplateName: "",
        outboundPrompt: "",
        inboundPrompt: "",
        qualificationFields: [] as QualificationField[],
        handoffOnQualified: true,
        handoffOnHumanRequest: true,
        handoffAfterMessages: 10
    });
    const [submitting, setSubmitting] = useState(false);

    // New qualification field
    const [newFieldId, setNewFieldId] = useState("");
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [newFieldType, setNewFieldType] = useState<"string" | "boolean" | "number">("string");

    useEffect(() => { loadFlows(1); loadTemplates(); }, []);

    async function loadTemplates() {
        const res = await listWhatsappTemplates(1, 100) as any;
        if (res.success) setTemplates(res.data || []);
    }

    async function handleSyncTemplates() {
        setSyncing(true);
        try {
            const res = await syncWhatsappTemplates() as any;
            if (res.success) {
                toast.success(`${res.data.synced} templates sincronizados com sucesso!`);
                await loadTemplates();
            } else {
                toast.error(res.error?.message || "Erro ao sincronizar templates");
            }
        } catch (err: any) {
            toast.error("Erro na comunicação com a Meta");
        } finally {
            setSyncing(false);
        }
    }

    async function loadFlows(page: number) {
        setLoading(true);
        const res = await listChatbotFlows(page, 10, searchQuery || undefined) as any;
        if (res.success) {
            setFlows(res.data || []);
            if (res.pagination) setPagination(res.pagination);
        }
        setLoading(false);
    }

    async function loadFunnels() {
        if (funnelsLoaded) return;
        const res = await api<FunnelOption[]>("/api/funnels") as any;
        if (res.success && res.data) {
            setFunnels(res.data);
        }
        setFunnelsLoaded(true);
    }

    function openCreateForm() {
        loadFunnels();
        setEditingId(null);
        setForm({
            name: "", description: "", funnelId: "", stageId: "",
            objective: "qualify", outboundTemplateName: "",
            outboundPrompt: "", inboundPrompt: "",
            qualificationFields: [],
            handoffOnQualified: true, handoffOnHumanRequest: true, handoffAfterMessages: 10
        });
        setShowForm(true);
    }

    async function openEditForm(flow: ChatbotFlow) {
        await loadFunnels();
        setEditingId(flow.id);
        setForm({
            name: flow.name,
            description: flow.description || "",
            funnelId: flow.funnelId,
            stageId: flow.stageId,
            objective: flow.objective,
            outboundTemplateName: flow.outboundTemplateName || "",
            outboundPrompt: flow.outboundPrompt || "",
            inboundPrompt: flow.inboundPrompt || "",
            qualificationFields: flow.qualificationFields || [],
            handoffOnQualified: flow.handoffOnQualified,
            handoffOnHumanRequest: flow.handoffOnHumanRequest,
            handoffAfterMessages: flow.handoffAfterMessages
        });
        setShowForm(true);
    }

    async function handleSave() {
        if (!form.name || !form.funnelId || !form.stageId) return;
        setSubmitting(true);

        const payload = {
            name: form.name,
            description: form.description || undefined,
            funnelId: form.funnelId,
            stageId: form.stageId,
            objective: form.objective,
            outboundTemplateName: form.outboundTemplateName || undefined,
            outboundPrompt: form.outboundPrompt || undefined,
            inboundPrompt: form.inboundPrompt || undefined,
            qualificationFields: form.qualificationFields,
            handoffOnQualified: form.handoffOnQualified,
            handoffOnHumanRequest: form.handoffOnHumanRequest,
            handoffAfterMessages: form.handoffAfterMessages
        };

        if (editingId) {
            await updateChatbotFlow(editingId, payload as any);
        } else {
            await createChatbotFlow(payload);
        }

        setSubmitting(false);
        setShowForm(false);
        loadFlows(1);
    }

    async function handleDelete(id: string) {
        await deleteChatbotFlow(id);
        loadFlows(pagination.page);
    }

    async function handleToggle(id: string) {
        await toggleChatbotFlow(id);
        loadFlows(pagination.page);
    }

    function addQualField() {
        if (!newFieldId || !newFieldLabel) return;
        setForm(f => ({
            ...f,
            qualificationFields: [...f.qualificationFields, { id: newFieldId, label: newFieldLabel, type: newFieldType }]
        }));
        setNewFieldId(""); setNewFieldLabel(""); setNewFieldType("string");
    }

    function removeQualField(idx: number) {
        setForm(f => ({
            ...f,
            qualificationFields: f.qualificationFields.filter((_, i) => i !== idx)
        }));
    }

    const selectedFunnel = funnels.find(f => f.id === form.funnelId);

    if (showForm) {
        return (
            <div className="p-6 max-w-5xl space-y-6">
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
                    <ArrowLeft size={14} /> Voltar para listagem
                </button>
                <h2 className="text-lg font-bold text-white">{editingId ? 'Editar Fluxo' : 'Novo Fluxo'}</h2>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <GitMerge size={16} className="text-blue-400" /> Informações Básicas
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Nome do Fluxo</label>
                                <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Ex: Qualificação MQL" className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Objetivo</label>
                                <select value={form.objective} onChange={(e) => setForm(f => ({ ...f, objective: e.target.value }))}
                                    className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none">
                                    <option value="qualify">Qualificar Lead</option>
                                    <option value="followup">Follow-up</option>
                                    <option value="reactivate">Reativação</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Descrição</label>
                            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Descrição do fluxo..." rows={2}
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
                        </div>
                    </div>

                    {/* CRM Trigger */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white">Gatilho CRM (Funil + Estágio)</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Funil</label>
                                <select value={form.funnelId} onChange={(e) => setForm(f => ({ ...f, funnelId: e.target.value, stageId: "" }))}
                                    className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none">
                                    <option value="">Selecione...</option>
                                    {funnels.map(funnel => (
                                        <option key={funnel.id} value={funnel.id}>{funnel.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Estágio (quando atingir)</label>
                                <select value={form.stageId} onChange={(e) => setForm(f => ({ ...f, stageId: e.target.value }))}
                                    disabled={!form.funnelId}
                                    className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none disabled:opacity-50">
                                    <option value="">Selecione...</option>
                                    {selectedFunnel?.stages.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Template Outbound (para abordagem)</label>
                                <select value={form.outboundTemplateName} onChange={(e) => setForm(f => ({ ...f, outboundTemplateName: e.target.value }))}
                                    className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none">
                                    <option value="">Nenhum template selecionado</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.name}>{t.name} ({t.status})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button onClick={handleSyncTemplates} disabled={syncing}
                                    title="Sincronizar templates da Meta"
                                    className="h-10 px-3 bg-black/20 hover:bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-colors flex items-center justify-center">
                                    <Loader2 size={16} className={syncing ? "animate-spin" : ""} />
                                </button>
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Prompts */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white">Prompts por Modo de Entrada</h3>
                        <div>
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Prompt — Bot Inicia (Outbound)</label>
                            <textarea value={form.outboundPrompt} onChange={(e) => setForm(f => ({ ...f, outboundPrompt: e.target.value }))}
                                placeholder="Instruções para quando o bot é quem aborda o lead primeiro..."
                                rows={3} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
                        </div>
                        <div>
                            <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Prompt — Lead Inicia (Inbound)</label>
                            <textarea value={form.inboundPrompt} onChange={(e) => setForm(f => ({ ...f, inboundPrompt: e.target.value }))}
                                placeholder="Instruções para quando o lead é quem manda mensagem primeiro..."
                                rows={3} className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none" />
                        </div>
                    </div>

                    {/* Qualification Fields (BANT) */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white">Campos de Qualificação (BANT)</h3>
                        <p className="text-xs text-slate-400">A IA tentará extrair esses campos naturalmente durante a conversa.</p>

                        {form.qualificationFields.map((field, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-black/20 p-3 rounded-xl">
                                <span className="text-xs text-white font-mono bg-white/5 px-2 py-1 rounded">{field.id}</span>
                                <span className="text-xs text-slate-400 flex-1">{field.label}</span>
                                <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded">{field.type}</span>
                                <button onClick={() => removeQualField(idx)} className="text-slate-500 hover:text-red-400">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}

                        <div className="flex items-end gap-3">
                            <div className="flex-1">
                                <label className="text-[10px] font-medium text-slate-400 mb-1 block">ID (BANT)</label>
                                <input value={newFieldId} onChange={(e) => setNewFieldId(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                                    placeholder="budget" className="w-full h-9 bg-black/30 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-blue-500" />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-medium text-slate-400 mb-1 block">Descrição</label>
                                <input value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)}
                                    placeholder="Orçamento disponível" className="w-full h-9 bg-black/30 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-blue-500" />
                            </div>
                            <div className="w-28">
                                <label className="text-[10px] font-medium text-slate-400 mb-1 block">Tipo</label>
                                <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as any)}
                                    className="w-full h-9 bg-black/30 border border-white/10 rounded-lg px-2 text-xs text-white focus:outline-none focus:border-blue-500 appearance-none">
                                    <option value="string">Texto</option>
                                    <option value="number">Número</option>
                                    <option value="boolean">Sim/Não</option>
                                </select>
                            </div>
                            <button onClick={addQualField} disabled={!newFieldId || !newFieldLabel}
                                className="h-9 px-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-bold rounded-lg disabled:opacity-30">
                                <Plus size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Handoff Rules */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                        <h3 className="text-sm font-bold text-white">Regras de Handoff (Transbordo)</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.handoffOnQualified} onChange={(e) => setForm(f => ({ ...f, handoffOnQualified: e.target.checked }))}
                                    className="w-4 h-4 rounded bg-black/20 border-white/10 text-blue-500" />
                                <span className="text-xs text-slate-400">Transferir automaticamente quando todos os campos forem preenchidos</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={form.handoffOnHumanRequest} onChange={(e) => setForm(f => ({ ...f, handoffOnHumanRequest: e.target.checked }))}
                                    className="w-4 h-4 rounded bg-black/20 border-white/10 text-blue-500" />
                                <span className="text-xs text-slate-400">Transferir quando o lead pedir para falar com humano</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="text-xs text-slate-400">Máx. mensagens antes de transferir:</label>
                                <input type="number" value={form.handoffAfterMessages} onChange={(e) => setForm(f => ({ ...f, handoffAfterMessages: parseInt(e.target.value) || 10 }))}
                                    className="w-20 h-9 bg-black/20 border border-white/10 rounded-lg px-3 text-xs text-white focus:outline-none focus:border-blue-500 text-center" />
                            </div>
                        </div>
                    </div>

                    {/* Save button */}
                    <button onClick={handleSave} disabled={submitting || !form.name || !form.funnelId || !form.stageId}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors">
                        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {submitting ? 'Salvando...' : editingId ? 'Atualizar Fluxo' : 'Criar Fluxo'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Fluxos Conversacionais</h2>
                    <p className="text-xs text-slate-400 mt-1">Configure quando e como o chatbot engaja com os leads baseado no estágio do funil CRM.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" placeholder="Buscar fluxos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && loadFlows(1)}
                            className="pl-9 pr-4 py-2 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 w-56" />
                    </div>
                    <button onClick={openCreateForm} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors">
                        <Plus size={14} /> Novo Fluxo
                    </button>
                </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 text-xs font-medium text-slate-400 uppercase tracking-wider bg-black/20">
                            <th className="p-4 w-1/4">Fluxo</th>
                            <th className="p-4">Funil → Estágio</th>
                            <th className="p-4 text-center">Objetivo</th>
                            <th className="p-4 text-center">Sessões</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center"><Loader2 size={20} className="text-blue-400 animate-spin mx-auto" /></td></tr>
                        ) : flows.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-sm text-slate-400">Nenhum fluxo configurado.</td></tr>
                        ) : flows.map(flow => (
                            <tr key={flow.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <GitMerge size={14} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white">{flow.name}</h4>
                                            {flow.description && <span className="text-[10px] text-slate-500 line-clamp-1">{flow.description}</span>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs text-slate-400">{flow.funnel} → {flow.stage}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                        flow.objective === 'qualify' ? 'text-blue-400 bg-blue-400/10' :
                                        flow.objective === 'followup' ? 'text-amber-400 bg-amber-400/10' :
                                        'text-purple-400 bg-purple-400/10'
                                    }`}>
                                        {flow.objective === 'qualify' ? 'Qualificar' : flow.objective === 'followup' ? 'Follow-up' : 'Reativação'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-sm font-bold text-white">{flow.sessions || 0}</span>
                                    {flow.conversions ? <span className="text-[10px] text-emerald-400 ml-1">({flow.conversions} conv)</span> : null}
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handleToggle(flow.id)} className="inline-flex items-center gap-1">
                                        {flow.isActive
                                            ? <ToggleRight size={22} className="text-emerald-400" />
                                            : <ToggleLeft size={22} className="text-slate-500" />
                                        }
                                    </button>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditForm(flow)} className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white">
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDelete(flow.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/10">
                        <span className="text-xs text-slate-500">
                            {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                        </span>
                        <div className="flex items-center gap-1">
                            <button disabled={pagination.page === 1} onClick={() => loadFlows(pagination.page - 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-xs font-bold text-white px-2">{pagination.page} / {pagination.totalPages}</span>
                            <button disabled={pagination.page === pagination.totalPages} onClick={() => loadFlows(pagination.page + 1)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
