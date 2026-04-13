/**
 * ═════════════════════════════════════════════════
 * DASHBOARD HOME — Premium Aesthetics
 * Restored design with original Tamagui proportions,
 * huge typography, and optimized scrolling container.
 * ═════════════════════════════════════════════════
 */
import { useEffect, useRef, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    StyleSheet, Dimensions, TouchableOpacity, Animated, Easing,
} from "react-native";
import Svg, { Circle, Path, Defs, LinearGradient as SvgGrad, Stop, Line } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, ArrowUpRight, TrendingUp, Activity } from "lucide-react-native";

const { width: SW, height: SH } = Dimensions.get("window");
const P  = 16;
const GAP = 8;
const CARD_HALF = (SW - P * 2 - GAP) / 2;

// ── Design tokens — Mestres da Web brand ──
const B    = "#0a0a0a";
const C1   = "#111111";
const GRN  = "#22ffb5";
const GRN2 = "#16c992";
const GRN3 = "#0b8a63";
const WHT  = "#ffffff";
const MUT  = "rgba(255,255,255,0.40)";
const MUT2 = "rgba(255,255,255,0.16)";
const MUT3 = "rgba(255,255,255,0.06)";

import { api } from "../../src/lib/api";

function useIn(delay = 0) {
    const op = useRef(new Animated.Value(0)).current;
    const y  = useRef(new Animated.Value(14)).current;
    useEffect(() => {
        Animated.parallel([
            Animated.timing(op, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(y,  { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start();
    }, []);
    return { opacity: op, transform: [{ translateY: y }] };
}

// ── SVG Sparkline ──
function Sparkline({ values, color = WHT, w = 100, h = 40 }: { values: number[]; color?: string; w?: number; h?: number }) {
    if (values.length < 2) return null;
    const max = Math.max(...values, 1);
    const step = w / (values.length - 1);
    const pts = values.map((v, i) => `${i * step},${h - (v / max) * (h - 4) - 2}`).join(" L ");
    return (
        <Svg width={w} height={h}>
            <Path d={`M ${pts}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
        </Svg>
    );
}

// ── Stacked horizontal bar ──
function StackedBar({ segments }: { segments: { pct: number; color: string }[] }) {
    return (
        <View style={{ flexDirection: "row", height: 6, borderRadius: 4, overflow: "hidden", gap: 2 }}>
            {segments.filter(s => s.pct > 0).map((s, i) => (
                <View key={i} style={{ flex: s.pct, backgroundColor: s.color, borderRadius: 3 }} />
            ))}
        </View>
    );
}

// ── SVG Dual Line Chart ──
const CHART_W = SW - P * 2 - 32;
const CHART_H = 110;
const CHART_TOP = 8;
const CHART_BTM = 22;
const INNER_H = CHART_H - CHART_TOP - CHART_BTM;

function ProgressLineChart({ data }: { data: { label: string; tarefas: number; entregas: number }[] }) {
    const maxVal = Math.max(...data.map(d => Math.max(d.tarefas, d.entregas)), 1);
    const n = data.length;
    const step = CHART_W / (n - 1 || 1);
    const toY = (v: number) => CHART_TOP + INNER_H - (v / maxVal) * INNER_H;
    const toX = (i: number) => i * step;

    const tarefasPath  = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.tarefas)}`).join(" ");
    const entregasPath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(d.entregas)}`).join(" ");
    const areaPath = [
        `M ${toX(0)} ${toY(data[0].tarefas)}`,
        ...data.slice(1).map((d, i) => `L ${toX(i + 1)} ${toY(d.tarefas)}`),
        `L ${toX(n - 1)} ${CHART_TOP + INNER_H}`,
        `L ${toX(0)} ${CHART_TOP + INNER_H} Z`,
    ].join(" ");

    return (
        <View>
            <View style={{ flexDirection: "row", gap: 16, marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View style={{ width: 16, height: 2, backgroundColor: GRN, borderRadius: 1 }} />
                    <Text style={{ fontSize: 9, color: MUT, fontWeight: "700" }}>Tarefas</Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View style={{ width: 16, height: 2, backgroundColor: GRN2, borderRadius: 1 }} />
                    <Text style={{ fontSize: 9, color: MUT, fontWeight: "700" }}>Entregas</Text>
                </View>
            </View>
            <Svg width={CHART_W} height={CHART_H}>
                <Defs>
                    <SvgGrad id="fillT" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={GRN} stopOpacity={0.22} />
                        <Stop offset="1" stopColor={GRN} stopOpacity={0} />
                    </SvgGrad>
                </Defs>
                {[0, 0.33, 0.66, 1].map((f, i) => (
                    <Line key={i} x1={0} y1={CHART_TOP + INNER_H * (1 - f)} x2={CHART_W} y2={CHART_TOP + INNER_H * (1 - f)} stroke={MUT3} strokeWidth={1} />
                ))}
                <Path d={areaPath} fill="url(#fillT)" />
                <Path d={tarefasPath}  fill="none" stroke={GRN} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                <Path d={entregasPath} fill="none" stroke={GRN2} strokeWidth={2}   strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3" />
                {data.map((d, i) => <Circle key={i} cx={toX(i)} cy={toY(d.tarefas)} r={3} fill={GRN} />)}
            </Svg>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                {data.map((d, i) => <Text key={i} style={{ fontSize: 8, color: MUT, fontWeight: "700", letterSpacing: 0.3 }}>{d.label}</Text>)}
            </View>
        </View>
    );
}

// ── SVG Donut ──
function donutPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number) {
    if (sweepDeg >= 359.9) {
        return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
    }
    const s = ((startDeg - 90) * Math.PI) / 180;
    const e = ((startDeg + sweepDeg - 90) * Math.PI) / 180;
    return `M ${cx + r * Math.cos(s)} ${cy + r * Math.sin(s)} A ${r} ${r} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${cx + r * Math.cos(e)} ${cy + r * Math.sin(e)}`;
}

function DonutChart({ segments, size = 110 }: { segments: { value: number; color: string }[]; size?: number }) {
    const r     = size / 2 - 14;
    const cx    = size / 2;
    const cy    = size / 2;
    const valid = segments.filter(s => s.value > 0);
    const total = valid.reduce((a, s) => a + s.value, 0) || 1;
    let angle   = 0;
    return (
        <Svg width={size} height={size}>
            <Circle cx={cx} cy={cy} r={r} fill="none" stroke={MUT3} strokeWidth={12} />
            {valid.map((seg, i) => {
                const sweep = (seg.value / total) * 360;
                const path  = donutPath(cx, cy, r, angle, sweep - 2);
                angle += sweep;
                return <Path key={i} d={path} fill="none" stroke={seg.color} strokeWidth={12} strokeLinecap="round" />;
            })}
        </Svg>
    );
}

const STATUS_COLOR: Record<string, string> = { done: GRN, in_progress: GRN2, todo: MUT2, blocked: "#f87171", review: "#06b6d4" };
const STATUS_LABEL: Record<string, string> = { done: "Concluídas", in_progress: "Em andamento", todo: "Pendentes", blocked: "Bloqueadas", review: "Em revisão" };

export default function DashboardHome() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading]   = useState(true);
    const [stats, setStats]       = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [tasks, setTasks]       = useState<any[]>([]);

    useEffect(() => {
        Promise.all([
            api<any>("/api/dev-projects/stats"), 
            api<any>("/api/dev-projects"), 
            api<any>("/api/dev-projects/tasks/all")
        ]).then(([s, p, t]) => {
            if (s?.success && s.data) setStats(s.data);
            if (p?.success && p.data) setProjects(p.data);
            if (t?.success && t.data) setTasks(t.data);
        }).finally(() => setLoading(false));
    }, []);

    const a0 = useIn(0); const a1 = useIn(50); const a2 = useIn(100);
    const a3 = useIn(150); const a4 = useIn(200); const a5 = useIn(250);

    if (loading) {
        return <View style={s.loader}><ActivityIndicator size="large" color={GRN} /></View>;
    }

    const ap      = stats?.activeProjects  ?? 0;
    const tip     = stats?.tasksInProgress ?? 0;
    const td      = stats?.totalDeliveries ?? 0;
    const tt      = stats?.totalTasks      ?? 0;
    const done    = stats?.tasksDone       ?? 0;
    const todo    = stats?.tasksTodo       ?? 0;
    const blocked = stats?.tasksBlocked    ?? 0;

    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const label = d.toLocaleDateString("pt-BR", { month: "short" }).substring(0, 3).toUpperCase();
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        const mt = tasks.filter(t => { const cd = new Date(t.createdAt); return cd >= start && cd <= end; });
        return { label, tarefas: mt.length, entregas: mt.filter(t => t.status === "done").length };
    });
    
    const sparkValues = projects.length > 1 ? projects.slice(0, 6).map(p => p.progress ?? 0) : [0, ap];

    const donutSegs = [
        { value: done,        color: GRN },
        { value: tip,         color: GRN2 },
        { value: todo,        color: "rgba(34,255,181,0.3)" },
        { value: blocked,     color: "#f87171" },
    ];
    const stackSegs = [
        { pct: done / (tt || 1),    color: GRN },
        { pct: tip / (tt || 1),     color: GRN2 },
        { pct: todo / (tt || 1),    color: MUT2 },
        { pct: blocked / (tt || 1), color: "#f87171" },
    ];

    const recentTasks = [...tasks].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3);
    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

    return (
        <ScrollView
            style={s.scroll}
            contentContainerStyle={[s.content, { paddingTop: insets.top + 12 }]}
            showsVerticalScrollIndicator={false}
        >
            <View style={s.flexGrid}>
                {/* Header */}
                <Animated.View style={[s.header, a0]}>
                    <View>
                        <Text style={s.dateStr}>{today.toUpperCase()}</Text>
                        <Text style={s.heroTitle}>Dashboard</Text>
                    </View>
                    <View style={s.livePill}>
                        <View style={s.liveDot} />
                        <Text style={s.liveStr}>LIVE</Text>
                    </View>
                </Animated.View>

                {/* Hero card */}
                <Animated.View style={[s.heroWrapper, a1]}>
                    <LinearGradient colors={[GRN3, "#071a13"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroCard}>
                        <View style={s.heroCardTop}>
                            <View>
                                <Text style={s.heroCardLabel}>PROJETOS ATIVOS</Text>
                                <Text style={s.heroCardNum}>{ap > 0 ? `+${ap}` : ap}</Text>
                                <Text style={s.heroCardSub}>Portfólio em andamento</Text>
                            </View>
                            <Sparkline values={sparkValues} w={100} h={50} color="rgba(255,255,255,0.7)" />
                        </View>
                        <View style={{ marginTop: 24 }}>
                            <StackedBar segments={stackSegs} />
                            <View style={s.heroLegend}>
                                <Text style={s.heroLegendItem}><Text style={{ color: GRN }}>■ </Text>{done} concluídas</Text>
                                <Text style={s.heroLegendItem}><Text style={{ color: GRN2 }}>■ </Text>{tip} andamento</Text>
                                <Text style={s.heroLegendItem}><Text style={{ color: "#f87171" }}>■ </Text>{blocked} bloqueadas</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* Metric row */}
                <Animated.View style={[s.grid2, a2]}>
                    <View style={[s.miniCard, { backgroundColor: C1 }]}>
                        <Text style={s.miniLabel}>EM ANDAMENTO</Text>
                        <Text style={[s.miniNum, { color: GRN }]}>{tip}</Text>
                        <Text style={s.miniSub}>tarefas</Text>
                    </View>
                    <View style={[s.miniCard, { backgroundColor: "#071a13", borderWidth: 1, borderColor: GRN3 }]}>
                        <Text style={[s.miniLabel, { color: GRN2 }]}>ENTREGAS</Text>
                        <Text style={[s.miniNum, { color: GRN }]}>{td}</Text>
                        <Text style={[s.miniSub, { color: GRN2, opacity: 0.6 }]}>concluídas</Text>
                        <View style={s.miniArrow}><ArrowUpRight size={12} color={GRN2} /></View>
                    </View>
                </Animated.View>

                {/* Status das Tarefas */}
                <Animated.View style={[s.card, a3]}>
                    <Text style={[s.cardLabel, { marginBottom: 16 }]}>STATUS DAS TAREFAS</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                        <View style={{ alignItems: "center", justifyContent: "center" }}>
                            <DonutChart segments={donutSegs} size={110} />
                            <View style={{ position: "absolute", alignItems: "center" }}>
                                <Text style={{ fontSize: 24, fontWeight: "900", color: WHT, letterSpacing: -1 }}>{tt}</Text>
                                <Text style={{ fontSize: 9, color: MUT, fontWeight: "700", letterSpacing: 1 }}>TOTAL</Text>
                            </View>
                        </View>
                        <View style={{ flex: 1, gap: 10 }}>
                            {[
                                { label: "Concluídas",  value: done,    color: GRN },
                                { label: "Andamento",   value: tip,     color: GRN2 },
                                { label: "Pendentes",   value: todo,    color: MUT2 },
                                { label: "Bloqueadas",  value: blocked, color: "#f87171" },
                            ].map(item => (
                                <View key={item.label} style={s.legendRow}>
                                    <View style={[s.legendDot, { backgroundColor: item.color }]} />
                                    <Text style={s.legendLabel}>{item.label}</Text>
                                    <Text style={s.legendVal}>{item.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </Animated.View>

                {/* Line chart */}
                <Animated.View style={[s.card, a4]}>
                    <View style={s.cardHead}>
                        <TrendingUp size={12} color={MUT} />
                        <Text style={s.cardLabel}>PROGRESSO MENSAL</Text>
                    </View>
                    <ProgressLineChart data={monthlyData} />
                </Animated.View>

            </View>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: B },
    content: { paddingHorizontal: P, flexGrow: 1, paddingBottom: 16 },
    loader: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: B },
    flexGrid: { flex: 1, gap: GAP, justifyContent: "space-between" },

    // Header
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, paddingTop: 8 },
    dateStr: { fontSize: 9, fontWeight: "800", color: MUT, letterSpacing: 2, marginBottom: 4 },
    heroTitle: { fontSize: 32, fontWeight: "900", color: WHT, letterSpacing: -1 },
    livePill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: MUT3, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: GRN },
    liveStr: { fontSize: 9, fontWeight: "900", color: GRN, letterSpacing: 2 },

    // Hero card
    heroWrapper: { width: "100%" },
    heroCard: { borderRadius: 18, padding: 20 },
    heroCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    heroCardLabel: { fontSize: 9, fontWeight: "800", color: "rgba(255,255,255,0.55)", letterSpacing: 3, marginBottom: 6 },
    heroCardNum: { fontSize: 52, fontWeight: "900", color: WHT, letterSpacing: -2, lineHeight: 56 },
    heroCardSub: { fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 4 },
    heroLegend: { flexDirection: "row", gap: 14, marginTop: 10 },
    heroLegendItem: { fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: "600" },

    // Grid 2x2
    grid2: { flexDirection: "row", gap: GAP },
    miniCard: { flex: 1, borderRadius: 16, padding: 18, position: "relative" },
    miniLabel: { fontSize: 10, fontWeight: "800", color: MUT, letterSpacing: 2.5, marginBottom: 10 },
    miniNum: { fontSize: 40, fontWeight: "900", color: WHT, letterSpacing: -1.5, lineHeight: 44 },
    miniSub: { fontSize: 11, color: MUT, marginTop: 4 },
    miniArrow: { position: "absolute", top: 16, right: 16 },

    // Generic card
    card: { backgroundColor: C1, borderRadius: 16, padding: 18 },
    cardHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 },
    cardLabel: { fontSize: 10, fontWeight: "800", color: MUT, letterSpacing: 2.5 },

    // Legend
    legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendLabel: { flex: 1, fontSize: 11, color: MUT, fontWeight: "600" },
    legendVal: { fontSize: 14, fontWeight: "800", color: WHT },

    // Projects
    projectCard: { backgroundColor: C1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    projectTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    projectName: { fontSize: 13, fontWeight: "800", color: WHT, flex: 1, letterSpacing: -0.4 },
    projectPct: { fontSize: 13, fontWeight: "800", color: GRN, marginLeft: 8 },
    barTrack: { height: 4, backgroundColor: MUT3, borderRadius: 3, overflow: "hidden" },
    barFill: { height: "100%", backgroundColor: GRN2, borderRadius: 3 },

    // Activity
    actRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
    actBorder: { borderTopWidth: 1, borderTopColor: MUT3 },
    actDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    actTitle: { fontSize: 12, fontWeight: "700", color: WHT },
    actStatus: { fontSize: 9, fontWeight: "800", letterSpacing: 1, marginTop: 2 },
});
