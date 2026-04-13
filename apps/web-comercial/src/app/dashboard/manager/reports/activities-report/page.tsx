"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft, BarChart3, Activity, Download, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

const dailyActivity = [
    { day: "Seg", atividades: 18 }, { day: "Ter", atividades: 24 }, { day: "Qua", atividades: 22 },
    { day: "Qui", atividades: 28 }, { day: "Sex", atividades: 15 },
];
const weeklyTrend = [
    { week: "Sem 1", concluidas: 45, criadas: 52 }, { week: "Sem 2", concluidas: 52, criadas: 48 },
    { week: "Sem 3", concluidas: 38, criadas: 42 }, { week: "Sem 4", concluidas: 60, criadas: 55 },
];
const byType = [
    { tipo: "Follow-up", count: 42 }, { tipo: "Reunião", count: 28 }, { tipo: "Ligação", count: 35 },
    { tipo: "E-mail", count: 50 }, { tipo: "WhatsApp", count: 22 },
];
const ts = { backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f8fafc", fontSize: "12px" };

export default function ActivitiesReportPage() {
    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <Link href="/dashboard/manager/reports" className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-sm mb-4"><ChevronLeft size={16} /><BarChart3 size={14} /><span>Relatórios</span></Link>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Activity size={20} className="text-blue-400" /></div>
                        <div><h1 className="text-2xl font-bold text-white">Atividades & Tarefas</h1><p className="text-sm text-slate-400">Volume de atividades, produtividade e status</p></div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-white/[0.08] rounded-xl text-sm text-slate-300 hover:bg-white/5"><Download size={14} /> Exportar</button>
                </div>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[{ label: "Total Atividades", value: "177", color: "text-blue-400" }, { label: "Concluídas", value: "155", color: "text-blue-400" }, { label: "Em Andamento", value: "14", color: "text-blue-400" }, { label: "Atrasadas", value: "8", color: "text-red-400" }, { label: "Produtividade", value: "88%", color: "text-amber-400" }].map((k, i) => (
                    <motion.div key={k.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 bg-slate-800/40 border border-white/[0.06] rounded-xl"><span className={`text-xl font-bold block ${k.color}`}>{k.value}</span><span className="text-[10px] uppercase tracking-widest text-slate-600">{k.label}</span></motion.div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Atividades por Dia da Semana</h3>
                    <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyActivity}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="atividades" fill="#10b981" radius={[4, 4, 0, 0]} name="Atividades" /></BarChart></ResponsiveContainer></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Criadas vs Concluídas (Semanal)</h3>
                    <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyTrend}><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} /><XAxis dataKey="week" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><Tooltip contentStyle={ts} /><Bar dataKey="criadas" fill="#1e293b" stroke="#334155" strokeWidth={1} name="Criadas" radius={[3, 3, 0, 0]} /><Bar dataKey="concluidas" fill="#10b981" name="Concluídas" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-slate-300 mb-4">Atividades por Tipo</h3>
                    <div className="h-[240px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={byType} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} /><XAxis type="number" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="tipo" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} width={80} /><Tooltip contentStyle={ts} /><Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Atividades" /></BarChart></ResponsiveContainer></div>
                </motion.div>
            </div>
        </div>
    );
}
