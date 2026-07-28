"use client";

import { useState, useEffect } from "react";
import { Bot, Shield, Clock, Zap, Save, Loader2, Check } from "lucide-react";
import { getChatbotConfig, updateChatbotConfig, type ChatbotConfig } from "@/lib/chatbot-api";

export function ConfigurationTab() {
    const [config, setConfig] = useState<ChatbotConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    async function loadConfig() {
        setLoading(true);
        const res = await getChatbotConfig();
        if (res.success && res.data) {
            setConfig(res.data);
        }
        setLoading(false);
    }

    async function handleSave() {
        if (!config) return;
        setSaving(true);
        const res = await updateChatbotConfig({
            botName: config.botName,
            toneOfVoice: config.toneOfVoice,
            systemPrompt: config.systemPrompt,
            aiProvider: config.aiProvider,
            aiModel: config.aiModel,
            maxConsecutiveBotMsgs: config.maxConsecutiveBotMsgs,
            maxFollowupsPerDay: config.maxFollowupsPerDay,
            businessHoursStart: config.businessHoursStart,
            businessHoursEnd: config.businessHoursEnd,
            warmupEnabled: config.warmupEnabled,
            currentDailyLimit: config.currentDailyLimit,
            isActive: config.isActive
        });
        if (res.success && res.data) setConfig(res.data);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    function updateField(field: string, value: any) {
        if (!config) return;
        setConfig({ ...config, [field]: value });
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center h-64">
                <Loader2 size={24} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    if (!config) return null;

    return (
        <div className="p-6 max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Configurações Globais</h2>
                    <p className="text-xs text-slate-400 mt-1">Defina o comportamento padrão do assistente IA.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Master toggle */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-slate-400">Bot</span>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={config.isActive}
                                onChange={(e) => updateField("isActive", e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-10 h-5 rounded-full transition-colors ${config.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${config.isActive ? 'translate-x-5.5 ml-1' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                        <span className={`text-xs font-bold ${config.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {config.isActive ? 'ATIVO' : 'OFF'}
                        </span>
                    </label>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
                    </button>
                </div>
            </div>

            {/* AI & Persona */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Bot size={16} className="text-blue-400" />
                    <h3 className="text-sm font-bold text-white">IA & Persona</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Provedor IA</label>
                        <select
                            value={config.aiProvider}
                            onChange={(e) => updateField("aiProvider", e.target.value)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                        >
                            <option value="minimax">MiniMax</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Modelo</label>
                        <input
                            value={config.aiModel}
                            onChange={(e) => updateField("aiModel", e.target.value)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Nome do Bot</label>
                        <input
                            value={config.botName}
                            onChange={(e) => updateField("botName", e.target.value)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Tom de Voz</label>
                        <select
                            value={config.toneOfVoice}
                            onChange={(e) => updateField("toneOfVoice", e.target.value)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500 appearance-none"
                        >
                            <option value="profissional_amigavel">Profissional Amigável</option>
                            <option value="formal">Formal</option>
                            <option value="casual">Casual</option>
                            <option value="consultivo">Consultivo</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">System Prompt Global</label>
                    <textarea
                        value={config.systemPrompt || ""}
                        onChange={(e) => updateField("systemPrompt", e.target.value)}
                        placeholder="Instruções adicionais para a IA em todas as conversas..."
                        rows={4}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                </div>
            </div>

            {/* Anti-Spam Protection */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Proteção Anti-Spam (Meta)</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Máx. Msgs Consecutivas</label>
                        <input
                            type="number"
                            value={config.maxConsecutiveBotMsgs}
                            onChange={(e) => updateField("maxConsecutiveBotMsgs", parseInt(e.target.value) || 3)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Follow-ups / Dia</label>
                        <input
                            type="number"
                            value={config.maxFollowupsPerDay}
                            onChange={(e) => updateField("maxFollowupsPerDay", parseInt(e.target.value) || 1)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Limite Diário (Warm-up)</label>
                        <input
                            type="number"
                            value={config.currentDailyLimit}
                            onChange={(e) => updateField("currentDailyLimit", parseInt(e.target.value) || 50)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Clock size={16} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Horário Comercial (Outbound)</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Início</label>
                        <input
                            type="time"
                            value={config.businessHoursStart}
                            onChange={(e) => updateField("businessHoursStart", e.target.value)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5 block">Fim</label>
                        <input
                            type="time"
                            value={config.businessHoursEnd}
                            onChange={(e) => updateField("businessHoursEnd", e.target.value)}
                            className="w-full h-10 bg-black/20 border border-white/10 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer pb-2">
                            <input
                                type="checkbox"
                                checked={config.warmupEnabled}
                                onChange={(e) => updateField("warmupEnabled", e.target.checked)}
                                className="w-4 h-4 rounded bg-black/20 border-white/10 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-400">Warm-up ativo</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
