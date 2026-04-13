"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, ArrowRight, Smartphone, Laptop, Monitor, Globe, Code, Box, Server, Check, Calendar, User, FileText, Bot } from "lucide-react";
import { api } from "../../../../../lib/api";
import { UserDef, PlatformType, saveUsersDraft, loadUsersDraft, saveScopeDraft, saveProjectSummaryDraft, loadProjectSummaryDraft, saveProposalMetaDraft, loadProposalMetaDraft, CompleteScope } from "../_shared";
import MatrixRain from "@/components/shared/MatrixRain";

const PLATFORM_OPTIONS: { label: PlatformType; icon: any }[] = [
  { label: "App Mobile (iOS & Android)", icon: Smartphone },
  { label: "Software Web", icon: Globe },
  { label: "Software Desktop", icon: Monitor },
  { label: "E-commerce", icon: Box },
  { label: "Website Institucional", icon: Laptop },
  { label: "API Back-End", icon: Server },
  { label: "Outro", icon: Code }
];

export default function WizardStep1() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserDef[]>([]);
  const [projectSummary, setProjectSummary] = useState("");
  
  // Proposal Meta
  const [projectName, setProjectName] = useState("");
  const [clientId, setClientId] = useState("");
  const [dealId, setDealId] = useState("");
  const [validityDays, setValidityDays] = useState<number>(15);
  const [clients, setClients] = useState<any[]>([]);

  // Initialize
  useEffect(() => {
    const urlClientId = searchParams.get("clientId");
    const urlDealId = searchParams.get("dealId");
    
    const meta = loadProposalMetaDraft();
    let initialClientId = urlClientId || "";
    let initialDealId = urlDealId || "";
    
    if (meta) {
      setProjectName(meta.title || "");
      if (!urlClientId) {
          initialClientId = meta.clientId || "";
      }
      if (!urlDealId) {
          initialDealId = meta.dealId || "";
      }
      setValidityDays(meta.validityDays || 15);
    }
    
    if (initialClientId || initialDealId) {
        if (initialClientId) setClientId(initialClientId);
        if (initialDealId) setDealId(initialDealId);
        
        // Force save if it came from URL
        if (urlClientId || urlDealId) {
            saveProposalMetaDraft({ 
                title: meta?.title || "", 
                validityDays: meta?.validityDays || 15, 
                clientId: initialClientId,
                dealId: initialDealId
            });
        }
    }

    setProjectSummary(loadProjectSummaryDraft());
    
    api<any[]>("/api/clients").then((res: any) => {
        if (res.success && res.data) setClients(res.data);
    });
    
    const draft = loadUsersDraft();
    if (draft && draft.length > 0) {
      setUsers(draft);
    } else {
      setUsers([
        { id: "u_" + Date.now(), name: "", platforms: [], platformSummary: {} }
      ]);
    }
  }, []);

  const addUser = () => {
    setUsers([...users, { id: "u_" + Date.now(), name: "", platforms: [], platformSummary: {} }]);
  };

  const removeUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const updateUserName = (id: string, name: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, name } : u));
  };

  /** Single-select: set exactly one platform per row */
  const selectPlatform = (userId: string, platform: PlatformType) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        const isAlreadySelected = u.platforms.length === 1 && u.platforms[0] === platform;
        if (isAlreadySelected) {
          // Deselect if clicking the same one
          return { ...u, platforms: [], platformSummary: {} };
        }
        // Select the new one, reset summary to only this platform
        const summary = u.platformSummary[platform] || "";
        return { ...u, platforms: [platform], platformSummary: { [platform]: summary } };
      }
      return u;
    }));
  };

  const updateSummary = (userId: string, platform: PlatformType, text: string) => {
    setUsers(users.map(u => {
      if (u.id === userId) {
        return { ...u, platformSummary: { ...u.platformSummary, [platform]: text } };
      }
      return u;
    }));
  };

  const isValid = users.length > 0 && 
    projectSummary.trim() !== "" &&
    projectName.trim() !== "" &&
    users.every(u => 
      u.name.trim() !== "" && 
      u.platforms.length === 1 &&
      (u.platformSummary[u.platforms[0]] || "").trim() !== ""
    );

  const handleNextStep = async () => {
    if (!isValid) return;

    try {
      saveUsersDraft(users);
      saveProjectSummaryDraft(projectSummary);
      saveProposalMetaDraft({ clientId, dealId, validityDays, title: projectName });

      // Each row = one ScopeUserNode with exactly one platform (no merging)
      const initialScope: CompleteScope = {
        id: "draft_" + Date.now(),
        title: projectName,
        clientId: clientId || undefined,
        dealId: dealId || undefined,
        validityDays: validityDays,
        projectSummary: projectSummary,
        createdAt: new Date().toISOString(),
        integrations: [],
        users: users.map(u => ({
          id: u.id,
          userName: u.name.trim(),
          platforms: [{
            id: `p_${u.id}_0`,
            platformName: u.platforms[0],
            objective: u.platformSummary[u.platforms[0]] || "",
            modules: []
          }]
        }))
      };

      saveScopeDraft(initialScope);
      router.push("/dashboard/crm/assembler/new/editor");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-900 text-white selection:bg-blue-500/30 pb-24">
      <MatrixRain />

      <main className="relative z-10 max-w-[1024px] mx-auto px-6 pt-20">
        <header className="mb-16 text-center">
          <h2 className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase mb-4">Briefing: Etapa 1</h2>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-white mb-6">Montador de Proposta.</h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto tracking-tight font-light leading-relaxed">
            Defina os perfis de usuário e suas plataformas. Adicione uma linha para cada combinação usuário + plataforma.
          </p>
        </header>

        {/* --- DADOS INICIAIS DA PROPOSTA --- */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    <FileText size={14} /> Nome do Projeto
                </label>
                <input 
                    type="text"
                    value={projectName}
                    onChange={e => {
                        setProjectName(e.target.value);
                        saveProposalMetaDraft({ clientId, dealId, validityDays, title: e.target.value });
                    }}
                    placeholder="Ex: ERP de Câmbio MoedaForte"
                    className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    <User size={14} /> Contato Base (Opcional)
                </label>
                <div className="relative">
                    <select
                        value={clientId}
                        onChange={e => {
                            setClientId(e.target.value);
                            saveProposalMetaDraft({ title: projectName, validityDays, clientId: e.target.value, dealId });
                        }}
                        className="w-full bg-slate-900/60 border border-slate-700/40 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                    >
                        <option value="" className="bg-slate-900 text-slate-500">Sem vínculo...</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                                {c.name || c.user?.name || "Sem Nome"} {c.companyRef ? `(${c.companyRef.name})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    <Calendar size={14} /> Validade (Dias)
                </label>
                <div className="flex bg-slate-900/60 rounded-xl p-1 border border-slate-700/40">
                    {[15, 30].map(days => (
                        <button
                            key={days}
                            onClick={() => {
                                setValidityDays(days);
                                saveProposalMetaDraft({ title: projectName, clientId, dealId, validityDays: days });
                            }}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                                validityDays === days 
                                    ? "bg-[#0071e3] text-white shadow-lg shadow-blue-500/20" 
                                    : "text-[#86868b] hover:text-white hover:bg-white/5"
                            }`}
                        >
                            {days} Dias
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="mb-12 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-md">
          <label className="block text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Resumo do Projeto Global
          </label>
          <textarea
            value={projectSummary}
            onChange={(e) => {
               setProjectSummary(e.target.value);
               saveProjectSummaryDraft(e.target.value);
            }}
            placeholder="Descreva o que é o aplicativo/software, qual o seu objetivo principal e como ele vai funcionar de forma geral..."
            className="w-full h-32 bg-slate-900/60 border border-slate-700/40 rounded-xl p-6 text-white placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
          />
        </div>

        {/* ── USER + PLATFORM ROWS ─────────────────────────────────────── */}
        <div className="space-y-6">
          {users.map((user, index) => {
            const selectedPlatform = user.platforms[0] || null;
            return (
              <div 
                key={user.id} 
                className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-md transition-all duration-500 hover:bg-slate-800/60 relative group"
              >
                {/* Remove Row */}
                {users.length > 1 && (
                  <button 
                    onClick={() => removeUser(user.id)}
                    className="absolute top-6 right-6 p-2 text-[#86868b] hover:text-[#ff3b30] bg-white/[0.05] hover:bg-[#ff3b30]/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                    title="Remover Linha"
                  >
                    <Trash2 size={16} />
                  </button>
                )}

                {/* Row Header: Number + User Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold border border-blue-500/30 shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider mb-2">
                      Perfil de Usuário
                    </label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={(e) => updateUserName(user.id, e.target.value)}
                      placeholder="Ex: Administrador, Cliente, Entregador..."
                      className="w-full bg-transparent border-b border-slate-700/50 pb-2 text-xl font-medium text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Platform Selection — Single Select */}
                <div className="mb-6 pl-14">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Plataforma
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORM_OPTIONS.map(opt => {
                      const isSelected = selectedPlatform === opt.label;
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.label}
                          onClick={() => selectPlatform(user.id, opt.label)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                            isSelected 
                              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]' 
                              : 'bg-white/5 border-white/10 text-[#a1a1a6] hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon size={15} />
                          {opt.label}
                          {isSelected && <Check size={13} className="ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Objective for selected platform */}
                {selectedPlatform && (
                  <div className="pl-14">
                    <div className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-6">
                      <label className="flex items-center gap-2 text-sm font-semibold text-[#f5f5f7] mb-3">
                        O que o <span className="text-blue-400 font-bold">{user.name || 'Usuário'}</span> vai fazer na plataforma <span className="px-2 py-1 bg-white/10 rounded-md text-xs">{selectedPlatform}</span>?
                      </label>
                      <textarea
                        value={user.platformSummary[selectedPlatform] || ""}
                        onChange={(e) => updateSummary(user.id, selectedPlatform, e.target.value)}
                        placeholder="Descreva detalhadamente o objetivo e as principais ações deste usuário nesta plataforma..."
                        className="w-full h-28 bg-transparent text-[#a1a1a6] placeholder-white/20 resize-none focus:outline-none focus:text-white transition-colors leading-relaxed"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Row Button */}
          <button
            onClick={addUser}
            className="w-full py-6 border border-dashed border-slate-700/50 hover:border-slate-600 rounded-2xl flex items-center justify-center gap-3 text-slate-500 hover:text-white transition-colors font-medium backdrop-blur-sm"
          >
            <Plus size={20} />
            Adicionar Usuário + Plataforma
          </button>
        </div>

        {/* Footer Actions */}
        <div className="mt-16 flex justify-end">
          <button
            onClick={handleNextStep}
            disabled={!isValid}
            className={`
              relative overflow-hidden group flex items-center justify-center gap-3 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-500
              ${isValid
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-[1.02] shadow-[0_0_40px_rgba(41,151,255,0.4)]' 
                : 'bg-white/10 text-white/30 cursor-not-allowed'}
            `}
          >
             <Bot size={22} className={isValid ? "animate-pulse" : ""} />
             Gerar Escopo com IA
          </button>
        </div>
      </main>
    </div>
  );
}
