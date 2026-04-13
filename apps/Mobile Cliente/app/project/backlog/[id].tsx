import { useEffect, useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Dimensions
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft, Clock, AlignLeft, User, MessageSquare
} from "lucide-react-native";

import { api } from "../../../src/lib/api";

const { width } = Dimensions.get("window");

// ── Design tokens — Mestres da Web brand ──
const B    = "#0a0a0a";
const C1   = "#111111";
const C2   = "#1a1a1a";
const GRN  = "#22ffb5";
const GRN2 = "#16c992";
const WHT  = "#ffffff";
const MUT  = "rgba(255,255,255,0.40)";
const MUT2 = "rgba(255,255,255,0.16)";
const MUT3 = "rgba(255,255,255,0.06)";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    todo:        { label: "A Fazer",      color: MUT,        bg: MUT3 },
    in_progress: { label: "Em andamento", color: "#22ffb5",  bg: "rgba(34,255,181,0.12)" },
    review:      { label: "Em revisão",   color: "#f59e0b",  bg: "rgba(245,158,11,0.12)" },
    blocked:     { label: "Bloqueada",    color: "#ef4444",  bg: "rgba(239,68,68,0.12)" },
    done:        { label: "Concluída",    color: GRN2,       bg: "rgba(22,201,146,0.12)" },
};

const PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: "Crítica", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    high:     { label: "Alta",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    medium:   { label: "Média",   color: "#22ffb5", bg: "rgba(34,255,181,0.12)" },
    low:      { label: "Baixa",   color: MUT,       bg: MUT3 },
};

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default function ProjectBacklog() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>("todo");
    const [activeUser, setActiveUser] = useState<string | null>(null);

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

    const statusGroups = Object.keys(STATUS).reduce<Record<string, number>>((acc, k) => {
        acc[k] = tasks.filter(t => t.status === k).length;
        return acc;
    }, {});

    const filtered = tasks.filter(t => t.status === filter);
    const filterOpts = ["todo", "in_progress", "review", "done", "blocked"];

    // 1. Hierarquia de Agrupamento: Extrair Usuários (phaseUserNames)
    const phaseUsersMap: Record<string, any[]> = {};
    for (const t of filtered) {
        const tags = Array.isArray(t.tags) ? t.tags : [];
        const uTag = tags.find((tag: string) => tag.startsWith('user:'));
        const user = uTag ? uTag.replace('user:', '') : "Geral (Sem Usuário)";
        if (!phaseUsersMap[user]) phaseUsersMap[user] = [];
        phaseUsersMap[user].push(t);
    }

    const phaseUserNames = Object.keys(phaseUsersMap).sort();
    const currentActiveUser = phaseUserNames.includes(activeUser || "") ? activeUser! : phaseUserNames[0];

    // 2. Hierarquia de Agrupamento: Plataforma e Módulo(Epic) pro Usuário Selecionado
    const activeUserTasks = phaseUsersMap[currentActiveUser] || [];
    const groupedPlatforms: Record<string, Record<string, any[]>> = {};

    for (const t of activeUserTasks) {
        const tags = Array.isArray(t.tags) ? t.tags : [];
        const pTag = tags.find((tag: string) => tag.startsWith('platform:'));
        const platform = pTag ? pTag.replace('platform:', '') : "Sistema / Geral";
        const moduleName = t.epic || "Outros Módulos";
        
        if (!groupedPlatforms[platform]) groupedPlatforms[platform] = {};
        if (!groupedPlatforms[platform][moduleName]) groupedPlatforms[platform][moduleName] = [];
        groupedPlatforms[platform][moduleName].push(t);
    }

    return (
        <View style={styles.wrapper}>
            {/* Nav bar Minimal */}
            <View style={styles.navbar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={18} color={MUT} />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.navTitle} numberOfLines={1}>Backlog</Text>
                    <Text style={styles.navSubtitle} numberOfLines={1}>{project.name}</Text>
                </View>
            </View>

            {/* ── Abas de Fase (Nav Tabs Grandes) ── */}
            <View style={{ backgroundColor: B, paddingBottom: 12 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {filterOpts.map(f => {
                        const count = statusGroups[f] || 0;
                        const isActive = filter === f;
                        return (
                            <TouchableOpacity
                                key={f}
                                activeOpacity={0.8}
                                style={[styles.phaseTab, isActive && styles.phaseTabActive, isActive && { borderColor: STATUS[f].color }]}
                                onPress={() => setFilter(f)}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                                    <Text style={[styles.phaseTabText, isActive && { color: WHT }]}>
                                        {STATUS[f]?.label.toUpperCase()}
                                    </Text>
                                    <View style={[styles.statusDot, { backgroundColor: isActive ? STATUS[f].color : MUT3 }]} />
                                </View>
                                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                                    <Text style={[styles.phaseCount, isActive && { color: WHT }]}>{count}</Text>
                                    <Text style={styles.phaseSuffix}>ITEMS</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* ── Abas Secundárias (Usuários/Público-alvo) ── */}
                {phaseUserNames.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, marginBottom: 16, gap: 8 }}>
                        {phaseUserNames.map(user => {
                            const isActive = currentActiveUser === user;
                            const taskCount = phaseUsersMap[user].length;
                            return (
                                <TouchableOpacity 
                                    key={user} 
                                    onPress={() => setActiveUser(user)}
                                    style={[styles.userTab, isActive && styles.userTabActive]}
                                >
                                    <User size={12} color={isActive ? WHT : MUT} />
                                    <Text style={[styles.userTabText, isActive && { color: WHT }]}>{user}</Text>
                                    <View style={[styles.userTabBadge, isActive && { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                                        <Text style={[styles.userTabBadgeTxt, isActive && { color: WHT }]}>{taskCount}</Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                )}

                {/* ── Tarefas Agrupadas ── */}
                <View style={styles.section}>
                    {filtered.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <AlignLeft size={48} color={MUT3} style={{ marginBottom: 16 }} />
                            <Text style={styles.emptyTitle}>Lousa limpa!</Text>
                            <Text style={styles.emptyText}>Não existem tarefas alocadas nesta fase no momento.</Text>
                        </View>
                    ) : (
                        Object.entries(groupedPlatforms).map(([platform, modules]) => (
                            <View key={platform} style={{ marginBottom: 24 }}>
                                {/* Label da Plataforma */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <View style={{ width: 4, height: 16, backgroundColor: GRN, borderRadius: 2 }} />
                                    <Text style={{ fontSize: 12, fontWeight: "800", color: WHT, textTransform: "uppercase", letterSpacing: 1 }}>{platform}</Text>
                                </View>
                                
                                {Object.entries(modules).map(([modName, modTasks]) => (
                                    <View key={modName} style={styles.moduleCard}>
                                        <View style={styles.moduleHeader}>
                                            <Text style={styles.moduleTitle}>{modName}</Text>
                                        </View>
                                        <View style={{ padding: 12, gap: 12 }}>
                                            {modTasks.map(t => {
                                                const p = PRIORITY[t.priority] ?? PRIORITY.medium;
                                                return (
                                                    <TouchableOpacity 
                                                        key={t.id} 
                                                        style={styles.taskCard} 
                                                        activeOpacity={0.8}
                                                        onPress={() => router.push(`/project/backlog/task/${t.id}` as any)}
                                                    >
                                                        <View style={{ flexDirection: 'row' }}>
                                                            {t.blocked && <View style={styles.blockedIndicator} />}
                                                            <View style={{ flex: 1, padding: 16 }}>
                                                                <View style={styles.taskHeader}>
                                                                    <View style={[styles.priorityBadge, { backgroundColor: p.bg }]}>
                                                                        <Text style={[styles.priorityTxt, { color: p.color }]}>{p.label.toUpperCase()}</Text>
                                                                    </View>
                                                                    <View style={{ flex: 1 }} />
                                                                    {t.dueDate && (
                                                                        <View style={styles.dueDateBadge}>
                                                                            <Clock size={10} color={MUT} />
                                                                            <Text style={styles.dueDateTxt}>{formatDate(t.dueDate)}</Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                                
                                                                <Text style={styles.taskTitle} numberOfLines={3}>{t.title}</Text>
                                                                
                                                                <View style={styles.taskFooter}>
                                                                    <View style={styles.assigneeWrap}>
                                                                        <View style={styles.avatar}>
                                                                            {t.assignee ? (
                                                                                <Text style={styles.avatarTxt}>
                                                                                    {typeof t.assignee === 'string' ? t.assignee.charAt(0) : (t.assignee.name ? t.assignee.name.charAt(0) : '?')}
                                                                                </Text>
                                                                            ) : (
                                                                                <User size={10} color={MUT} />
                                                                            )}
                                                                        </View>
                                                                        <Text style={styles.assigneeName} numberOfLines={1}>
                                                                            {typeof t.assignee === 'string' ? t.assignee : (t.assignee?.name || "Sem dono")}
                                                                        </Text>
                                                                    </View>
                                                                    <View style={{ flex: 1 }} />
                                                                    {(Array.isArray(t.comments) ? t.comments.length : t.comments) > 0 && (
                                                                        <View style={styles.metaStat}>
                                                                            <MessageSquare size={12} color={MUT} />
                                                                            <Text style={styles.metaStatTxt}>
                                                                                {Array.isArray(t.comments) ? t.comments.length : t.comments}
                                                                            </Text>
                                                                        </View>
                                                                    )}
                                                                    {t.estimatedHours > 0 && (
                                                                        <View style={styles.metaStat}>
                                                                            <Clock size={12} color={MUT} />
                                                                            <Text style={styles.metaStatTxt}>{t.estimatedHours}h</Text>
                                                                        </View>
                                                                    )}
                                                                </View>
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))
                    )}
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: B },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: B },
    scroll: { flex: 1, backgroundColor: B },
    content: { paddingVertical: 16 },

    navbar: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16,
        backgroundColor: B, gap: 12,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: MUT3,
        alignItems: "center", justifyContent: "center",
    },
    navTitle: { fontSize: 18, fontWeight: "900", color: WHT, letterSpacing: -0.5 },
    navSubtitle: { fontSize: 13, color: MUT, fontWeight: "600" },

    filtersScroll: { flexGrow: 0 },
    phaseTab: {
        width: 140, padding: 14, marginRight: 10,
        backgroundColor: C1, borderRadius: 14,
        borderWidth: 1, borderColor: MUT3,
    },
    phaseTabActive: { backgroundColor: C2, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.8, shadowRadius: 10, elevation: 5 },
    phaseTabText: { fontSize: 10, color: MUT, fontWeight: "800", letterSpacing: 1 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    phaseCount: { fontSize: 26, fontWeight: "900", color: MUT, letterSpacing: -1 },
    phaseSuffix: { fontSize: 9, fontWeight: "800", color: MUT, letterSpacing: 1 },

    userTab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 16, paddingVertical: 10,
        backgroundColor: C1, borderRadius: 12,
        borderWidth: 1, borderColor: MUT3,
    },
    userTabActive: { backgroundColor: "rgba(34,255,181,0.15)", borderColor: "#22ffb5" },
    userTabText: { fontSize: 11, fontWeight: "800", color: MUT, textTransform: "uppercase", letterSpacing: 0.5 },
    userTabBadge: { backgroundColor: MUT3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    userTabBadgeTxt: { fontSize: 9, fontWeight: "800", color: MUT },

    section: { paddingHorizontal: 16 },
    emptyCard: { alignItems: "center", justifyContent: "center", paddingVertical: 60, backgroundColor: C1, borderRadius: 18, borderWidth: 1, borderColor: MUT3 },
    emptyTitle: { fontSize: 18, fontWeight: "800", color: WHT, marginBottom: 4 },
    emptyText: { color: MUT, textAlign: "center", paddingHorizontal: 24, fontSize: 13, lineHeight: 20 },

    moduleCard: {
        backgroundColor: C1, borderRadius: 16,
        borderWidth: 1, borderColor: MUT3,
        marginBottom: 16, overflow: 'hidden'
    },
    moduleHeader: {
        backgroundColor: "rgba(255,255,255,0.03)", paddingHorizontal: 16, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: MUT3
    },
    moduleTitle: { fontSize: 11, fontWeight: "800", color: MUT, textTransform: 'uppercase', letterSpacing: 0.5 },

    taskCard: {
        backgroundColor: C2, borderRadius: 12,
        borderWidth: 1, borderColor: MUT3,
        overflow: 'hidden',
    },
    blockedIndicator: { width: 4, backgroundColor: "#ef4444" },
    taskHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    priorityTxt: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
    dueDateBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: MUT3, borderRadius: 6 },
    dueDateTxt: { fontSize: 10, color: MUT, fontWeight: "700" },

    taskTitle: { fontSize: 14, fontWeight: "700", color: WHT, lineHeight: 20, letterSpacing: -0.3, marginBottom: 14 },

    taskFooter: { flexDirection: "row", alignItems: "center", paddingTop: 10, borderTopWidth: 1, borderTopColor: Object.assign({}, { borderColor: MUT3 }).borderColor },
    assigneeWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
    avatar: { width: 20, height: 20, borderRadius: 10, backgroundColor: MUT3, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: MUT2 },
    avatarTxt: { fontSize: 8, fontWeight: "800", color: WHT },
    assigneeName: { fontSize: 11, color: MUT, fontWeight: "600", maxWidth: 100 },

    metaStat: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: 10 },
    metaStatTxt: { fontSize: 11, color: MUT, fontWeight: "700" },
});

