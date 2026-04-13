"use client";

import { MessageSquare, Users, Clock, TrendingUp, Filter, Download } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

export function WhatsappDashboard() {
    const { user } = useAuthStore();

    const stats = [
        { title: "Conversas Ativas", value: "148", change: "+12%", up: true, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
        { title: "Novos Leads (Hoje)", value: "32", change: "+5%", up: true, icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { title: "Tempo Médio de Atend.", value: "4m 12s", change: "-18%", up: true, icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" },
        { title: "Taxa de Conversão", value: "24.5%", change: "-2%", up: false, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];

    // MOCK DATA for Tailwind Bar Chart
    const performanceData = [
        { label: "Seg", conversas: 120, leads: 30 },
        { label: "Ter", conversas: 150, leads: 45 },
        { label: "Qua", conversas: 180, leads: 55 },
        { label: "Qui", conversas: 140, leads: 40 },
        { label: "Sex", conversas: 200, leads: 70 },
        { label: "Sáb", conversas: 90, leads: 20 },
        { label: "Dom", conversas: 60, leads: 10 },
    ];
    const maxConversas = Math.max(...performanceData.map(d => d.conversas));

    return (
        <div className="h-full flex flex-col flex-1 relative overflow-y-auto custom-scrollbar">
            
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/5 bg-slate-900/10 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Performance e Auditoria</h1>
                    <p className="text-sm text-slate-400 mt-1">Visão gerencial consolidada da operação de WhatsApp.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors border border-white/10">
                        <Filter size={16} /> Filtros
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20">
                        <Download size={16} /> Exportar Relatório
                    </button>
                </div>
            </div>

            <div className="p-8 space-y-8">
                {/* ═══ KPIs ═══ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-slate-800/30 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                                    <stat.icon size={24} className={stat.color} />
                                </div>
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${stat.up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {stat.up ? '↑' : '↓'} {stat.change}
                                </span>
                            </div>
                            <h3 className="text-sm font-medium text-slate-400 mb-1">{stat.title}</h3>
                            <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
                            
                            {/* Decorative background blur */}
                            <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${stat.bg} rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`}></div>
                        </div>
                    ))}
                </div>

                {/* ═══ CHARTS ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold text-white">Volume de Atendimentos</h3>
                                <p className="text-sm text-slate-400">Comparativo últimos 7 dias</p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Conversas</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Novos Leads</div>
                            </div>
                        </div>

                        {/* Tailwind Mocked Bar Chart */}
                        <div className="h-64 flex items-end justify-between gap-2 border-b border-l border-white/10 pb-4 pl-4 relative">
                            {/* Y-Axis lines mocked */}
                            <div className="absolute left-0 bottom-4 w-full border-t border-white/5 border-dashed"></div>
                            <div className="absolute left-0 bottom-[calc(25%+16px)] w-full border-t border-white/5 border-dashed"></div>
                            <div className="absolute left-0 bottom-[calc(50%+16px)] w-full border-t border-white/5 border-dashed"></div>
                            <div className="absolute left-0 bottom-[calc(75%+16px)] w-full border-t border-white/5 border-dashed"></div>

                            {performanceData.map((data, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full z-10 relative group">
                                    <div className="w-full max-w-[40px] flex items-end gap-1 justify-center h-full">
                                        <div 
                                            className="w-1/2 bg-blue-500 hover:bg-blue-400 transition-all rounded-t-sm" 
                                            style={{ height: `${(data.conversas / maxConversas) * 100}%` }}
                                            title={`Conversas: ${data.conversas}`}
                                        ></div>
                                        <div 
                                            className="w-1/2 bg-emerald-500 hover:bg-emerald-400 transition-all rounded-t-sm" 
                                            style={{ height: `${(data.leads / maxConversas) * 100}%` }}
                                            title={`Leads: ${data.leads}`}
                                        ></div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-400 mt-2">{data.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Secondary Metrics / Ranking */}
                    <div className="bg-slate-800/30 backdrop-blur-md border border-white/5 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-1">Ranking de Operadores</h3>
                        <p className="text-sm text-slate-400 mb-6">Métrica por volume de fechamentos</p>

                        <div className="space-y-4">
                            {[
                                { name: "Fernando Cunha", pts: 48, role: "SDR" },
                                { name: "Mariana Souza", pts: 35, role: "Closer" },
                                { name: "Lucas Mendes", pts: 22, role: "SDR" },
                                { name: "Camila Rocha", pts: 15, role: "Suporte" },
                            ].map((op, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">
                                            {op.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-white leading-tight">{op.name}</h4>
                                            <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">{op.role}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-white">{op.pts}</span>
                                        <span className="text-xs text-slate-500 block -mt-1">leads</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
