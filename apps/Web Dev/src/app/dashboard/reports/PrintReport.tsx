"use client";

import {
    BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ═══════════════════════════════════════════════════
// A4 PRINT-SPECIFIC THEME
// ═══════════════════════════════════════════════════
const C = { green: "#16a34a", blue: "#2563eb", cyan: "#0891b2", purple: "#7c3aed", pink: "#db2777", amber: "#d97706", orange: "#ea580c", red: "#dc2626", slate: "#94a3b8" };
const ptt = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#1e293b", fontSize: 10 };
const pax = { fill: "#64748b", fontSize: 9 };
const pgrid = "#e2e8f0";

// ═══════════════════════════════════════════════════
// DATA (shared with main page — duplicated for isolation)
// ═══════════════════════════════════════════════════
const SPRINT_VEL = [
    { s: "S1", c: 42, d: 38 }, { s: "S2", c: 45, d: 44 }, { s: "S3", c: 48, d: 40 },
    { s: "S4", c: 50, d: 48 }, { s: "S5", c: 46, d: 46 }, { s: "S6", c: 52, d: 49 },
];
const BURNDOWN = [
    { d: "D1", i: 80, a: 80 }, { d: "D2", i: 72, a: 76 }, { d: "D3", i: 64, a: 68 },
    { d: "D4", i: 56, a: 62 }, { d: "D5", i: 48, a: 52 }, { d: "D6", i: 40, a: 45 },
    { d: "D7", i: 32, a: 38 }, { d: "D8", i: 24, a: 30 }, { d: "D9", i: 16, a: 22 }, { d: "D10", i: 8, a: 14 },
];
const BURNUP = [
    { s: "S1", scope: 200, done: 38 }, { s: "S2", scope: 210, done: 82 }, { s: "S3", scope: 225, done: 122 },
    { s: "S4", scope: 230, done: 170 }, { s: "S5", scope: 240, done: 216 }, { s: "S6", scope: 245, done: 265 },
];
const TASK_DIST = [
    { name: "Features", value: 52, color: C.green }, { name: "Bugs", value: 18, color: C.red },
    { name: "Tech Debt", value: 15, color: C.amber }, { name: "Reuniões", value: 10, color: C.purple },
    { name: "Outros", value: 5, color: C.slate },
];
const THROUGHPUT = [
    { w: "S1", t: 12 }, { w: "S2", t: 15 }, { w: "S3", t: 11 }, { w: "S4", t: 18 },
    { w: "S5", t: 14 }, { w: "S6", t: 20 }, { w: "S7", t: 16 }, { w: "S8", t: 22 },
];
const BUGS_SPRINT = [
    { s: "S1", o: 8, c: 6 }, { s: "S2", o: 5, c: 7 }, { s: "S3", o: 10, c: 8 },
    { s: "S4", o: 6, c: 9 }, { s: "S5", o: 7, c: 7 }, { s: "S6", o: 4, c: 6 },
];
const BUGS_MOD = [
    { m: "Auth", b: 3 }, { m: "Checkout", b: 8 }, { m: "Dashboard", b: 5 },
    { m: "APIs", b: 6 }, { m: "Pagamentos", b: 10 }, { m: "Relatórios", b: 2 },
];
const BUG_RES = [
    { sev: "Crítico", h: 4 }, { sev: "Alto", h: 12 }, { sev: "Médio", h: 28 }, { sev: "Baixo", h: 56 },
];
const TECH_DEBT = [
    { m: "Jan", d: 12 }, { m: "Fev", d: 15 }, { m: "Mar", d: 14 },
    { m: "Abr", d: 18 }, { m: "Mai", d: 22 }, { m: "Jun", d: 20 },
];
const TEST_COV = [
    { m: "Auth", c: 85 }, { m: "Checkout", c: 62 }, { m: "Dashboard", c: 78 },
    { m: "APIs", c: 91 }, { m: "Pagamentos", c: 55 }, { m: "Relatórios", c: 70 },
];
const BUG_ESC = [
    { s: "S1", qa: 12, p: 3 }, { s: "S2", qa: 15, p: 2 }, { s: "S3", qa: 10, p: 5 },
    { s: "S4", qa: 18, p: 1 }, { s: "S5", qa: 14, p: 3 }, { s: "S6", qa: 20, p: 2 },
];
const DEVS = [
    { name: "Juliana Santos", role: "Frontend", ct: 2.1, avg: 2.5, est: 15, rw: 8, bugs: 3, commit: 92, rev: 28, cx: 6.5 },
    { name: "Pedro Almeida", role: "Backend", ct: 2.8, avg: 2.5, est: 22, rw: 12, bugs: 7, commit: 85, rev: 35, cx: 7.2 },
    { name: "Mariana Costa", role: "Full Stack", ct: 2.3, avg: 2.5, est: 10, rw: 5, bugs: 2, commit: 95, rev: 42, cx: 8.0 },
    { name: "Rafael Oliveira", role: "Frontend", ct: 3.1, avg: 2.5, est: 30, rw: 18, bugs: 9, commit: 78, rev: 15, cx: 5.0 },
    { name: "Lucas Mendes", role: "Backend", ct: 2.0, avg: 2.5, est: 12, rw: 6, bugs: 4, commit: 90, rev: 38, cx: 7.8 },
];
const DEV_EVO = [
    { m: "Jan", juliana: 2.8, pedro: 3.2, mariana: 2.6, rafael: 3.5, lucas: 2.4 },
    { m: "Fev", juliana: 2.5, pedro: 3.0, mariana: 2.5, rafael: 3.4, lucas: 2.3 },
    { m: "Mar", juliana: 2.3, pedro: 2.9, mariana: 2.4, rafael: 3.2, lucas: 2.1 },
    { m: "Abr", juliana: 2.2, pedro: 2.8, mariana: 2.3, rafael: 3.1, lucas: 2.0 },
    { m: "Mai", juliana: 2.1, pedro: 2.8, mariana: 2.3, rafael: 3.1, lucas: 2.0 },
];
const DEV_RADAR = [
    { metric: "Velocidade", juliana: 85, pedro: 72, mariana: 90, rafael: 60, lucas: 88 },
    { metric: "Qualidade", juliana: 90, pedro: 75, mariana: 95, rafael: 55, lucas: 82 },
    { metric: "Precisão", juliana: 85, pedro: 70, mariana: 92, rafael: 50, lucas: 88 },
    { metric: "Colaboração", juliana: 75, pedro: 80, mariana: 95, rafael: 45, lucas: 85 },
    { metric: "Complexidade", juliana: 78, pedro: 82, mariana: 88, rafael: 58, lucas: 85 },
];
const PROJECTS = [
    { name: "App E-commerce", prog: 68, time: 55, hp: "green", scope: 245, del: 167, creep: 15, bugs: 12, fc: "15 Mar" },
    { name: "Portal Admin", prog: 42, time: 60, hp: "yellow", scope: 180, del: 76, creep: 25, bugs: 22, fc: "28 Mar" },
    { name: "App Mobile", prog: 85, time: 80, hp: "green", scope: 120, del: 102, creep: 8, bugs: 6, fc: "05 Mar" },
];
const PHASE_HRS = [
    { ph: "Discovery", pl: 80, ac: 72 }, { ph: "Design", pl: 120, ac: 135 },
    { ph: "Dev", pl: 400, ac: 380 }, { ph: "Testes", pl: 100, ac: 120 }, { ph: "Entrega", pl: 40, ac: 30 },
];
const EFFORT = [
    { name: "Frontend", value: 35, color: C.blue }, { name: "Backend", value: 30, color: C.green },
    { name: "QA", value: 15, color: C.purple }, { name: "Design", value: 12, color: C.pink },
    { name: "DevOps", value: 8, color: C.amber },
];

// ═══════════════════════════════════════════════════
// REUSABLE PRINT ELEMENTS
// ═══════════════════════════════════════════════════
const s = {
    page: { pageBreakBefore: "always" as const, paddingTop: 8 },
    section: { marginBottom: 24 },
    h2: { fontSize: 14, fontWeight: 800 as const, color: "#0f172a", borderBottom: "3px solid #22c55e", paddingBottom: 6, marginBottom: 16, letterSpacing: 0.5 },
    h3: { fontSize: 11, fontWeight: 700 as const, color: "#334155", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1 },
    kpiGrid: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 16 },
    kpi: { border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 12px", background: "#f8fafc" },
    kpiVal: { fontSize: 18, fontWeight: 800 as const, color: "#0f172a", margin: 0 },
    kpiLabel: { fontSize: 8, fontWeight: 700 as const, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: 1, margin: "4px 0 0 0" },
    kpiSub: { fontSize: 7, color: "#94a3b8", margin: "2px 0 0 0" },
    chartGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
    chartBox: { border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, background: "#fff" },
    chartTitle: { fontSize: 9, fontWeight: 700 as const, color: "#334155", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 8 },
    tbl: { width: "100%", borderCollapse: "collapse" as const, fontSize: 9 },
    th: { textAlign: "left" as const, padding: "6px 8px", background: "#f1f5f9", color: "#475569", fontWeight: 700 as const, fontSize: 8, textTransform: "uppercase" as const, letterSpacing: 0.5, borderBottom: "2px solid #e2e8f0" },
    thC: { textAlign: "center" as const, padding: "6px 8px", background: "#f1f5f9", color: "#475569", fontWeight: 700 as const, fontSize: 8, textTransform: "uppercase" as const, borderBottom: "2px solid #e2e8f0" },
    td: { padding: "5px 8px", borderBottom: "1px solid #f1f5f9", color: "#334155" },
    tdC: { padding: "5px 8px", borderBottom: "1px solid #f1f5f9", textAlign: "center" as const },
    badge: (ok: boolean) => ({ fontSize: 9, fontWeight: 700 as const, color: ok ? "#16a34a" : "#dc2626" }),
};

function PKpi({ label, value, sub, color = "#0f172a" }: { label: string; value: string | number; sub?: string; color?: string }) {
    return (
        <div style={s.kpi}>
            <p style={{ ...s.kpiVal, color }}>{value}</p>
            <p style={s.kpiLabel}>{label}</p>
            {sub && <p style={s.kpiSub}>{sub}</p>}
        </div>
    );
}

function PChart({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
    return (
        <div style={{ ...s.chartBox, ...(full ? { gridColumn: "1 / -1" } : {}) }}>
            <p style={s.chartTitle}>{title}</p>
            {children}
        </div>
    );
}

// ═══════════════════════════════════════════════════
// PRINT SECTIONS
// ═══════════════════════════════════════════════════
function PrintTeam() {
    return (
        <div>
            <h2 style={s.h2}>📊 Bloco 1 — Desempenho da Equipe</h2>
            <div style={s.kpiGrid}>
                <PKpi label="Conclusão Sprint" value="89%" sub="Meta: >85%" color="#16a34a" />
                <PKpi label="Cycle Time" value="2.4 dias" sub="-0.3 vs anterior" color="#2563eb" />
                <PKpi label="Lead Time" value="4.8 dias" color="#d97706" />
                <PKpi label="Retrabalho" value="7.2%" sub="Meta: <10%" color="#dc2626" />
                <PKpi label="Impedimentos" value="2.3/sprint" sub="Média 1.2 dias" color="#ea580c" />
            </div>
            <div style={s.chartGrid}>
                <PChart title="1. Velocidade do Time por Sprint">
                    <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={SPRINT_VEL} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="s" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Bar dataKey="c" fill="#94a3b8" radius={[3, 3, 0, 0]} name="Comprometido" /><Bar dataKey="d" fill={C.green} radius={[3, 3, 0, 0]} name="Entregue" />
                        </BarChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="2. Burn-down do Sprint">
                    <ResponsiveContainer width="100%" height={170}>
                        <LineChart data={BURNDOWN}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="d" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Line type="monotone" dataKey="i" stroke="#94a3b8" strokeDasharray="5 5" dot={false} name="Ideal" />
                            <Line type="monotone" dataKey="a" stroke={C.amber} strokeWidth={2} dot={{ r: 2 }} name="Real" />
                        </LineChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="3. Burn-up do Projeto">
                    <ResponsiveContainer width="100%" height={170}>
                        <AreaChart data={BURNUP}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="s" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Area type="monotone" dataKey="scope" fill="rgba(220,38,38,0.08)" stroke={C.red} strokeWidth={2} name="Escopo" />
                            <Area type="monotone" dataKey="done" fill="rgba(22,163,74,0.1)" stroke={C.green} strokeWidth={2} name="Concluído" />
                        </AreaChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="8. Distribuição por Tipo de Tarefa">
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <ResponsiveContainer width="55%" height={160}>
                            <PieChart><Pie data={TASK_DIST} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                                {TASK_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie><Tooltip contentStyle={ptt} /></PieChart>
                        </ResponsiveContainer>
                        <div>{TASK_DIST.map(t => (
                            <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 4, background: t.color }} />
                                <span style={{ fontSize: 9, color: "#475569" }}>{t.name}</span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#0f172a", marginLeft: 8 }}>{t.value}%</span>
                            </div>
                        ))}</div>
                    </div>
                </PChart>
                <PChart title="10. Throughput do Time (Semanal)" full>
                    <ResponsiveContainer width="100%" height={150}>
                        <AreaChart data={THROUGHPUT}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="w" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Area type="monotone" dataKey="t" fill="rgba(22,163,74,0.08)" stroke={C.green} strokeWidth={2} name="Concluídas" />
                            <ReferenceLine y={15.5} stroke={C.amber} strokeDasharray="5 5" label={{ value: "Média", fill: C.amber, fontSize: 9 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </PChart>
            </div>
        </div>
    );
}

function PrintQuality() {
    return (
        <div style={s.page}>
            <h2 style={s.h2}>🐛 Bloco 2 — Qualidade e Bugs</h2>
            <div style={s.kpiGrid}>
                <PKpi label="Bugs Abertos" value="14" color="#dc2626" />
                <PKpi label="Bugs Reabertos" value="8%" sub="Meta: <5%" color="#d97706" />
                <PKpi label="Escape Rate" value="12%" sub="Prod vs QA" color="#7c3aed" />
                <PKpi label="Resolução Média" value="18h" color="#2563eb" />
                <PKpi label="Cobertura Testes" value="73%" sub="Meta: >80%" color="#16a34a" />
            </div>
            <div style={s.chartGrid}>
                <PChart title="11. Taxa de Bugs por Sprint">
                    <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={BUGS_SPRINT} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="s" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Bar dataKey="o" fill={C.red} radius={[3, 3, 0, 0]} name="Abertos" /><Bar dataKey="c" fill={C.green} radius={[3, 3, 0, 0]} name="Fechados" />
                        </BarChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="12. Bugs por Módulo">
                    <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={BUGS_MOD} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis type="number" tick={pax} /><YAxis type="category" dataKey="m" tick={{ fill: "#475569", fontSize: 9 }} width={70} />
                            <Tooltip contentStyle={ptt} /><Bar dataKey="b" fill={C.red} radius={[0, 3, 3, 0]} name="Bugs" />
                        </BarChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="13. Tempo Resolução por Severidade">
                    <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={BUG_RES}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="sev" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Bar dataKey="h" radius={[3, 3, 0, 0]} name="Horas">{BUG_RES.map((_, i) => <Cell key={i} fill={[C.red, C.amber, C.blue, C.slate][i]} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="15. Bug Escape Rate">
                    <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={BUG_ESC} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="s" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Bar dataKey="qa" fill={C.green} radius={[3, 3, 0, 0]} name="QA" /><Bar dataKey="p" fill={C.red} radius={[3, 3, 0, 0]} name="Prod" />
                        </BarChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="16. Dívida Técnica Acumulada">
                    <ResponsiveContainer width="100%" height={170}>
                        <AreaChart data={TECH_DEBT}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="m" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Area type="monotone" dataKey="d" fill="rgba(217,119,6,0.1)" stroke={C.amber} strokeWidth={2} name="Tech Debt" />
                        </AreaChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="17. Cobertura de Testes por Módulo">
                    <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={TEST_COV}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="m" tick={pax} /><YAxis tick={pax} domain={[0, 100]} /><Tooltip contentStyle={ptt} />
                            <ReferenceLine y={80} stroke={C.green} strokeDasharray="5 5" label={{ value: "Meta 80%", fill: C.green, fontSize: 8, position: "right" as const }} />
                            <Bar dataKey="c" radius={[3, 3, 0, 0]} name="Cobertura">{TEST_COV.map((e, i) => <Cell key={i} fill={e.c >= 80 ? C.green : e.c >= 60 ? C.amber : C.red} />)}</Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </PChart>
            </div>
        </div>
    );
}

function PrintIndividual() {
    return (
        <div style={s.page}>
            <h2 style={s.h2}>👤 Bloco 3 — Desempenho Individual</h2>
            <h3 style={s.h3}>Ranking de Desenvolvedores</h3>
            <table style={s.tbl}>
                <thead><tr>
                    <th style={s.th}>Desenvolvedor</th><th style={s.thC}>Cycle Time</th><th style={s.thC}>Precisão</th>
                    <th style={s.thC}>Retrabalho</th><th style={s.thC}>Bugs</th><th style={s.thC}>Commitment</th>
                    <th style={s.thC}>Reviews</th><th style={s.thC}>Complexidade</th>
                </tr></thead>
                <tbody>{DEVS.map(d => (
                    <tr key={d.name}>
                        <td style={s.td}><strong style={{ color: "#0f172a" }}>{d.name}</strong> <span style={{ fontSize: 8, color: "#94a3b8" }}>({d.role})</span></td>
                        <td style={s.tdC}><span style={s.badge(d.ct <= 2.5)}>{d.ct}d</span></td>
                        <td style={s.tdC}><span style={s.badge(d.est <= 20)}>{d.est}%</span></td>
                        <td style={s.tdC}><span style={s.badge(d.rw <= 10)}>{d.rw}%</span></td>
                        <td style={s.tdC}><span style={s.badge(d.bugs <= 4)}>{d.bugs}</span></td>
                        <td style={s.tdC}><span style={s.badge(d.commit >= 85)}>{d.commit}%</span></td>
                        <td style={s.tdC}><span style={{ fontSize: 9, fontWeight: 700, color: "#2563eb" }}>{d.rev}</span></td>
                        <td style={s.tdC}><span style={{ fontSize: 9, fontWeight: 700, color: "#7c3aed" }}>{d.cx}</span></td>
                    </tr>
                ))}</tbody>
            </table>
            <div style={{ ...s.chartGrid, marginTop: 16 }}>
                <PChart title="29. Evolução Cycle Time (Todos os Devs)">
                    <ResponsiveContainer width="100%" height={170}>
                        <LineChart data={DEV_EVO}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="m" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Line type="monotone" dataKey="juliana" stroke={C.green} strokeWidth={2} dot={{ r: 2 }} name="Juliana" />
                            <Line type="monotone" dataKey="pedro" stroke={C.blue} strokeWidth={2} dot={{ r: 2 }} name="Pedro" />
                            <Line type="monotone" dataKey="mariana" stroke={C.purple} strokeWidth={2} dot={{ r: 2 }} name="Mariana" />
                            <Line type="monotone" dataKey="rafael" stroke={C.amber} strokeWidth={2} dot={{ r: 2 }} name="Rafael" />
                            <Line type="monotone" dataKey="lucas" stroke={C.cyan} strokeWidth={2} dot={{ r: 2 }} name="Lucas" />
                        </LineChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="30. Radar — Melhor Dev (Mariana Costa)">
                    <ResponsiveContainer width="100%" height={170}>
                        <RadarChart data={DEV_RADAR}>
                            <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 8 }} /><PolarRadiusAxis tick={false} domain={[0, 100]} />
                            <Radar name="Mariana" dataKey="mariana" stroke={C.green} fill={C.green} fillOpacity={0.15} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </PChart>
            </div>
        </div>
    );
}

function PrintProject() {
    return (
        <div style={s.page}>
            <h2 style={s.h2}>📁 Bloco 4 — Desempenho por Projeto</h2>
            <h3 style={s.h3}>Saúde dos Projetos</h3>
            <table style={{ ...s.tbl, marginBottom: 16 }}>
                <thead><tr>
                    <th style={s.th}>Projeto</th><th style={s.thC}>Status</th><th style={s.thC}>Progresso</th>
                    <th style={s.thC}>Tempo</th><th style={s.thC}>Entregue</th><th style={s.thC}>Scope Creep</th>
                    <th style={s.thC}>Bugs</th><th style={s.thC}>Forecast</th>
                </tr></thead>
                <tbody>{PROJECTS.map(p => (
                    <tr key={p.name}>
                        <td style={s.td}><strong style={{ color: "#0f172a" }}>{p.name}</strong></td>
                        <td style={s.tdC}><span style={{ fontSize: 8, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: p.hp === "green" ? "#dcfce7" : "#fef9c3", color: p.hp === "green" ? "#16a34a" : "#d97706" }}>{p.hp === "green" ? "Saudável" : "Atenção"}</span></td>
                        <td style={s.tdC}><strong>{p.prog}%</strong></td>
                        <td style={s.tdC}><span style={s.badge(p.prog >= p.time)}>{p.time}%</span></td>
                        <td style={s.tdC}>{p.del}/{p.scope}</td>
                        <td style={s.tdC}><span style={s.badge(p.creep <= 10)}>+{p.creep}%</span></td>
                        <td style={s.tdC}><span style={s.badge(p.bugs <= 10)}>{p.bugs}</span></td>
                        <td style={s.tdC}>{p.fc}</td>
                    </tr>
                ))}</tbody>
            </table>
            <div style={s.chartGrid}>
                <PChart title="34. Horas por Fase do Projeto">
                    <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={PHASE_HRS} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke={pgrid} /><XAxis dataKey="ph" tick={pax} /><YAxis tick={pax} /><Tooltip contentStyle={ptt} />
                            <Bar dataKey="pl" fill="#94a3b8" radius={[3, 3, 0, 0]} name="Planejado" /><Bar dataKey="ac" fill={C.blue} radius={[3, 3, 0, 0]} name="Realizado" />
                        </BarChart>
                    </ResponsiveContainer>
                </PChart>
                <PChart title="38. Esforço por Perfil">
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <ResponsiveContainer width="55%" height={160}>
                            <PieChart><Pie data={EFFORT} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                                {EFFORT.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie><Tooltip contentStyle={ptt} /></PieChart>
                        </ResponsiveContainer>
                        <div>{EFFORT.map(r => (
                            <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                                <div style={{ width: 8, height: 8, borderRadius: 4, background: r.color }} />
                                <span style={{ fontSize: 9, color: "#475569" }}>{r.name}</span>
                                <span style={{ fontSize: 9, fontWeight: 700, color: "#0f172a", marginLeft: 8 }}>{r.value}%</span>
                            </div>
                        ))}</div>
                    </div>
                </PChart>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════
// EXPORTED PRINT REPORT
// ═══════════════════════════════════════════════════

const TAB_TITLES: Record<string, string> = {
    team: "Desempenho da Equipe",
    quality: "Qualidade e Bugs",
    individual: "Desempenho Individual",
    project: "Desempenho por Projeto",
};

export default function PrintReport({ activeTab = "team" }: { activeTab?: string }) {
    const now = new Date();
    const title = TAB_TITLES[activeTab] || "Relatórios Gerenciais";

    return (
        <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "#1e293b", background: "#fff", padding: 8 }}>
            {/* Cover Header */}
            <div style={{ borderBottom: "3px solid #22c55e", paddingBottom: 12, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>Relatórios Gerenciais</h1>
                    <p style={{ fontSize: 10, color: "#64748b", margin: "4px 0 0 0" }}>Mestres da Web · {title}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>Gerado em {now.toLocaleDateString("pt-BR")}</p>
                    <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>às {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
            </div>

            {activeTab === "team" && <PrintTeam />}
            {activeTab === "quality" && <PrintQuality />}
            {activeTab === "individual" && <PrintIndividual />}
            {activeTab === "project" && <PrintProject />}

            {/* Footer */}
            <div style={{ textAlign: "center", fontSize: 7, color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: 8, marginTop: 24 }}>
                {title} — Mestres da Web · {now.toLocaleDateString("pt-BR")} · Documento Confidencial
            </div>
        </div>
    );
}
