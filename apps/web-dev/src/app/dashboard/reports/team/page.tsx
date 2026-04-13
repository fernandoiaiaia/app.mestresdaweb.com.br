"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Clock, Target, AlertTriangle, RefreshCcw, Timer } from "lucide-react";
import { Kpi, Card, C, tt, ax, grid, SPRINT_VELOCITY, BURNDOWN, BURNUP, TASK_TYPE_DIST, THROUGHPUT } from "../shared";
import { api } from "@/lib/api";

export default function TeamPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        const res = await api<any>("/api/dev-reports/team");
        if (res.success && res.data) {
            setData(res.data);
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    // Use API data if available, fall back to shared mock data
    const kpis = data?.kpis;
    const charts = data?.charts;

    const sprintVelocity = charts?.sprintVelocity?.length > 0 ? charts.sprintVelocity : SPRINT_VELOCITY;
    const burndown = charts?.burndown?.length > 0 ? charts.burndown : BURNDOWN;
    const burnup = charts?.burnup?.length > 0 ? charts.burnup : BURNUP;
    const taskTypeDist = charts?.taskTypeDist?.length > 0 ? charts.taskTypeDist : TASK_TYPE_DIST;
    const throughput = charts?.throughput?.length > 0 ? charts.throughput : THROUGHPUT;
    const throughputAvg = charts?.throughputAvg ?? 15.5;

    return (
        <div className="space-y-4">
            {loading && (
                <div className="flex items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3">
                <Kpi label="Conclusão Sprint" value={kpis ? `${kpis.sprintCompletion}%` : "—"} icon={Target} trend="up" sub="Meta: >85%" />
                <Kpi label="Cycle Time Médio" value={kpis ? `${kpis.cycleTimeAvg} dias` : "—"} icon={Clock} color="text-blue-400" trend="down" sub="-0.3 vs anterior" />
                <Kpi label="Lead Time Médio" value={kpis ? `${kpis.leadTimeAvg} dias` : "—"} icon={Timer} color="text-amber-400" trend="neutral" />
                <Kpi label="Taxa Retrabalho" value={kpis ? `${kpis.reworkRate}%` : "—"} icon={RefreshCcw} color="text-red-400" trend="down" sub="Meta: <10%" />
                <Kpi label="Impedim./Sprint" value={kpis ? kpis.impedimentsPerSprint : "—"} icon={AlertTriangle} color="text-orange-400" trend="down" sub="Média 1.2 dias" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Velocidade do Time por Sprint" n={1}>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={sprintVelocity} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="s" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Bar dataKey="c" fill={C.slate} radius={[4, 4, 0, 0]} name="Comprometido" />
                            <Bar dataKey="d" fill={C.green} radius={[4, 4, 0, 0]} name="Entregue" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Burn-down do Sprint" n={2}>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={burndown}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="d" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Line type="monotone" dataKey="i" stroke={C.slate} strokeDasharray="5 5" dot={false} name="Ideal" />
                            <Line type="monotone" dataKey="a" stroke={C.amber} strokeWidth={2} dot={{ r: 3 }} name="Real" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Burn-up do Projeto" n={3}>
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={burnup}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="s" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Area type="monotone" dataKey="scope" fill="rgba(239,68,68,0.1)" stroke={C.red} strokeWidth={2} name="Escopo" />
                            <Area type="monotone" dataKey="done" fill="rgba(34,197,94,0.15)" stroke={C.green} strokeWidth={2} name="Concluído" />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Distribuição por Tipo de Tarefa" n={8}>
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart><Pie data={taskTypeDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                {taskTypeDist.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                            </Pie><Tooltip contentStyle={tt} /></PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2">{taskTypeDist.map((t: any) => (
                            <div key={t.name} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
                                <span className="text-xs text-slate-300">{t.name}</span>
                                <span className="text-xs text-white font-bold ml-auto">{t.value}%</span>
                            </div>
                        ))}</div>
                    </div>
                </Card>
                <Card title="Throughput do Time" n={10} cls="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={throughput}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="w" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            <Area type="monotone" dataKey="t" fill="rgba(34,197,94,0.15)" stroke={C.green} strokeWidth={2} name="Tarefas Concluídas" />
                            <ReferenceLine y={throughputAvg} stroke={C.amber} strokeDasharray="5 5" label={{ value: "Média", fill: C.amber, fontSize: 10 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Card>
            </div>
        </div>
    );
}
