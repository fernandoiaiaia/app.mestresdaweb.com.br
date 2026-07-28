"use client";

import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useState } from "react";
import {
    Clock, Target, AlertTriangle, Shield, Bug,
    CheckCircle2, RefreshCcw, Eye, Timer, Award, User,
} from "lucide-react";

// ═══════════════════════════════════════════════════
// CHART THEME
// ═══════════════════════════════════════════════════
export const C = {
    green: "#22c55e", blue: "#3b82f6", cyan: "#06b6d4",
    purple: "#a855f7", pink: "#ec4899", amber: "#f59e0b", orange: "#f97316",
    red: "#ef4444", slate: "#64748b",
};
export const tt = { background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", color: "#fff", fontSize: 11 };
export const ax = { fill: "#64748b", fontSize: 11 };
export const grid = "rgba(255,255,255,0.04)";

// ═══════════════════════════════════════════════════
// REUSABLE UI
// ═══════════════════════════════════════════════════
export function Kpi({ label, value, sub, icon: I, color = "text-blue-400", trend }: {
    label: string; value: string | number; sub?: string; icon: any; color?: string; trend?: "up" | "down" | "neutral";
}) {
    return (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-2">
                <I size={16} className={color} />
                {trend && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${trend === "up" ? "text-blue-400 bg-blue-500/10" : trend === "down" ? "text-red-400 bg-red-500/10" : "text-slate-400 bg-slate-500/10"
                    }`}>{trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}</span>}
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">{label}</p>
            {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
        </div>
    );
}

export function Card({ title, n, children, cls = "" }: { title: string; n: number; children: React.ReactNode; cls?: string }) {
    return (
        <div className={`bg-slate-800/40 rounded-xl border border-white/[0.06] p-5 ${cls}`}>
            <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">{n}</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
            </div>
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// DATA — TEAM
// ═══════════════════════════════════════════════════
export const SPRINT_VELOCITY = [
    { s: "S1", c: 42, d: 38 }, { s: "S2", c: 45, d: 44 }, { s: "S3", c: 48, d: 40 },
    { s: "S4", c: 50, d: 48 }, { s: "S5", c: 46, d: 46 }, { s: "S6", c: 52, d: 49 },
];
export const BURNDOWN = [
    { d: "D1", i: 80, a: 80 }, { d: "D2", i: 72, a: 76 }, { d: "D3", i: 64, a: 68 },
    { d: "D4", i: 56, a: 62 }, { d: "D5", i: 48, a: 52 }, { d: "D6", i: 40, a: 45 },
    { d: "D7", i: 32, a: 38 }, { d: "D8", i: 24, a: 30 }, { d: "D9", i: 16, a: 22 }, { d: "D10", i: 8, a: 14 },
];
export const BURNUP = [
    { s: "S1", scope: 200, done: 38 }, { s: "S2", scope: 210, done: 82 },
    { s: "S3", scope: 225, done: 122 }, { s: "S4", scope: 230, done: 170 },
    { s: "S5", scope: 240, done: 216 }, { s: "S6", scope: 245, done: 265 },
];
export const TASK_TYPE_DIST = [
    { name: "Features", value: 52, color: C.green }, { name: "Bugs", value: 18, color: C.red },
    { name: "Tech Debt", value: 15, color: C.amber }, { name: "Reuniões", value: 10, color: C.purple },
    { name: "Outros", value: 5, color: C.slate },
];
export const THROUGHPUT = [
    { w: "Sem 1", t: 12 }, { w: "Sem 2", t: 15 }, { w: "Sem 3", t: 11 }, { w: "Sem 4", t: 18 },
    { w: "Sem 5", t: 14 }, { w: "Sem 6", t: 20 }, { w: "Sem 7", t: 16 }, { w: "Sem 8", t: 22 },
];

// ═══════════════════════════════════════════════════
// DATA — QUALITY
// ═══════════════════════════════════════════════════
export const BUGS_PER_SPRINT = [
    { s: "S1", o: 8, c: 6 }, { s: "S2", o: 5, c: 7 }, { s: "S3", o: 10, c: 8 },
    { s: "S4", o: 6, c: 9 }, { s: "S5", o: 7, c: 7 }, { s: "S6", o: 4, c: 6 },
];
export const BUGS_BY_MODULE = [
    { m: "Auth", b: 3 }, { m: "Checkout", b: 8 }, { m: "Dashboard", b: 5 },
    { m: "APIs", b: 6 }, { m: "Pagamentos", b: 10 }, { m: "Relatórios", b: 2 },
];
export const BUG_RESOLUTION = [
    { sev: "Crítico", h: 4 }, { sev: "Alto", h: 12 }, { sev: "Médio", h: 28 }, { sev: "Baixo", h: 56 },
];
export const TECH_DEBT = [
    { m: "Jan", d: 12 }, { m: "Fev", d: 15 }, { m: "Mar", d: 14 },
    { m: "Abr", d: 18 }, { m: "Mai", d: 22 }, { m: "Jun", d: 20 },
];
export const TEST_COV = [
    { m: "Auth", c: 85 }, { m: "Checkout", c: 62 }, { m: "Dashboard", c: 78 },
    { m: "APIs", c: 91 }, { m: "Pagamentos", c: 55 }, { m: "Relatórios", c: 70 },
];
export const BUG_ESCAPE = [
    { s: "S1", qa: 12, p: 3 }, { s: "S2", qa: 15, p: 2 }, { s: "S3", qa: 10, p: 5 },
    { s: "S4", qa: 18, p: 1 }, { s: "S5", qa: 14, p: 3 }, { s: "S6", qa: 20, p: 2 },
];
export const QUALITY_PHASE = [
    { ph: "Discovery", bugs: 2, cost: "1x" }, { ph: "Design", bugs: 5, cost: "5x" },
    { ph: "Dev", bugs: 15, cost: "10x" }, { ph: "QA", bugs: 22, cost: "25x" }, { ph: "Produção", bugs: 8, cost: "100x" },
];

// ═══════════════════════════════════════════════════
// DATA — INDIVIDUAL
// ═══════════════════════════════════════════════════
export const DEVS = [
    { name: "Juliana Santos", role: "Frontend", ct: 2.1, avg: 2.5, est: 15, rw: 8, bugs: 3, reop: 1, commit: 92, cx: 6.5, rev: 28, unb: 5 },
    { name: "Pedro Almeida", role: "Backend", ct: 2.8, avg: 2.5, est: 22, rw: 12, bugs: 7, reop: 3, commit: 85, cx: 7.2, rev: 35, unb: 8 },
    { name: "Mariana Costa", role: "Full Stack", ct: 2.3, avg: 2.5, est: 10, rw: 5, bugs: 2, reop: 0, commit: 95, cx: 8.0, rev: 42, unb: 12 },
    { name: "Rafael Oliveira", role: "Frontend", ct: 3.1, avg: 2.5, est: 30, rw: 18, bugs: 9, reop: 4, commit: 78, cx: 5.0, rev: 15, unb: 2 },
    { name: "Lucas Mendes", role: "Backend", ct: 2.0, avg: 2.5, est: 12, rw: 6, bugs: 4, reop: 1, commit: 90, cx: 7.8, rev: 38, unb: 10 },
];
export const DEV_EVO = [
    { m: "Jan", juliana: 2.8, pedro: 3.2, mariana: 2.6, rafael: 3.5, lucas: 2.4 },
    { m: "Fev", juliana: 2.5, pedro: 3.0, mariana: 2.5, rafael: 3.4, lucas: 2.3 },
    { m: "Mar", juliana: 2.3, pedro: 2.9, mariana: 2.4, rafael: 3.2, lucas: 2.1 },
    { m: "Abr", juliana: 2.2, pedro: 2.8, mariana: 2.3, rafael: 3.1, lucas: 2.0 },
    { m: "Mai", juliana: 2.1, pedro: 2.8, mariana: 2.3, rafael: 3.1, lucas: 2.0 },
];
export const DEV_RADAR = [
    { metric: "Velocidade", juliana: 85, pedro: 72, mariana: 90, rafael: 60, lucas: 88 },
    { metric: "Qualidade", juliana: 90, pedro: 75, mariana: 95, rafael: 55, lucas: 82 },
    { metric: "Precisão", juliana: 85, pedro: 70, mariana: 92, rafael: 50, lucas: 88 },
    { metric: "Colaboração", juliana: 75, pedro: 80, mariana: 95, rafael: 45, lucas: 85 },
    { metric: "Complexidade", juliana: 78, pedro: 82, mariana: 88, rafael: 58, lucas: 85 },
];

// ═══════════════════════════════════════════════════
// DATA — PROJECT
// ═══════════════════════════════════════════════════
export const PROJECTS = [
    { name: "App E-commerce", prog: 68, time: 55, hp: "green", scope: 245, del: 167, creep: 15, bugs: 12, fc: "15 Mar" },
    { name: "Portal Admin", prog: 42, time: 60, hp: "yellow", scope: 180, del: 76, creep: 25, bugs: 22, fc: "28 Mar" },
    { name: "App Mobile", prog: 85, time: 80, hp: "green", scope: 120, del: 102, creep: 8, bugs: 6, fc: "05 Mar" },
];
export const PHASE_HOURS = [
    { ph: "Discovery", pl: 80, ac: 72 }, { ph: "Design", pl: 120, ac: 135 },
    { ph: "Dev", pl: 400, ac: 380 }, { ph: "Testes", pl: 100, ac: 120 }, { ph: "Entrega", pl: 40, ac: 30 },
];
export const EFFORT_ROLE = [
    { name: "Frontend", value: 35, color: C.blue }, { name: "Backend", value: 30, color: C.green },
    { name: "QA", value: 15, color: C.purple }, { name: "Design", value: 12, color: C.pink },
    { name: "DevOps", value: 8, color: C.amber },
];
