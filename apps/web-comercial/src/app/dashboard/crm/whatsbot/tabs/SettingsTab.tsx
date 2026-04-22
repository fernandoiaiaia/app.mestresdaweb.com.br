"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { Save, Bot } from "lucide-react";

export function SettingsTab() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>({
        persona: "Você é um assistente comercial...",
        welcomeMessage: "",
        transferMessage: "Vou transferir você para um de nossos especialistas.",
        maxMessagesPerSession: 30,
        businessHoursEnabled: false,
        offHoursMessage: "Obrigado pelo contato! Retornaremos em breve.",
        embedEnabled: false
    });

    const loadSettings = async () => {
        try {
            const { data } = await api<any>("/api/chatbot/settings");
            if (data) setSettings(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api("/api/chatbot/settings", { method: "PUT", body: settings });
            toast.success("Configurações salvas");
        } catch (err) {
            toast.error("Erro ao salvar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot size={20} className="text-violet-500" />
                    Configurações Globais
                </h2>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                >
                    <Save size={16} /> Salvar Configurações
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Persona e Comportamento</label>
                        <textarea
                            value={settings.persona}
                            onChange={(e) => setSettings({ ...settings, persona: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-3 h-32 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                            placeholder="Descreva o tom de voz e como o bot deve se comportar..."
                        />
                        <p className="text-xs text-slate-500 mt-1">Instruções principais para a IA (System Prompt).</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mensagem de Boas-vindas</label>
                        <textarea
                            value={settings.welcomeMessage || ""}
                            onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-3 h-20 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                            placeholder="Enviada automaticamente quando um novo contato chama o bot..."
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Limite de Mensagens por Sessão</label>
                        <input
                            type="number"
                            value={settings.maxMessagesPerSession}
                            onChange={(e) => setSettings({ ...settings, maxMessagesPerSession: parseInt(e.target.value) || 30 })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-3 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mensagem de Transferência / Limite</label>
                        <textarea
                            value={settings.transferMessage}
                            onChange={(e) => setSettings({ ...settings, transferMessage: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-lg p-3 h-20 focus:outline-none focus:border-violet-500 text-slate-900 dark:text-white"
                            placeholder="Mensagem enviada quando o limite de mensagens é atingido..."
                        />
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-white/10">
                <h3 className="text-md font-bold text-slate-900 dark:text-white mb-4">Integração com Site (Widget)</h3>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl p-6">
                    <p className="text-sm text-slate-500 mb-4">
                        Copie e cole o código abaixo antes do fechamento da tag <code>&lt;/body&gt;</code> no seu site para exibir o botão flutuante do WhatsApp.
                    </p>
                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-emerald-400 overflow-x-auto relative group">
                        <code>
                            &lt;script src=&quot;https://api.proposalai.com/api/chatbot/embed.js?company=SEU_COMPANY_ID&quot; defer&gt;&lt;/script&gt;
                        </code>
                        <button className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-white p-2 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Copiar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
