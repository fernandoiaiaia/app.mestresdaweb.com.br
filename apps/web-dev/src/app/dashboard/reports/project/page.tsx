"use client";

import {
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Card, C, tt, ax, grid, PROJECTS, PHASE_HOURS, EFFORT_ROLE } from "../shared";

export default function ProjectPage() {
    return (
        <div className="space-y-4">
            <div className="space-y-3">{PROJECTS.map(p => {
                const hc = p.hp === "green" ? "border-blue-500/30 bg-blue-500/5" : p.hp === "yellow" ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30 bg-red-500/5";
                const hb = p.hp === "green" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" : p.hp === "yellow" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-red-400 bg-red-500/10 border-red-500/20";
                const hl = p.hp === "green" ? "Saudável" : p.hp === "yellow" ? "Atenção" : "Crítico";
                return (
                    <div key={p.name} className={`p-5 rounded-xl border ${hc}`}>
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-bold text-white">{p.name}</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Forecast: {p.fc} · Escopo: {p.scope} pts · Scope Creep: +{p.creep}%</p>
                            </div>
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${hb}`}>{hl}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                            <div><p className="text-[9px] text-slate-500 font-bold uppercase">Progresso</p><p className="text-lg font-bold text-white">{p.prog}%</p></div>
                            <div><p className="text-[9px] text-slate-500 font-bold uppercase">Tempo Usado</p><p className={`text-lg font-bold ${p.prog >= p.time ? "text-blue-400" : "text-amber-400"}`}>{p.time}%</p></div>
                            <div><p className="text-[9px] text-slate-500 font-bold uppercase">Entregue</p><p className="text-lg font-bold text-blue-400">{p.del}/{p.scope}</p></div>
                            <div><p className="text-[9px] text-slate-500 font-bold uppercase">Scope Creep</p><p className={`text-lg font-bold ${p.creep <= 10 ? "text-blue-400" : "text-amber-400"}`}>+{p.creep}%</p></div>
                            <div><p className="text-[9px] text-slate-500 font-bold uppercase">Bugs Ativos</p><p className={`text-lg font-bold ${p.bugs <= 10 ? "text-blue-400" : "text-red-400"}`}>{p.bugs}</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full" style={{ width: `${p.prog}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-white">{p.prog}%</span>
                        </div>
                    </div>
                );
            })}</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Horas por Fase do Projeto" n={34}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={PHASE_HOURS} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="ph" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Bar dataKey="pl" fill={C.slate} radius={[4, 4, 0, 0]} name="Planejado" />
                            <Bar dataKey="ac" fill={C.blue} radius={[4, 4, 0, 0]} name="Realizado" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Distribuição de Esforço por Perfil" n={38}>
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart><Pie data={EFFORT_ROLE} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                {EFFORT_ROLE.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie><Tooltip contentStyle={tt} /></PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">{EFFORT_ROLE.map(r => (
                            <div key={r.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                                <span className="text-xs text-slate-300">{r.name}</span>
                                <span className="text-xs text-white font-bold ml-auto">{r.value}%</span>
                            </div>
                        ))}</div>
                    </div>
                </Card>
                <Card title="Progresso Real vs Planejado" n={31} cls="lg:col-span-2">
                    <div className="space-y-3">{PROJECTS.map(p => {
                        const ratio = p.prog / p.time;
                        const clr = ratio >= 1 ? C.green : ratio >= 0.7 ? C.amber : C.red;
                        return (
                            <div key={p.name} className="flex items-center gap-4">
                                <span className="text-xs text-slate-400 w-28 text-right truncate">{p.name}</span>
                                <div className="flex-1 relative">
                                    <div className="h-5 bg-slate-900/60 rounded-lg overflow-hidden relative">
                                        <div className="absolute h-full bg-slate-700/40 rounded-lg" style={{ width: `${p.time}%` }} />
                                        <div className="absolute h-full rounded-lg" style={{ width: `${p.prog}%`, background: clr, opacity: 0.7 }} />
                                    </div>
                                    <div className="flex justify-between mt-0.5">
                                        <span className="text-[9px] text-slate-500">Progresso: {p.prog}%</span>
                                        <span className="text-[9px] text-slate-500">Tempo: {p.time}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}</div>
                </Card>
            </div>
        </div>
    );
}
