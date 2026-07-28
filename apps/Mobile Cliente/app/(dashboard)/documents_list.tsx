/**
 * ═════════════════════════════════════════════════
 * DOCUMENTOS — Categorias de documentos do projeto
 * Replicando a estrutura do Web Cliente
 * ═════════════════════════════════════════════════
 */
import { useEffect, useState } from "react";
import {
    View, Text, ScrollView, ActivityIndicator,
    StyleSheet, TouchableOpacity, Linking, Modal, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import {
    ClipboardList, Handshake, FileCheck, LayoutGrid,
    Palette, Map as MapIcon, BarChart3, Route, FolderCheck, FilePlus2,
    FileText, Clock, User, Download, X, Eye, Info, FolderOpen, Share,
} from "lucide-react-native";
import { api } from "../../src/lib/api";

const BASE = "http://10.0.0.133:7777";

// ── Design tokens ──
const B   = "#0a0a0a";
const C1  = "#111111";
const GRN = "#22ffb5";
const WHT = "#ffffff";
const MUT = "rgba(255,255,255,0.40)";
const MUT3 = "rgba(255,255,255,0.06)";

// ═════════════════════════════════════════
// DOCUMENT CATEGORY DEFINITIONS
// ═════════════════════════════════════════

interface DocTemplate {
    id: string;
    name: string;
    description: string;
    iconName: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

interface DocCategory {
    title: string;
    docs: DocTemplate[];
}

const ICON_MAP: Record<string, any> = {
    ClipboardList, Handshake, FileCheck, LayoutGrid,
    Palette, MapIcon, BarChart3, Route, FolderCheck, FilePlus2,
};

const DOC_CATEGORIES: DocCategory[] = [
    {
        title: "Consultoria de Projetos e Administrativo",
        docs: [
            { id: "brd", name: "Business Requirements Document", description: "Levantamento detalhado de requisitos que reúne todos os usuários, telas, funcionalidades, regras de negócio e objetivos do sistema.", iconName: "ClipboardList", color: "#60a5fa", bgColor: "rgba(59,130,246,0.10)", borderColor: "rgba(59,130,246,0.20)" },
            { id: "contrato", name: "Contrato de Prestação de Serviço", description: "Documento que formaliza todos os itens contratados e as condições comerciais negociadas entre as partes.", iconName: "Handshake", color: "#60a5fa", bgColor: "rgba(59,130,246,0.10)", borderColor: "rgba(59,130,246,0.20)" },
        ],
    },
    {
        title: "Pré-Desenvolvimento",
        docs: [
            { id: "frd", name: "Functional Requirements Document", description: "Documento em que o time de desenvolvimento detalha tecnicamente o Business Requirements Document.", iconName: "FileCheck", color: "#c084fc", bgColor: "rgba(168,85,247,0.10)", borderColor: "rgba(168,85,247,0.20)" },
            { id: "sad", name: "Software Architecture Document", description: "Documento que descreve a arquitetura técnica da aplicação, tecnologias, frameworks, integrações e padrões.", iconName: "LayoutGrid", color: "#22d3ee", bgColor: "rgba(6,182,212,0.10)", borderColor: "rgba(6,182,212,0.20)" },
            { id: "brand-guide", name: "Brand Guide", description: "Documento que define a identidade visual da marca do cliente dentro do projeto.", iconName: "Palette", color: "#f472b6", bgColor: "rgba(236,72,153,0.10)", borderColor: "rgba(236,72,153,0.20)" },
            { id: "design-system", name: "Design System", description: "Documento que reúne os padrões visuais e componentes de interface que serão utilizados na aplicação.", iconName: "LayoutGrid", color: "#a78bfa", bgColor: "rgba(139,92,246,0.10)", borderColor: "rgba(139,92,246,0.20)" },
            { id: "story-map", name: "Story Map", description: "Documento que organiza todas as telas que serão desenvolvidas no sistema.", iconName: "MapIcon", color: "#fbbf24", bgColor: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.20)" },
        ],
    },
    {
        title: "Desenvolvimento",
        docs: [
            { id: "sprint-review", name: "Sprint Review Report", description: "Documento gerado após cada reunião de apresentação de progresso do projeto.", iconName: "BarChart3", color: "#60a5fa", bgColor: "rgba(59,130,246,0.10)", borderColor: "rgba(59,130,246,0.20)" },
            { id: "roadmap", name: "RoadMap", description: "Documento que organiza e prioriza ideias, melhorias e funcionalidades para versões futuras.", iconName: "Route", color: "#fb923c", bgColor: "rgba(249,115,22,0.10)", borderColor: "rgba(249,115,22,0.20)" },
        ],
    },
    {
        title: "Entrega do Projeto",
        docs: [
            { id: "closure", name: "Project Closure Document", description: "Documento que formaliza o encerramento do projeto após a entrega de todos os itens contratados.", iconName: "FolderCheck", color: "#2dd4bf", bgColor: "rgba(20,184,166,0.10)", borderColor: "rgba(20,184,166,0.20)" },
            { id: "outros", name: "Outros", description: "Documentos complementares: aditivos contratuais, NDAs, termos de confidencialidade, atas de reunião, etc.", iconName: "FilePlus2", color: "#94a3b8", bgColor: "rgba(100,116,139,0.10)", borderColor: "rgba(100,116,139,0.20)" },
        ],
    },
];

// ═════════════════════════════════════════
// HELPERS
// ═════════════════════════════════════════

function formatDate(d: string) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatFileSize(bytes: number) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ═════════════════════════════════════════
// COMPONENT
// ═════════════════════════════════════════

type RealDoc = {
    id: string; docType: string; title: string; fileName: string;
    mimeType: string; fileSize: number; createdAt: string;
    uploadedBy?: { name: string };
};

export default function DocumentsScreen() {
    const insets = useSafeAreaInsets();
    const [realDocs, setRealDocs] = useState<RealDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<{ template: DocTemplate; real: RealDoc } | null>(null);
    const [infoDoc, setInfoDoc] = useState<DocTemplate | null>(null);

    useEffect(() => {
        api<RealDoc[]>("/api/dev-projects/documents/all")
            .then(r => {
                if (r?.success && r.data) setRealDocs(r.data);
                else setRealDocs([]);
            })
            .catch(() => setRealDocs([]))
            .finally(() => setLoading(false));
    }, []);

    // Map docType → real document
    const docByType: Record<string, RealDoc> = {};
    for (const d of realDocs) {
        if (!docByType[d.docType]) docByType[d.docType] = d;
    }

    const handleDownload = (docId: string) => {
        Linking.openURL(`${BASE}/api/dev-projects/documents/${docId}/download`);
    };

    const handleCardPress = (template: DocTemplate) => {
        const real = docByType[template.id];
        if (real) {
            setSelectedDoc({ template, real });
        }
    };

    if (loading) {
        return <View style={[styles.center, { backgroundColor: B }]}><ActivityIndicator size="large" color={GRN} /></View>;
    }

    return (
        <View style={{ flex: 1, backgroundColor: B }}>
            <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>

                <View style={styles.pageHeader}>
                    <Text style={styles.pageTitle}>Documentos</Text>
                    <Text style={styles.pageSubtitle}>Acesse todos os documentos relacionados aos seus projetos.</Text>
                </View>

                {DOC_CATEGORIES.map((category) => (
                    <View key={category.title} style={styles.categorySection}>
                        {/* Category header */}
                        <View style={styles.categoryHeader}>
                            <View style={styles.categoryLine} />
                            <Text style={styles.categoryTitle}>{category.title.toUpperCase()}</Text>
                        </View>

                        {/* Document cards */}
                        {category.docs.map((doc) => {
                            const realDoc = docByType[doc.id];
                            const hasDoc = !!realDoc;
                            const IconComp = ICON_MAP[doc.iconName] || FileText;

                            return (
                                <TouchableOpacity
                                    key={doc.id}
                                    style={[
                                        styles.card,
                                        !hasDoc && styles.cardDisabled,
                                    ]}
                                    activeOpacity={hasDoc ? 0.7 : 1}
                                    onPress={() => hasDoc && handleCardPress(doc)}
                                >
                                    <View style={styles.cardTop}>
                                        <View style={[styles.iconWrap, { backgroundColor: doc.bgColor, borderColor: doc.borderColor }]}>
                                            <IconComp size={20} color={doc.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.cardTitle, !hasDoc && styles.cardTitleDisabled]} numberOfLines={2}>
                                                {doc.name}
                                            </Text>
                                        </View>
                                        <View style={styles.cardActions}>
                                            <TouchableOpacity onPress={() => setInfoDoc(doc)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                <Info size={14} color={MUT} />
                                            </TouchableOpacity>
                                            {hasDoc && (
                                                <>
                                                    <TouchableOpacity onPress={() => handleDownload(realDoc.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                        <Download size={14} color={MUT} />
                                                    </TouchableOpacity>
                                                    <Eye size={14} color={MUT} />
                                                </>
                                            )}
                                            {!hasDoc && (
                                                <View style={styles.noDocBadge}>
                                                    <Text style={styles.noDocText}>Sem Doc</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Meta info if real doc exists */}
                                    {hasDoc && (
                                        <View style={styles.metaRow}>
                                            {realDoc.uploadedBy?.name && (
                                                <View style={styles.metaItem}>
                                                    <User size={10} color="#475569" />
                                                    <Text style={styles.metaText}>{realDoc.uploadedBy.name}</Text>
                                                </View>
                                            )}
                                            <View style={styles.metaItem}>
                                                <Clock size={10} color="#475569" />
                                                <Text style={styles.metaText}>{formatDate(realDoc.createdAt)}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <FileText size={10} color="#475569" />
                                                <Text style={styles.metaText}>{formatFileSize(realDoc.fileSize)}</Text>
                                            </View>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ═══════════════════════════════════════ */}
            {/* INFO TOOLTIP MODAL                     */}
            {/* ═══════════════════════════════════════ */}
            <Modal visible={!!infoDoc} transparent animationType="fade" onRequestClose={() => setInfoDoc(null)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setInfoDoc(null)}>
                    <View style={styles.infoModal}>
                        {infoDoc && (
                            <>
                                <View style={styles.infoModalHeader}>
                                    <Text style={styles.infoModalTitle}>{infoDoc.name}</Text>
                                    <TouchableOpacity onPress={() => setInfoDoc(null)}>
                                        <X size={18} color={MUT} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.infoModalDesc}>{infoDoc.description}</Text>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* ═══════════════════════════════════════ */}
            {/* DOCUMENT DETAIL MODAL                  */}
            {/* ═══════════════════════════════════════ */}
            <Modal visible={!!selectedDoc} animationType="slide" onRequestClose={() => setSelectedDoc(null)}>
                <View style={styles.pdfContainer}>
                    {selectedDoc && (() => {
                        const IconComp = ICON_MAP[selectedDoc.template.iconName] || FileText;
                        const pdfUrl = `${BASE}/api/dev-projects/documents/${selectedDoc.real.id}/download`;
                        const isPdf = selectedDoc.real.mimeType === "application/pdf";
                        const viewUrl = pdfUrl;
                        return (
                            <>
                                {/* Header */}
                                <View style={[styles.pdfHeader, { paddingTop: insets.top + 8 }]}>
                                    <TouchableOpacity onPress={() => setSelectedDoc(null)} style={styles.closeBtn}>
                                        <X size={18} color={MUT} />
                                    </TouchableOpacity>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.detailTitle} numberOfLines={1}>{selectedDoc.real.title}</Text>
                                        <Text style={styles.detailSub}>{formatDate(selectedDoc.real.createdAt)} · {formatFileSize(selectedDoc.real.fileSize)}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => Linking.openURL(viewUrl)} style={styles.closeBtn}>
                                        <Download size={16} color={GRN} />
                                    </TouchableOpacity>
                                </View>

                                {/* PDF Viewer */}
                                {isPdf ? (
                                    <WebView
                                        source={{ uri: viewUrl }}
                                        style={styles.pdfWebView}
                                        startInLoadingState
                                        renderLoading={() => (
                                            <View style={styles.pdfLoading}>
                                                <ActivityIndicator size="large" color={GRN} />
                                                <Text style={{ color: MUT, marginTop: 12, fontSize: 13, fontWeight: "600" }}>Carregando PDF...</Text>
                                            </View>
                                        )}
                                    />
                                ) : (
                                    <View style={styles.detailBody}>
                                        <View style={[styles.detailBigIcon, { backgroundColor: selectedDoc.template.bgColor, borderColor: selectedDoc.template.borderColor }]}>
                                            <IconComp size={48} color={selectedDoc.template.color} />
                                        </View>
                                        <Text style={styles.detailDocTitle}>{selectedDoc.real.title}</Text>
                                        <Text style={styles.detailFileName}>{selectedDoc.real.fileName}</Text>
                                        <Text style={styles.detailMeta}>{formatFileSize(selectedDoc.real.fileSize)} · {selectedDoc.real.mimeType}</Text>
                                        <TouchableOpacity style={styles.downloadBtn} onPress={() => Linking.openURL(viewUrl)}>
                                            <Download size={16} color={WHT} />
                                            <Text style={styles.downloadBtnText}>Baixar Documento</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        );
                    })()}
                </View>
            </Modal>
        </View>
    );
}

// ═════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: B },
    content: { paddingHorizontal: 16, paddingBottom: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },

    pageHeader: { marginBottom: 28, paddingTop: 12 },
    pageTitle: { fontSize: 32, fontWeight: "900", color: WHT, letterSpacing: -1 },
    pageSubtitle: { fontSize: 13, color: MUT, marginTop: 4, fontWeight: "500" },

    // ── Category ──
    categorySection: { marginBottom: 24 },
    categoryHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    categoryLine: { width: 20, height: 1, backgroundColor: "rgba(71,85,105,0.4)" },
    categoryTitle: { fontSize: 10, fontWeight: "900", color: "#475569", letterSpacing: 1.5 },

    // ── Card ──
    card: {
        backgroundColor: C1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    cardDisabled: {
        opacity: 0.35,
    },
    cardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: WHT,
        letterSpacing: -0.3,
        lineHeight: 20,
    },
    cardTitleDisabled: {
        color: "#475569",
    },
    cardActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingTop: 2,
    },
    noDocBadge: {
        backgroundColor: MUT3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    noDocText: {
        fontSize: 8,
        fontWeight: "800",
        color: "#475569",
        letterSpacing: 0.5,
    },

    // ── Meta ──
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 10,
        paddingLeft: 52,
        flexWrap: "wrap",
    },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: { fontSize: 10, color: "#475569", fontWeight: "600" },

    // ── Info Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    infoModal: {
        backgroundColor: "#0f172a",
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        width: "100%",
        maxWidth: 360,
    },
    infoModalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    infoModalTitle: { fontSize: 15, fontWeight: "800", color: WHT, flex: 1, marginRight: 12 },
    infoModalDesc: { fontSize: 13, color: "#94a3b8", lineHeight: 20 },

    // ── Detail Modal ──
    detailModal: {
        backgroundColor: "#0f172a",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: "auto",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderBottomWidth: 0,
        overflow: "hidden",
    },
    detailHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
        backgroundColor: "rgba(15,23,42,0.8)",
    },
    detailIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    detailTitle: { fontSize: 14, fontWeight: "800", color: WHT },
    detailSub: { fontSize: 10, color: "#475569", marginTop: 2 },
    closeBtn: {
        width: 32, height: 32, borderRadius: 8,
        backgroundColor: MUT3,
        alignItems: "center", justifyContent: "center",
    },

    detailBody: {
        alignItems: "center",
        paddingVertical: 40,
        paddingHorizontal: 24,
        gap: 8,
    },
    detailBigIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    detailDocTitle: { fontSize: 18, fontWeight: "900", color: WHT, textAlign: "center", letterSpacing: -0.5 },
    detailFileName: { fontSize: 13, color: "#94a3b8" },
    detailMeta: { fontSize: 11, color: "#475569" },

    downloadBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 24,
        backgroundColor: "#22ffb5",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 14,
    },
    downloadBtnText: { fontSize: 14, fontWeight: "800", color: B },

    // ── PDF Viewer ──
    pdfContainer: {
        flex: 1,
        backgroundColor: B,
    },
    pdfHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
        backgroundColor: C1,
    },
    pdfWebView: {
        flex: 1,
        backgroundColor: B,
    },
    pdfLoading: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: B,
        alignItems: "center",
        justifyContent: "center",
    },
    mockBadge: {
        marginTop: 24,
        backgroundColor: MUT3,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    mockBadgeText: {
        fontSize: 12,
        color: "#475569",
        fontWeight: "600",
        textAlign: "center",
        lineHeight: 18,
    },
});
