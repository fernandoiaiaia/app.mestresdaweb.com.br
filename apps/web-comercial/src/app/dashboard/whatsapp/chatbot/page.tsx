"use client";

import { useState } from "react";
import { Bot, Settings, Plus, BarChart2, GitMerge, MessageSquare, Zap, Database } from "lucide-react";
import { DashboardTab } from "./components/DashboardTab";
import { ConfigurationTab } from "./components/ConfigurationTab";
import { FlowsTab } from "./components/FlowsTab";
import { TemplatesTab } from "./components/TemplatesTab";
import { KnowledgeBaseTab } from "./components/KnowledgeBaseTab";

export default function ChatbotPage() {
    const [activeTab, setActiveTab] = useState<"dashboard" | "flows" | "templates" | "knowledge" | "config">("dashboard");

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-900/30">
            {/* Header */}
            <div className="h-16 px-6 bg-slate-900/30 backdrop-blur-sm flex items-center justify-between border-b border-white/5 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Bot size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white">Chatbot IA</h1>
                            <p className="text-[10px] text-slate-500">Automação de respostas</p>
                        </div>
                    </div>
                    
                    <div className="w-px h-6 bg-white/10 mx-2"></div>
                    
                    {/* Tabs Navigation */}
                    <nav className="flex items-center gap-1 bg-white/[0.02] p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setActiveTab("dashboard")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "dashboard" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <BarChart2 size={14} />
                            Dashboard
                        </button>
                        <button 
                            onClick={() => setActiveTab("flows")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "flows" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <GitMerge size={14} />
                            Fluxos
                        </button>
                        <button 
                            onClick={() => setActiveTab("templates")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "templates" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <MessageSquare size={14} />
                            Templates
                        </button>
                        <button 
                            onClick={() => setActiveTab("knowledge")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "knowledge" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <Database size={14} />
                            Conhecimento
                        </button>
                        <button 
                            onClick={() => setActiveTab("config")}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                activeTab === "config" ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            <Settings size={14} />
                            Configurações
                        </button>
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors">
                        <Zap size={14} className="text-amber-400" />
                        Teste o Bot
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "dashboard" && <DashboardTab />}
                {activeTab === "flows" && <FlowsTab />}
                {activeTab === "templates" && <TemplatesTab />}
                {activeTab === "knowledge" && <KnowledgeBaseTab />}
                {activeTab === "config" && <ConfigurationTab />}
            </div>
        </div>
    );
}
