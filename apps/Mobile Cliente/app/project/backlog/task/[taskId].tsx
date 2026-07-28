import { useEffect, useState } from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Image, Modal, KeyboardAvoidingView, Platform, TextInput
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ArrowLeft, Clock, AlignLeft, CheckCircle2, Circle, Focus,
    Monitor, Bug, MessageSquare, History, Tag, Paperclip,
    AlertTriangle, CalendarDays, FolderKanban
} from "lucide-react-native";

import { api } from "../../../../src/lib/api";

// ── Design tokens ──
const B    = "#0a0a0a";
const C1   = "#111111";
const C2   = "#1a1a1a";
const GRN  = "#22ffb5";
const GRN2 = "#16c992";
const WHT  = "#ffffff";
const MUT  = "rgba(255,255,255,0.40)";
const MUT2 = "rgba(255,255,255,0.16)";
const MUT3 = "rgba(255,255,255,0.06)";
const PRIMARY = "#22ffb5";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
    todo:        { label: "A Fazer",      color: MUT,        bg: MUT3 },
    in_progress: { label: "Em andamento", color: PRIMARY,    bg: "rgba(59,130,246,0.12)" },
    review:      { label: "Em revisão",   color: "#f59e0b",  bg: "rgba(245,158,11,0.12)" },
    blocked:     { label: "Bloqueada",    color: "#ef4444",  bg: "rgba(239,68,68,0.12)" },
    done:        { label: "Concluída",    color: GRN2,       bg: "rgba(22,201,146,0.12)" },
};

const PRIORITY: Record<string, { label: string; color: string; bg: string }> = {
    critical: { label: "Crítica", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    high:     { label: "Alta",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    medium:   { label: "Média",   color: PRIMARY,   bg: "rgba(59,130,246,0.12)" },
    low:      { label: "Baixa",   color: MUT,       bg: MUT3 },
};

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function TaskDetail() {
    const { taskId } = useLocalSearchParams<{ taskId: string }>();
    const router = useRouter();
    const [task, setTask] = useState<any>(null);
    const [checklist, setChecklist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Tab state
    const [activeTab, setActiveTab] = useState<"tasks" | "details" | "bugs" | "history">("tasks");
    
    // Chat Modal State
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isSavingComment, setIsSavingComment] = useState(false);

    useEffect(() => {
        if (!taskId) return;
        
        let isMounted = true;
        
        const loadTaskData = async () => {
            try {
                // Fetch all tasks for this client to find the specific one
                const res = await api<any[]>('/api/dev-projects/tasks/all');
                if (!isMounted) return;
                
                if (res?.success && res.data) {
                    const found = res.data.find((t: any) => t.id === taskId);
                    
                    if (found) {
                        try {
                            if (found.story && typeof found.story === 'string' && found.story.trim().startsWith("[")) setChecklist(JSON.parse(found.story));
                            else setChecklist([]);
                        } catch (e) { setChecklist([]); }
                        
                        // Concurrent metadata fetching
                        const [commentsRes, bugsRes, historyRes, attachmentsRes] = await Promise.all([
                            api<any[]>(`/api/dev-projects/tasks/${taskId}/comments`),
                            api<any[]>(`/api/dev-projects/tasks/${taskId}/bugs`),
                            api<any[]>(`/api/dev-projects/tasks/${taskId}/history`),
                            api<any[]>(`/api/dev-projects/tasks/${taskId}/attachments`),
                        ]);
                        
                        if (isMounted) {
                            setTask({
                                ...found,
                                comments: commentsRes?.success ? commentsRes.data : [],
                                bugs: bugsRes?.success ? bugsRes.data : [],
                                history: historyRes?.success ? historyRes.data : [],
                                attachments: attachmentsRes?.success ? attachmentsRes.data : [],
                            });
                        }
                    } else {
                        if (isMounted) setTask(null);
                    }
                }
            } catch (err) {
                console.log(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadTaskData();
        return () => { isMounted = false; };
    }, [taskId]);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={GRN} /></View>;
    if (!task) return <View style={styles.center}><Text style={{ color: MUT }}>Tarefa não encontrada</Text></View>;

    const s = STATUS[task.status] || STATUS.todo;
    const p = PRIORITY[task.priority] || PRIORITY.medium;
    
    const checklistDone = checklist.filter((c: any) => c.done).length;
    const checklistPct = checklist.length > 0 ? Math.round((checklistDone / checklist.length) * 100) : 0;
    
    const tabs = [
        { key: "tasks", label: "Funcionalidades", icon: Monitor, count: checklist.length },
        { key: "details", label: "Detalhes", icon: AlignLeft },
        { key: "bugs", label: "Bugs", icon: Bug, count: task.bugs?.length || 0 },
        { key: "history", label: "Histórico", icon: History }
    ];

    return (
        <View style={styles.wrapper}>
            {/* Top Bar Fixa */}
            <View style={styles.navbar}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <ArrowLeft size={18} color={MUT} />
                </TouchableOpacity>
                
                <View style={styles.headerBadges}>
                    {task.blocked && (
                        <View style={[styles.badgeBase, { backgroundColor: "rgba(239,68,68,0.12)", borderColor: "rgba(239,68,68,0.3)" }]}>
                            <AlertTriangle size={10} color="#ef4444" />
                            <Text style={[styles.badgeTxtSmall, { color: "#ef4444" }]}>BLOQUEADA</Text>
                        </View>
                    )}
                    <View style={[styles.badgeBase, { borderColor: Object.assign({}, { borderColor: s.color }).borderColor }]}>
                        <Text style={[styles.badgeTxtSmall, { color: s.color }]}>{s.label.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.badgeBase, { borderColor: Object.assign({}, { borderColor: p.color }).borderColor }]}>
                        <Text style={[styles.badgeTxtSmall, { color: p.color }]}>{p.label.toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* ── Title & Progress Area ── */}
                <View style={styles.heroSection}>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 16 }}>
                        <View style={styles.heroIconWrap}>
                            <Monitor size={24} color={PRIMARY} />
                        </View>
                        <Text style={styles.heroTitle}>{task.title}</Text>
                    </View>

                    {checklist.length > 0 && (
                        <View style={styles.progressWrap}>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${checklistPct}%`, backgroundColor: checklistPct === 100 ? GRN2 : PRIMARY }]} />
                            </View>
                            <Text style={[styles.progressScoreText, { color: checklistPct === 100 ? GRN2 : PRIMARY }]}>
                                {checklistDone}/{checklist.length} · {checklistPct}%
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Nav Tabs Horizontais ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.key;
                        const Icon = tab.icon;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                onPress={() => setActiveTab(tab.key as any)}
                                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                            >
                                <Icon size={14} color={isActive ? PRIMARY : MUT} />
                                <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                                    {tab.label} {tab.count !== undefined ? `(${tab.count})` : ""}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={styles.mainContainer}>
                    {/* ════════════ TABS CONTENT ════════════ */}

                    {/* ── FUNCIONALIDADES (TASKS) ── */}
                    {activeTab === "tasks" && (
                        <View style={styles.tabContentBlock}>
                            {checklist.length === 0 ? (
                                <Text style={styles.emptyText}>Nenhuma funcionalidade vinculada.</Text>
                            ) : (
                                checklist.map((item: any) => (
                                    <View key={item.id} style={[styles.checkItem, item.done && styles.checkItemDone]}>
                                        <View style={styles.checkIconWrap}>
                                            {item.done ? <CheckCircle2 size={24} color={GRN2} /> : <Circle size={24} color={MUT} />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.checkTitle, item.done && { color: MUT, textDecorationLine: "line-through" }]}>
                                                {item.title}
                                            </Text>
                                            {item.description && <Text style={styles.checkDesc}>{item.description}</Text>}
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {/* ── DETALHES ── */}
                    {activeTab === "details" && (
                        <View style={styles.tabContentBlock}>
                            {/* Meta Informações Auxiliares (Sidebar do Web) */}
                            <View style={styles.metaCardsGrid}>
                                {task.epic && (
                                    <View style={styles.metaCard}>
                                        <View style={styles.metaCardHead}><FolderKanban size={12} color={MUT} /><Text style={styles.metaCardLabel}>ÉPICO</Text></View>
                                        <Text style={styles.metaCardValue}>{task.epic}</Text>
                                    </View>
                                )}
                                {task.dueDate && (
                                    <View style={styles.metaCard}>
                                        <View style={styles.metaCardHead}><CalendarDays size={12} color={MUT} /><Text style={styles.metaCardLabel}>PRAZO</Text></View>
                                        <Text style={styles.metaCardValue}>{new Date(task.dueDate).toLocaleDateString("pt-BR")}</Text>
                                    </View>
                                )}
                                <View style={styles.metaCard}>
                                    <View style={styles.metaCardHead}><Clock size={12} color={MUT} /><Text style={styles.metaCardLabel}>HORAS</Text></View>
                                    <Text style={[styles.metaCardValue, { color: task.loggedHours > task.estimatedHours ? "#ef4444" : PRIMARY, fontSize: 16 }]}>
                                        {task.loggedHours || 0}h <Text style={{ color: MUT, fontSize: 11, fontWeight: "500" }}>/ {task.estimatedHours || 0}h</Text>
                                    </Text>
                                </View>
                            </View>

                            {/* Tags */}
                            {task.tags?.length > 0 && (
                                <View style={styles.block}>
                                    <View style={styles.blockTitleWrap}><Tag size={12} color={MUT} /><Text style={styles.blockTitle}>TAGS</Text></View>
                                    <View style={styles.tagsContainer}>
                                        {task.tags.map((tag: string) => (
                                            <View key={tag} style={styles.tagChip}><Text style={styles.tagChipTxt}>{tag}</Text></View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Descricao */}
                            <View style={styles.block}>
                                <Text style={styles.blockTitle}>DESCRIÇÃO</Text>
                                <View style={styles.descBox}>
                                    <Text style={styles.descText}>{task.description || "Sem descrição."}</Text>
                                </View>
                            </View>

                            {/* Anexos */}
                            {task.attachments?.length > 0 && (
                                <View style={styles.block}>
                                    <View style={styles.blockTitleWrap}><Paperclip size={12} color={MUT} /><Text style={styles.blockTitle}>ANEXOS</Text></View>
                                    <View style={styles.attachmentsContainer}>
                                        {task.attachments.map((att: any) => (
                                            <View key={att.id} style={styles.attFileBox}>
                                                <AlignLeft size={16} color={PRIMARY} style={{ marginBottom: 4 }} />
                                                <Text style={styles.attFileName} numberOfLines={1}>{att.name}</Text>
                                                <Text style={styles.attFileSize}>{att.size}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <Text style={styles.createdText}>Criada em {new Date(task.createdAt).toLocaleDateString("pt-BR")}</Text>
                        </View>
                    )}

                    {/* ── BUGS ── */}
                    {activeTab === "bugs" && (
                        <View style={styles.tabContentBlock}>
                            {!task.bugs?.length ? (
                                <Text style={styles.emptyText}>Nenhum bug associado a esta tarefa.</Text>
                            ) : (
                                task.bugs.map((b: any) => (
                                    <View key={b.id} style={[styles.bugCard, b.status === "fixed" && styles.bugCardFixed]}>
                                        <View style={styles.bugHeader}>
                                            <View style={{ flexDirection: "row", gap: 6 }}>
                                                <View style={[styles.badgeBase, { borderColor: "rgba(239,68,68,0.2)" }]}>
                                                    <Text style={[styles.badgeTxtSmall, { color: "#ef4444" }]}>{(b.priority || "HIGH").toUpperCase()}</Text>
                                                </View>
                                                {b.status === "fixed" && (
                                                    <View style={[styles.badgeBase, { backgroundColor: "rgba(22,201,146,0.1)", borderColor: "transparent" }]}>
                                                        <Text style={[styles.badgeTxtSmall, { color: GRN2 }]}>CORRIGIDO</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.bugDate}>{new Date(b.createdAt || b.date).toLocaleDateString("pt-BR")}</Text>
                                        </View>
                                        <Text style={styles.bugTitle}>{b.description || b.title}</Text>
                                        {(b.hoursWorked || b.hours) > 0 && (
                                            <View style={styles.bugFooter}>
                                                <Clock size={10} color={MUT} />
                                                <Text style={styles.bugFooterTxt}>{b.hoursWorked || b.hours}h gastas na resolução</Text>
                                            </View>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    )}



                    {/* ── HISTÓRICO ── */}
                    {activeTab === "history" && (
                        <View style={styles.tabContentBlock}>
                            {!task.history?.length ? (
                                <Text style={styles.emptyText}>Nenhum registro no histórico.</Text>
                            ) : (
                                task.history.map((h: any, i: number) => {
                                    const ICONS: Record<string, string> = { status_change: "🔄", comment: "💬", bug_report: "🐛", bug_fixed: "✅", time_log: "⏱️", attachment_upload: "📎", task_created: "✨" };
                                    const icon = h.icon || ICONS[h.action] || "📌";
                                    return (
                                        <View key={h.id} style={styles.historyRow}>
                                            <View style={styles.historyLineWrap}>
                                                <View style={styles.historyDot} />
                                                {i !== task.history.length - 1 && <View style={styles.historyLine} />}
                                            </View>
                                            <View style={styles.historyBody}>
                                                <Text style={styles.historyDesc}>
                                                    <Text style={{ fontSize: 12 }}>{icon} </Text>
                                                    {h.description || h.desc}
                                                </Text>
                                                <Text style={styles.historyDate}>{new Date(h.createdAt || h.date).toLocaleString("pt-BR")}</Text>
                                            </View>
                                        </View>
                                    );
                                })
                            )}
                        </View>
                    )}

                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Botão de Chat Flutuante */}
            <TouchableOpacity 
                style={styles.chatFab}
                onPress={() => setCommentModalVisible(true)}
                activeOpacity={0.8}
            >
                <MessageSquare size={24} color={WHT} />
                {task.comments?.length > 0 && (
                    <View style={styles.chatFabBadge}>
                        <Text style={styles.chatFabBadgeTxt}>{task.comments.length}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* ═══ FEEDBACK MODAL ═══ */}
            <Modal visible={commentModalVisible} animationType="slide" transparent={true} onRequestClose={() => setCommentModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                <MessageSquare size={20} color={PRIMARY} />
                                <Text style={styles.modalTitle}>Mensagens da Tela</Text>
                            </View>
                            <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.modalCloseBtn}>
                                <Text style={{ color: WHT, fontSize: 16, fontWeight: '700' }}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalScroll} contentContainerStyle={{ padding: 20 }}>
                            {!task.comments?.length ? (
                                <Text style={styles.modalEmptyText}>Nenhuma mensagem enviada nesta tela. Seja o primeiro a comentar!</Text>
                            ) : (
                                task.comments.map((c: any, index: number) => (
                                    <View key={c.id} style={[styles.feedbackMsg, index === 0 ? { marginTop: 0 } : {}]}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: PRIMARY, marginBottom: 2 }}>
                                            {typeof c.user === 'string' ? c.user : (c.user?.name || "Usuário")}
                                        </Text>
                                        <Text style={styles.feedbackText}>{c.text}</Text>
                                        <Text style={styles.feedbackDate}>{formatDate(c.createdAt || c.date)}</Text>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                        <View style={styles.modalInputArea}>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Digite uma mensagem..."
                                placeholderTextColor={MUT}
                                value={newComment}
                                onChangeText={setNewComment}
                                multiline
                                editable={!isSavingComment}
                            />
                            <TouchableOpacity 
                                style={[styles.modalSendBtn, (!newComment.trim() || isSavingComment) && { opacity: 0.5 }]}
                                disabled={!newComment.trim() || isSavingComment}
                                onPress={async () => {
                                    if (!newComment.trim() || isSavingComment) return;
                                    setIsSavingComment(true);
                                    try {
                                        const res = await api<any>(`/api/dev-projects/tasks/${taskId}/comments`, {
                                            method: "POST",
                                            body: { text: newComment.trim() }
                                        });
                                        if (res?.success && res.data) {
                                            setTask((prev: any) => ({ ...prev, comments: [...(prev.comments || []), res.data] }));
                                            setNewComment("");
                                        }
                                    } catch {}
                                    setIsSavingComment(false);
                                }}
                            >
                                {isSavingComment ? <ActivityIndicator size="small" color={WHT} /> : <Text style={{ color: WHT, fontWeight: '700', fontSize: 10, textTransform: 'uppercase' }}>Enviar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: B },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: B },
    scroll: { flex: 1 },
    content: { paddingBottom: 0 },

    // Navbar
    navbar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: MUT3, backgroundColor: "rgba(10,10,10,0.9)", gap: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: MUT3, alignItems: "center", justifyContent: "center" },
    headerBadges: { flex: 1, flexDirection: "row", justifyContent: "flex-end", gap: 6, flexWrap: "wrap" },
    badgeBase: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.02)" },
    badgeTxtSmall: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },

    // Hero Section
    heroSection: { padding: 24, paddingBottom: 20 },
    heroIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(59,130,246,0.1)", alignItems: "center", justifyContent: "center", marginTop: 4 },
    heroTitle: { fontSize: 26, fontWeight: "800", color: WHT, lineHeight: 34, letterSpacing: -0.5, flex: 1 },
    
    // Progress Bar
    progressWrap: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
    progressBarBg: { flex: 1, height: 8, backgroundColor: C2, borderRadius: 4, overflow: "hidden", borderWidth: 1, borderColor: MUT3 },
    progressBarFill: { height: "100%", borderRadius: 4 },
    progressScoreText: { fontSize: 13, fontWeight: "800" },

    // Tabs
    tabsScroll: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: MUT3 },
    tabBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: "transparent" },
    tabBtnActive: { borderBottomColor: PRIMARY },
    tabBtnText: { fontSize: 13, fontWeight: "700", color: MUT },
    tabBtnTextActive: { color: PRIMARY, fontWeight: "800" },

    // Main Container
    mainContainer: { padding: 16 },
    tabContentBlock: { paddingTop: 8 },
    emptyText: { color: MUT, textAlign: "center", paddingVertical: 32, fontWeight: "500" },

    // Task Items (Funcionalidades)
    checkItem: { flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: C1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: MUT3, marginBottom: 10 },
    checkItemDone: { backgroundColor: "rgba(22,201,146,0.03)", borderColor: "rgba(22,201,146,0.15)" },
    checkIconWrap: { marginTop: 2 },
    checkTitle: { fontSize: 15, fontWeight: "700", color: WHT, marginBottom: 4, lineHeight: 22 },
    checkDesc: { fontSize: 12, color: MUT, lineHeight: 18 },

    // Details Tab Elements
    metaCardsGrid: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginBottom: 20 },
    metaCard: { flex: 1, minWidth: "40%", backgroundColor: C1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: MUT3 },
    metaCardHead: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    metaCardLabel: { fontSize: 9, fontWeight: "900", color: MUT, letterSpacing: 0.5 },
    metaCardValue: { fontSize: 14, fontWeight: "700", color: WHT },

    block: { marginBottom: 24 },
    blockTitleWrap: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
    blockTitle: { fontSize: 10, fontWeight: "900", color: MUT, letterSpacing: 1, marginBottom: 8 },
    
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    tagChip: { backgroundColor: C2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: MUT3 },
    tagChipTxt: { fontSize: 11, color: MUT, fontWeight: "600" },

    descBox: { backgroundColor: C1, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: MUT3 },
    descText: { fontSize: 14, color: MUT, lineHeight: 24, fontWeight: "500" },

    attachmentsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    attFileBox: { width: 90, height: 90, backgroundColor: C1, borderRadius: 12, borderWidth: 1, borderColor: MUT3, alignItems: "center", justifyContent: "center", padding: 10 },
    attFileName: { fontSize: 10, color: WHT, fontWeight: "600", textAlign: "center", marginTop: 4, opacity: 0.8 },
    attFileSize: { fontSize: 9, color: MUT, marginTop: 4 },

    createdText: { fontSize: 11, color: MUT, textAlign: "center", marginTop: 10 },

    // Bugs Tab Elements
    bugCard: { backgroundColor: C1, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: MUT3, marginBottom: 10 },
    bugCardFixed: { backgroundColor: "rgba(22,201,146,0.03)", borderColor: "rgba(22,201,146,0.15)" },
    bugHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    bugDate: { fontSize: 10, color: MUT, fontWeight: "600" },
    bugTitle: { fontSize: 14, fontWeight: "700", color: WHT, lineHeight: 20, marginBottom: 10 },
    bugFooter: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 10, borderTopWidth: 1, borderTopColor: Object.assign({}, { borderColor: MUT3 }).borderColor },
    bugFooterTxt: { fontSize: 10, color: MUT, fontWeight: "600" },

    // Messages / Comments Elements
    commentRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
    commentAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
    commentAvatarTxt: { fontSize: 12, fontWeight: "900", color: WHT },
    commentBody: { flex: 1 },
    commentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    commentUser: { fontSize: 13, fontWeight: "800", color: WHT },
    commentDate: { fontSize: 10, color: MUT, fontWeight: "600" },
    commentBox: { backgroundColor: C1, padding: 14, borderRadius: 16, borderTopLeftRadius: 4, borderWidth: 1, borderColor: MUT3 },
    commentText: { fontSize: 13, color: MUT, lineHeight: 22 },

    // History Tab
    historyRow: { flexDirection: "row", gap: 12, minHeight: 50 },
    historyLineWrap: { width: 16, alignItems: "center" },
    historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: PRIMARY, marginTop: 4 },
    historyLine: { flex: 1, width: 2, backgroundColor: MUT3, marginVertical: 4 },
    historyBody: { flex: 1, paddingBottom: 16 },
    historyDesc: { fontSize: 13, color: WHT, fontWeight: "500", lineHeight: 20 },
    historyDate: { fontSize: 10, color: MUT, fontWeight: "600", marginTop: 4 },

    // Modal Styles
    chatFab: { position: "absolute", bottom: 40, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center", shadowColor: PRIMARY, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8, zIndex: 100 },
    chatFabBadge: { position: "absolute", top: -5, right: -5, backgroundColor: "#ef4444", minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: B },
    chatFabBadgeTxt: { color: WHT, fontSize: 10, fontWeight: "900" },
    
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: C1, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: 500 }, // Fixed max height for the modal content
    modalHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: MUT3 },
    modalTitle: { fontSize: 18, fontWeight: "800", color: WHT },
    modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C2, alignItems: "center", justifyContent: "center" },
    modalScroll: { flex: 1 },
    modalEmptyText: { color: MUT, fontSize: 13, textAlign: "center", marginTop: 40, paddingHorizontal: 20 },
    feedbackMsg: { backgroundColor: C2, padding: 16, borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: MUT3 },
    feedbackText: { color: WHT, fontSize: 14, lineHeight: 22, marginBottom: 8 },
    feedbackDate: { color: MUT, fontSize: 10, alignSelf: "flex-end" },
    modalInputArea: { padding: 16, borderTopWidth: 1, borderTopColor: MUT3, backgroundColor: C1, flexDirection: "row", alignItems: "flex-end", gap: 10 },
    modalInput: { flex: 1, minHeight: 46, maxHeight: 120, backgroundColor: C2, borderRadius: 16, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, color: WHT, fontSize: 14, borderWidth: 1, borderColor: MUT3 },
    modalSendBtn: { width: 66, height: 46, borderRadius: 16, backgroundColor: PRIMARY, alignItems: "center", justifyContent: "center" },
});
