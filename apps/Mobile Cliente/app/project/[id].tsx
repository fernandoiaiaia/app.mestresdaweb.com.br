import { useEffect, useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft, FolderKanban, Calendar, Target, FileText, ArrowRight
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle, G, Path } from "react-native-svg";

import { api } from "../../src/lib/api";

const { width } = Dimensions.get("window");

// ── Design tokens — Mestres da Web brand ──
const B    = "#0a0a0a";
const C1   = "#111111";
const GRN  = "#22ffb5";
const GRN2 = "#16c992";
const GRN3 = "#0b8a63";
const WHT  = "#ffffff";
const MUT  = "rgba(255,255,255,0.40)";
const MUT3 = "rgba(255,255,255,0.06)";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    done:        { label: "Concluída",    color: GRN,        bg: "rgba(34,255,181,0.12)"  },
    in_progress: { label: "Em andamento", color: GRN2,       bg: "rgba(22,201,146,0.12)"  },
    todo:        { label: "Pendente",     color: MUT,        bg: MUT3 },
    blocked:     { label: "Bloqueada",    color: "#f87171",  bg: "rgba(248,113,113,0.12)" },
    review:      { label: "Em revisão",   color: "#06b6d4",  bg: "rgba(6,182,212,0.12)"   },
};

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function ProjectDashboard() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        
        Promise.all([
            api<any>(`/api/dev-projects/${id}`),
            api<any[]>(`/api/dev-projects/${id}/tasks`),
        ]).then(([p, t]) => {
            if (p?.success && p.data) setProject(p.data);
            if (t?.success && t.data && t.data.length > 0) setTasks(t.data);
        }).catch(() => {
            setProject(null);
            setTasks([]);
        }).finally(() => setLoading(false));
    }, [id]);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={GRN} /></View>;
    if (!project) return <View style={styles.center}><Text style={{ color: MUT }}>Projeto não encontrado</Text></View>;

    // Contadores para o Donut Chart
    const statusGroups = Object.keys(STATUS).reduce<Record<string, number>>((acc, k) => {
        acc[k] = tasks.filter(t => t.status === k).length;
        return acc;
    }, {});
    const totalTasks = tasks.length || 1;

    // Lógica do Donut Chart (Cópia da Home Dashboard)
    const donutData = Object.entries(statusGroups)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ value: v, color: STATUS[k].color, label: STATUS[k].label, key: k }));

    let currentAngle = 0;
    const PI2 = Math.PI * 2;
    const chartSize = 130;
    const center = chartSize / 2;
    const radius = 48;

    return (
        <View style={styles.wrapper}>
            {/* Nav bar */}
            <View style={styles.navbar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={18} color={MUT} />
                </TouchableOpacity>
                <Text style={styles.navTitle} numberOfLines={1}>Meu Projeto</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ── Progress Hero (Da página anterior) ── */}
                <View style={styles.heroCard}>
                    <View style={styles.heroRow}>
                        <View style={styles.heroIconWrap}>
                            <FolderKanban size={22} color={WHT} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.heroTitle} numberOfLines={2}>{project.name}</Text>
                            {project.deadline && (
                                <View style={styles.deadlineRow}>
                                    <Calendar size={11} color={MUT} />
                                    <Text style={styles.deadlineText}>{formatDate(project.deadline)}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.heroPct}>{project.progress ?? 0}%</Text>
                    </View>

                    <View style={styles.barBg}>
                        <LinearGradient
                            colors={[GRN3, GRN]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={[styles.barFill, { width: `${project.progress ?? 0}%` }]}
                        />
                    </View>
                </View>

                {/* ── Módulos de Atalho Rápido ── */}
                <Text style={styles.sectionHeader}>Módulos do Projeto</Text>
                <View style={styles.gridRow}>
                    <TouchableOpacity 
                        style={styles.gridCard} 
                        activeOpacity={0.7} 
                        onPress={() => router.push(`/project/backlog/${id}` as any)}
                    >
                        <View style={styles.gridIconWrap}>
                            <Target size={22} color={GRN} />
                        </View>
                        <Text style={styles.gridTitle}>Backlog</Text>
                        <Text style={styles.gridSub}>{tasks.length} Tarefas iterativas</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.gridCard} 
                        activeOpacity={0.7} 
                        onPress={() => router.push(`/project/documents/${id}` as any)}
                    >
                        <View style={[styles.gridIconWrap, { backgroundColor: MUT3, borderColor: MUT3 }]}>
                            <FileText size={22} color={WHT} />
                        </View>
                        <Text style={styles.gridTitle}>Documentos</Text>
                        <Text style={styles.gridSub}>Arquivos restritos</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Dashboard: Status das Tarefas (Donut Chart) ── */}
                <Text style={styles.sectionHeader}>Status das Tarefas</Text>
                <View style={[styles.heroCard, { paddingVertical: 24 }]}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{ width: chartSize, height: chartSize, alignItems: "center", justifyContent: "center" }}>
                            {tasks.length === 0 ? (
                                <View style={{ width: radius * 2, height: radius * 2, borderRadius: radius, borderWidth: 14, borderColor: MUT3 }} />
                            ) : (
                                <Svg width={chartSize} height={chartSize}>
                                    <G rotation="-90" origin={`${center}, ${center}`}>
                                        {donutData.map((d, i) => {
                                            if (d.value === totalTasks) {
                                                return <Circle key={i} cx={center} cy={center} r={radius} stroke={d.color} strokeWidth={14} fill="transparent" />;
                                            }
                                            const sliceAngle = (d.value / totalTasks) * PI2;
                                            const startAngle = currentAngle;
                                            currentAngle += sliceAngle;
                                            const endAngle = currentAngle;
                                            
                                            // Gap calculation for smooth edges
                                            const gapAngle = 0.08; 
                                            const adjStart = startAngle + gapAngle;
                                            const adjEnd = endAngle - gapAngle;

                                            if (adjStart >= adjEnd) return null;

                                            const x1 = center + radius * Math.cos(adjStart);
                                            const y1 = center + radius * Math.sin(adjStart);
                                            const x2 = center + radius * Math.cos(adjEnd);
                                            const y2 = center + radius * Math.sin(adjEnd);
                                            const largeArc = adjEnd - adjStart > Math.PI ? 1 : 0;
                                            const pathData = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

                                            return <Path key={i} d={pathData} stroke={d.color} strokeWidth={14} fill="transparent" strokeLinecap="round" />;
                                        })}
                                    </G>
                                </Svg>
                            )}
                            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
                                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                                    <Text style={{ fontSize: 24, fontWeight: "900", color: WHT, letterSpacing: -1 }}>{tasks.length}</Text>
                                    <Text style={{ fontSize: 9, fontWeight: "800", color: MUT, letterSpacing: 1 }}>ITEMS</Text>
                                </View>
                            </View>
                        </View>

                        {/* Legend */}
                        <View style={{ flex: 1, paddingLeft: 24, gap: 14 }}>
                            {donutData.map((d) => (
                                <View key={d.key} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.color }} />
                                        <Text style={{ fontSize: 13, color: WHT, fontWeight: "600" }}>{d.label}</Text>
                                    </View>
                                    <Text style={{ fontSize: 13, color: MUT, fontWeight: "800" }}>{d.value}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Ir para Painel Completo Botão Opcional */}
                <TouchableOpacity style={styles.actBtn} onPress={() => router.push(`/project/backlog/${id}` as any)}>
                    <Text style={styles.actBtnTxt}>Acessar Backlog Completo</Text>
                    <ArrowRight size={16} color={WHT} />
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: B },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: B },
    scroll: { flex: 1 },
    content: { paddingVertical: 16 },

    navbar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: MUT3,
        backgroundColor: B,
        gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: MUT3,
        alignItems: "center", justifyContent: "center",
    },
    navTitle: { flex: 1, fontSize: 16, fontWeight: "800", color: WHT },

    heroCard: {
        backgroundColor: C1,
        borderRadius: 18,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 20,
    },
    heroRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 18 },
    heroIconWrap: {
        width: 46, height: 46, borderRadius: 12,
        backgroundColor: "rgba(34,255,181,0.08)",
        alignItems: "center", justifyContent: "center",
        borderWidth: 1, borderColor: "rgba(34,255,181,0.12)"
    },
    heroTitle: { fontSize: 18, fontWeight: "900", color: WHT, flex: 1, letterSpacing: -0.5 },
    deadlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
    deadlineText: { fontSize: 11, color: MUT, fontWeight: "600" },
    heroPct: { fontSize: 26, fontWeight: "900", color: GRN, letterSpacing: -1 },
    barBg: { height: 6, backgroundColor: MUT3, borderRadius: 3, overflow: "hidden", marginBottom: 2 },
    barFill: { height: "100%", borderRadius: 3 },

    sectionHeader: { fontSize: 13, color: MUT, fontWeight: "800", marginBottom: 12, marginTop: 4, letterSpacing: 0.5, paddingHorizontal: 16 },

    gridRow: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginBottom: 24 },
    gridCard: {
        flex: 1, backgroundColor: C1, borderRadius: 18,
        padding: 16, paddingBottom: 20,
        alignItems: "flex-start"
    },
    gridIconWrap: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: "rgba(34,255,181,0.12)",
        alignItems: "center", justifyContent: "center",
        marginBottom: 16, borderWidth: 1, borderColor: "rgba(34,255,181,0.2)"
    },
    gridTitle: { fontSize: 16, fontWeight: "800", color: WHT, marginBottom: 4 },
    gridSub: { fontSize: 12, color: MUT, fontWeight: "600" },

    actBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: GRN3, borderRadius: 16, padding: 18, marginHorizontal: 16,
    },
    actBtnTxt: { fontSize: 15, fontWeight: "800", color: WHT },
});
