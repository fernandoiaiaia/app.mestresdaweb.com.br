"use client";

import { useState } from "react";
import { MessageSquare, Settings, Workflow, BookOpen, LayoutTemplate, Bot } from "lucide-react";
import { SettingsTab } from "./tabs/SettingsTab";
import { FlowsTab } from "./tabs/FlowsTab";
import { KnowledgeTab } from "./tabs/KnowledgeTab";
import { SessionsTab } from "./tabs/SessionsTab";
import { TemplatesTab } from "./tabs/TemplatesTab";

export default function WhatsbotPage() {
    const [activeTab, setActiveTab] = useState("settings");

    const tabs = [
        { id: "settings", label: "Configurações", icon: Settings },
        { id: "flows", label: "Fluxos", icon: Workflow },
        { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
        { id: "sessions", label: "Sessões", icon: MessageSquare },
        { id: "templates", label: "Templates", icon: LayoutTemplate },
    ];

    return (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
            <div className="max-w-[1400px] mx-auto p-4 md:p-8">
                {/* Header */}
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-violet-600/10 text-violet-500 rounded-xl">
                            <Bot size={28} />
                        </div>
                        Whatsbot AI
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Gerencie seu chatbot inteligente integrado ao WhatsApp e CRM.
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex overflow-x-auto border-b border-slate-200 dark:border-white/10 mb-6 custom-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                                    isActive
                                        ? "border-violet-500 text-violet-500"
                                        : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl p-6 min-h-[500px] shadow-sm">
                    {activeTab === "settings" && <SettingsTab />}
                    {activeTab === "flows" && <FlowsTab />}
                    {activeTab === "knowledge" && <KnowledgeTab />}
                    {activeTab === "sessions" && <SessionsTab />}
                    {activeTab === "templates" && <TemplatesTab />}
                </div>
            </div>
        </div>
    );
}
