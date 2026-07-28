import { useEffect, useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FolderKanban, CheckCircle2, AlertCircle, Clock, ArrowRight, FolderOpen } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
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
const MUT2 = "rgba(255,255,255,0.16)";
const MUT3 = "rgba(255,255,255,0.06)";

type Project = {
    id: string; name: string; phase: string;
    progress: number; tasksTotal: number; tasksDone: number; deadline: string;
};

const PHASE_MAP: Record<string, { label: string; color: string; bg: string }> = {
    planning:    { label: "Planejamento", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    development: { label: "Em Andamento", color: GRN,       bg: "rgba(34,255,181,0.12)" },
    review:      { label: "Em Revisão",   color: "#06b6d4", bg: "rgba(6,182,212,0.12)" },
    done:        { label: "Concluído",    color: GRN2,      bg: "rgba(22,201,146,0.12)" },
};

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProjectsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api<Project[]>("/api/dev-projects")
            .then(r => {
                if (r?.success && r.data) {
                    setProjects(r.data);
                } else {
                    setProjects([]);
                }
            })
            .catch(() => {
                setProjects([]);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: B }]}>
                <ActivityIndicator size="large" color={GRN} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

            <View style={styles.pageHeader}>
                <Text style={styles.pageTitle}>Todos os Projetos</Text>
                <Text style={styles.pageSubtitle}>Acompanhe o andamento dos seus projetos.</Text>
            </View>

            {projects.length === 0 ? (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIconWrap}>
                        <FolderOpen size={40} color={MUT} />
                    </View>
                    <Text style={styles.emptyTitle}>Nenhum projeto encontrado</Text>
                    <Text style={styles.emptyDesc}>Os projetos aparecerão aqui quando criados.</Text>
                </View>
            ) : (
                <View style={styles.grid}>
                    {projects.map((p) => {
                        const phase = PHASE_MAP[p.phase] ?? { label: p.phase, color: MUT, bg: MUT3 };
                        const pending = (p.tasksTotal || 0) - (p.tasksDone || 0);
                        return (
                            <TouchableOpacity
                                key={p.id}
                                style={styles.card}
                                activeOpacity={0.75}
                                onPress={() => router.push(`/project/${p.id}` as any)}
                            >
                                {/* Card top */}
                                <View style={styles.cardTop}>
                                    <View style={styles.iconWrap}>
                                        <FolderKanban size={18} color={WHT} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cardTitle} numberOfLines={1}>{p.name}</Text>
                                        <View style={[styles.badge, { backgroundColor: phase.bg }]}>
                                            <Text style={[styles.badgeText, { color: phase.color }]}>{phase.label.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    <ArrowRight size={16} color={MUT} style={{ marginTop: 6 }} />
                                </View>

                                {/* Progress */}
                                <View style={styles.progressSection}>
                                    <View style={styles.progressLabels}>
                                        <Text style={styles.progressLeft}>Progresso</Text>
                                        <Text style={styles.progressRight}>{p.progress ?? 0}%</Text>
                                    </View>
                                    <View style={styles.barBg}>
                                        <LinearGradient
                                            colors={[GRN3, GRN]}
                                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                            style={[styles.barFill, { width: `${p.progress ?? 0}%` }]}
                                        />
                                    </View>
                                </View>

                                {/* Meta */}
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <CheckCircle2 size={12} color={GRN} />
                                        <Text style={styles.metaText}>{p.tasksDone ?? 0} concluídas</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <AlertCircle size={12} color="#f59e0b" />
                                        <Text style={styles.metaText}>{pending} pendentes</Text>
                                    </View>
                                    <View style={[styles.metaItem, { marginLeft: "auto" }]}>
                                        <Clock size={12} color={MUT} />
                                        <Text style={styles.metaText}>{formatDate(p.deadline)}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            <View style={{ height: 32 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: B },
    content: { paddingHorizontal: 16, flexGrow: 1, paddingBottom: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },

    pageHeader: { marginBottom: 24, paddingTop: 12 },
    pageTitle: { fontSize: 32, fontWeight: "900", color: WHT, letterSpacing: -1 },
    pageSubtitle: { fontSize: 13, color: MUT, marginTop: 4, fontWeight: "500" },

    grid: { gap: 12 },
    card: {
        backgroundColor: C1,
        borderRadius: 18,
        padding: 20,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 18 },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(34,255,181,0.08)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(34,255,181,0.12)"
    },
    cardTitle: { fontSize: 17, fontWeight: "800", color: WHT, marginBottom: 6, letterSpacing: -0.4 },
    badge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: { fontSize: 8, fontWeight: "900", letterSpacing: 1 },

    progressSection: { marginBottom: 18 },
    progressLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    progressLeft: { fontSize: 11, color: MUT, fontWeight: "700", letterSpacing: 0.5 },
    progressRight: { fontSize: 12, fontWeight: "900", color: WHT },
    barBg: { height: 6, backgroundColor: MUT3, borderRadius: 3, overflow: "hidden" },
    barFill: { height: "100%", borderRadius: 3 },

    metaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    metaText: { fontSize: 11, color: MUT, fontWeight: "600" },

    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        backgroundColor: C1,
        borderRadius: 18,
        marginTop: 20,
        borderWidth: 1,
        borderColor: MUT3
    },
    emptyIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: MUT3, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    emptyTitle: { fontSize: 17, fontWeight: "800", color: WHT, letterSpacing: -0.4 },
    emptyDesc: { fontSize: 13, color: MUT, marginTop: 4 },
});
