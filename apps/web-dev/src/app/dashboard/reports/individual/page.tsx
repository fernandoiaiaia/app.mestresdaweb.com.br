"use client";

import { useState } from "react";
import {
    LineChart, Line,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Clock, Target, Bug, RefreshCcw, Award, Eye, User } from "lucide-react";
import { Kpi, Card, C, tt, ax, grid, DEVS, DEV_EVO, DEV_RADAR } from "../shared";

export default function IndividualPage() {
    const [sel, setSel] = useState(DEVS[0].name);
    const dev = DEVS.find(d => d.name === sel)!;
    const key = sel === "Juliana Santos" ? "juliana" : sel === "Pedro Almeida" ? "pedro" : sel === "Mariana Costa" ? "mariana" : sel === "Rafael Oliveira" ? "rafael" : "lucas";

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">{DEVS.map(d => (
                <button key={d.name} onClick={() => setSel(d.name)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${sel === d.name
                        ? "bg-blue-600/20 text-blue-400 border-blue-500/20"
                        : "bg-slate-800/40 text-slate-400 border-white/[0.06] hover:border-slate-600"}`}>
                    <span className="flex items-center gap-1.5"><User size={12} /> {d.name}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{d.role}</span>
                </button>
            ))}</div>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                <Kpi label="Cycle Time" value={`${dev.ct} dias`} icon={Clock} color={dev.ct <= dev.avg ? "text-blue-400" : "text-amber-400"} trend={dev.ct <= dev.avg ? "up" : "down"} sub={`Média: ${dev.avg}d`} />
                <Kpi label="Precisão Est." value={`${dev.est}%`} icon={Target} color={dev.est <= 20 ? "text-blue-400" : "text-red-400"} trend={dev.est <= 20 ? "up" : "down"} sub="Desvio" />
                <Kpi label="Retrabalho" value={`${dev.rw}%`} icon={RefreshCcw} color={dev.rw <= 10 ? "text-blue-400" : "text-red-400"} trend={dev.rw <= 10 ? "up" : "down"} />
                <Kpi label="Bugs Gerados" value={dev.bugs} icon={Bug} color={dev.bugs <= 4 ? "text-blue-400" : "text-red-400"} />
                <Kpi label="Commitment" value={`${dev.commit}%`} icon={Award} color={dev.commit >= 85 ? "text-blue-400" : "text-amber-400"} trend={dev.commit >= 85 ? "up" : "down"} sub="Sprint" />
                <Kpi label="Code Reviews" value={dev.rev} icon={Eye} color="text-blue-400" sub={`${dev.unb} desbloqueios`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Evolução Histórica — Cycle Time" n={29}>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={DEV_EVO}>
                            <CartesianGrid strokeDasharray="3 3" stroke={grid} /><XAxis dataKey="m" tick={ax} /><YAxis tick={ax} /><Tooltip contentStyle={tt} />
                            {(["juliana", "pedro", "mariana", "rafael", "lucas"] as const).map((k, i) => (
                                <Line key={k} type="monotone" dataKey={k} stroke={[C.green, C.blue, C.purple, C.amber, C.cyan][i]}
                                    strokeWidth={key === k ? 3 : 1} dot={false} opacity={key === k ? 1 : 0.3} name={k.charAt(0).toUpperCase() + k.slice(1)} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Comparativo com Média do Time" n={30}>
                    <ResponsiveContainer width="100%" height={220}>
                        <RadarChart data={DEV_RADAR}>
                            <PolarGrid stroke="rgba(255,255,255,0.06)" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                            <PolarRadiusAxis tick={false} domain={[0, 100]} />
                            <Radar name={sel.split(" ")[0]} dataKey={key} stroke={C.green} fill={C.green} fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </Card>
                <Card title="Ranking Individual" n={19} cls="lg:col-span-2">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead><tr className="border-b border-slate-700/30">
                                {["Dev", "Cycle Time", "Precisão", "Retrabalho", "Bugs", "Commitment", "Reviews", "Complexidade"].map(h => (
                                    <th key={h} className={`py-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${h === "Dev" ? "text-left" : "text-center"}`}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>{DEVS.map(d => (
                                <tr key={d.name} className={`border-b border-slate-700/20 ${d.name === sel ? "bg-blue-500/5" : ""}`}>
                                    <td className="py-2.5 px-3"><div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-[8px] font-bold">{d.name.charAt(0)}</div>
                                        <div><p className="text-white font-medium">{d.name}</p><p className="text-[9px] text-slate-500">{d.role}</p></div>
                                    </div></td>
                                    <td className="text-center px-3"><span className={`font-bold ${d.ct <= 2.5 ? "text-blue-400" : "text-amber-400"}`}>{d.ct}d</span></td>
                                    <td className="text-center px-3"><span className={`font-bold ${d.est <= 20 ? "text-blue-400" : "text-red-400"}`}>{d.est}%</span></td>
                                    <td className="text-center px-3"><span className={`font-bold ${d.rw <= 10 ? "text-blue-400" : "text-red-400"}`}>{d.rw}%</span></td>
                                    <td className="text-center px-3"><span className={`font-bold ${d.bugs <= 4 ? "text-blue-400" : "text-red-400"}`}>{d.bugs}</span></td>
                                    <td className="text-center px-3"><span className={`font-bold ${d.commit >= 85 ? "text-blue-400" : "text-amber-400"}`}>{d.commit}%</span></td>
                                    <td className="text-center px-3"><span className="text-blue-400 font-bold">{d.rev}</span></td>
                                    <td className="text-center px-3"><span className="text-purple-400 font-bold">{d.cx}</span></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </Card>
            </div>
        </div>
    );
}
