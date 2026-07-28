"use client";

import {
    BarChart, Bar, AreaChart, Area, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Clock, Bug, Shield, CheckCircle2, RefreshCcw } from "lucide-react";
import { Kpi, Card, C, tt, ax, grid, BUGS_PER_SPRINT, BUGS_BY_MODULE, BUG_RESOLUTION, TECH_DEBT, TEST_COV, BUG_ESCAPE, QUALITY_PHASE } from "../shared";

export default function QualityPage() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                <Kpi label="Bugs Abertos" value={14} icon={Bug} color="text-red-400" trend="down" />
                <Kpi label="Bugs Reabertos" value="8%" icon={RefreshCcw} color="text-amber-400" trend="down" sub="Meta: <5%" />
                <Kpi label="Escape Rate" value="12%" icon={Shield} color="text-purple-400" sub="Bugs prod vs QA" />
                <Kpi label="Resolução Média" value="18h" icon={Clock} color="text-blue-400" trend="down" />
                <Kpi label="Cobertura Testes" value="73%" icon={CheckCircle2} trend="up" sub="Meta: >80%" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Taxa de Bugs por Sprint" n={11}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={BUGS_PER_SPRINT} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="s" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Bar dataKey="o" fill={C.red} radius={[4, 4, 0, 0]} name="Abertos" />
                            <Bar dataKey="c" fill={C.green} radius={[4, 4, 0, 0]} name="Fechados" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Bugs por Módulo" n={12}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={BUGS_BY_MODULE} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                            <XAxis type="number" tick={ax} /><YAxis type="category" dataKey="m" tick={{ fill: "#94a3b8", fontSize: 11 }} width={80} />
                            <Tooltip contentStyle={tt} /><Bar dataKey="b" fill={C.red} radius={[0, 4, 4, 0]} name="Bugs" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Tempo Resolução por Severidade" n={13}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={BUG_RESOLUTION}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="sev" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Bar dataKey="h" radius={[4, 4, 0, 0]} name="Horas">
                                {BUG_RESOLUTION.map((_, i) => <Cell key={i} fill={[C.red, C.amber, C.blue, C.slate][i]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Bug Escape Rate" n={15}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={BUG_ESCAPE} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="s" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Bar dataKey="qa" fill={C.green} radius={[4, 4, 0, 0]} name="QA" />
                            <Bar dataKey="p" fill={C.red} radius={[4, 4, 0, 0]} name="Produção" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Dívida Técnica Acumulada" n={16}>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={TECH_DEBT}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="m" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Area type="monotone" dataKey="d" fill="rgba(245,158,11,0.15)" stroke={C.amber} strokeWidth={2} name="Tech Debt" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Cobertura de Testes por Módulo" n={17}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={TEST_COV}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="m" tick={ax} /><YAxis tick={ax} domain={[0, 100]} /><Tooltip contentStyle={tt} />
                            <ReferenceLine y={80} stroke={C.green} strokeDasharray="5 5" label={{ value: "Meta 80%", fill: C.green, fontSize: 10, position: "right" as const }} />
                            <Bar dataKey="c" radius={[4, 4, 0, 0]} name="Cobertura">
                                {TEST_COV.map((e, i) => <Cell key={i} fill={e.c >= 80 ? C.green : e.c >= 60 ? C.amber : C.red} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Qualidade por Fase (Custo do Bug)" n={37} cls="lg:col-span-2">
                    <div className="space-y-2">{QUALITY_PHASE.map(p => (
                        <div key={p.ph} className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 w-20 text-right">{p.ph}</span>
                            <div className="flex-1 h-6 bg-slate-900/60 rounded-lg overflow-hidden relative">
                                <div className="h-full rounded-lg" style={{ width: `${(p.bugs / 25) * 100}%`, background: p.cost === "1x" ? C.green : p.cost === "5x" ? C.blue : p.cost === "10x" ? C.amber : p.cost === "25x" ? C.orange : C.red }} />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white">{p.bugs} bugs · Custo {p.cost}</span>
                            </div>
                        </div>
                    ))}</div>
                </Card>
            </div>
        </div>
    );
}
