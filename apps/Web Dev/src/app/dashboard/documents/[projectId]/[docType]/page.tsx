"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, Upload, FileText, Trash2, Eye, Send, Clock, CheckCircle2,
    FileSignature, ShieldCheck, Mail, Lock, Unlock, X, Download,
    ClipboardList, Handshake, FileCheck, LayoutGrid, Palette, Map,
    BarChart3, Route, FolderCheck, FilePlus2,
} from "lucide-react";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";

// ═══════════════════════════════════════════════════
// DOC TYPE CONFIG
// ═══════════════════════════════════════════════════
interface DocTypeConfig {
    id: string;
    name: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}

const DOC_TYPES: Record<string, DocTypeConfig> = {
    brd: { id: "brd", name: "Business Requirements Document", icon: <ClipboardList size={22} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    contrato: { id: "contrato", name: "Contrato de Prestação de Serviço", icon: <Handshake size={22} />, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
    frd: { id: "frd", name: "Functional Requirements Document", icon: <FileCheck size={22} />, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
    sad: { id: "sad", name: "Software Architecture Document", icon: <LayoutGrid size={22} />, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20" },
    "brand-guide": { id: "brand-guide", name: "Brand Guide", icon: <Palette size={22} />, color: "text-pink-400", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20" },
    "design-system": { id: "design-system", name: "Design System", icon: <LayoutGrid size={22} />, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20" },
    "story-map": { id: "story-map", name: "Story Map", icon: <Map size={22} />, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
    "sprint-review": { id: "sprint-review", name: "Sprint Review Report", icon: <BarChart3 size={22} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    roadmap: { id: "roadmap", name: "RoadMap", icon: <Route size={22} />, color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
    closure: { id: "closure", name: "Project Closure Document", icon: <FolderCheck size={22} />, color: "text-teal-400", bgColor: "bg-teal-500/10", borderColor: "border-teal-500/20" },
    outros: { id: "outros", name: "Outros", icon: <FilePlus2 size={22} />, color: "text-slate-400", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/20" },
};

// ═══════════════════════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════════════════════
type DocStatus = "draft" | "sent" | "signed";

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    draft: { label: "Rascunho", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20", icon: <Clock size={11} /> },
    sent: { label: "Em Assinatura", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: <Send size={11} /> },
    signed: { label: "Assinado", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: <CheckCircle2 size={11} /> },
};

const ROLE_COLORS: Record<string, string> = {
    "contratada": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "contratante": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "testemunha_1": "text-purple-400 bg-purple-500/10 border-purple-500/20",
    "testemunha_2": "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const ROLE_LABELS: Record<string, string> = {
    contratada: "Contratada",
    contratante: "Contratante",
    testemunha_1: "Testemunha 1",
    testemunha_2: "Testemunha 2",
};

// ═══════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════
export default function DocumentTypePage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const docTypeSlug = params.docType as string;
    const docType = DOC_TYPES[docTypeSlug];

    const [project, setProject] = useState<any>(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProject = useCallback(async () => {
        setLoadingProject(true);
        const res = await api<any>(`/api/dev-projects/${projectId}`);
        if (res.success && res.data) setProject(res.data);
        setLoadingProject(false);
    }, [projectId]);
    useEffect(() => { fetchProject(); }, [fetchProject]);

    // ── Documents state (API-backed) ──
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [activeDoc, setActiveDoc] = useState<string | null>(null);
    const [codeInput, setCodeInput] = useState("");
    const [activeSignatory, setActiveSignatory] = useState<string | null>(null);
    const [codeError, setCodeError] = useState(false);
    const [showEmailSent, setShowEmailSent] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploadingTitle, setUploadingTitle] = useState("");
    const [pendingFile, setPendingFile] = useState<{ file: File; name: string; size: string } | null>(null);
    const [uploading, setUploading] = useState(false);

    const fetchDocuments = useCallback(async () => {
        setLoadingDocs(true);
        const res = await api<any[]>(`/api/dev-documents/project/${projectId}/type/${docTypeSlug}`);
        if (res.success && res.data) setDocuments(res.data);
        setLoadingDocs(false);
    }, [projectId, docTypeSlug]);

    useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

    if (loadingProject) return (
        <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
        </div>
    );

    if (!project || !docType) return null;

    // ── Upload handlers ──
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const handleFileSelect = (file: File) => {
        if (file.type !== "application/pdf") return;
        setPendingFile({ file, name: file.name, size: formatFileSize(file.size) });
        setUploadingTitle(file.name.replace(".pdf", ""));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const confirmUpload = async () => {
        if (!pendingFile || !uploadingTitle.trim()) return;
        setUploading(true);
        const formData = new FormData();
        formData.append("file", pendingFile.file);
        formData.append("title", uploadingTitle);

        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        const res = await fetch(`${API_URL}/api/dev-documents/project/${projectId}/type/${docTypeSlug}`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        const data = await res.json();
        if (data.success) {
            await fetchDocuments();
        }
        setPendingFile(null);
        setUploadingTitle("");
        setUploading(false);
    };

    const removeDocument = async (docId: string) => {
        await api(`/api/dev-documents/${docId}`, { method: "DELETE" });
        if (activeDoc === docId) setActiveDoc(null);
        await fetchDocuments();
    };

    // ── Signature handlers ──
    const sendCode = async (docId: string, sigId: string) => {
        await api(`/api/dev-documents/signatures/${sigId}/send-code`, { method: "POST" });
        setShowEmailSent(sigId);
        setTimeout(() => setShowEmailSent(null), 3000);
        await fetchDocuments();
    };

    const validateCode = async (docId: string, sigId: string) => {
        const res = await api<any>(`/api/dev-documents/signatures/${sigId}/validate`, {
            method: "POST",
            body: { code: codeInput },
        });
        if (!res.success) {
            setCodeError(true);
            setTimeout(() => setCodeError(false), 2000);
            return;
        }
        setActiveSignatory(null);
        setCodeInput("");
        await fetchDocuments();
    };

    const sendAllCodes = async (docId: string) => {
        await api(`/api/dev-documents/${docId}/send-all`, { method: "POST" });
        await fetchDocuments();
    };

    const currentDoc = activeDoc ? documents.find(d => d.id === activeDoc) : null;

    // ═══════════════════════════════════════
    // SIGNATURE DETAIL VIEW
    // ═══════════════════════════════════════
    if (currentDoc) {
        const signedCount = currentDoc.signatures.filter((s: any) => s.status === "signed").length;
        const allSigned = currentDoc.status === "signed";
        const st = STATUS_CONFIG[currentDoc.status as DocStatus] || STATUS_CONFIG.draft;

        return (
            <div className="p-6 md:p-8 space-y-6 max-w-5xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <button onClick={() => setActiveDoc(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors mb-3">
                        <ArrowLeft size={16} /> Voltar para {docType.name}
                    </button>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl ${docType.bgColor} border ${docType.borderColor} flex items-center justify-center ${docType.color}`}>
                                {docType.icon}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">{currentDoc.title}</h1>
                                <p className="text-slate-400 text-sm">{project.client} — {project.name}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 ${st.bg} ${st.color}`}>
                            {st.icon} {st.label}
                        </span>
                    </div>
                </motion.div>

                {/* PDF Info Card */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    className="bg-slate-800/40 rounded-xl border border-white/[0.06] p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-14 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <FileText size={22} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm text-white font-medium">{currentDoc.fileName}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{formatFileSize(currentDoc.fileSize)} • Enviado em {new Date(currentDoc.createdAt).toLocaleDateString("pt-BR")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={`${API_URL}/api/dev-documents/${currentDoc.id}/download`} target="_blank" rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:text-white hover:border-slate-600 transition-colors">
                                <Eye size={13} /> Visualizar
                            </a>
                            <a href={`${API_URL}/api/dev-documents/${currentDoc.id}/download`} download
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:text-white hover:border-slate-600 transition-colors">
                                <Download size={13} /> Download
                            </a>
                        </div>
                    </div>
                </motion.div>

                {/* Signature Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-slate-800/40 rounded-xl border border-white/[0.06] p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                            <FileSignature size={14} className="text-amber-400" /> Assinaturas
                        </h2>
                        <div className="flex items-center gap-3">
                            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                                    style={{ width: `${currentDoc.signatures.length > 0 ? (signedCount / currentDoc.signatures.length) * 100 : 0}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold">{signedCount}/{currentDoc.signatures.length}</span>
                            {!allSigned && currentDoc.signatures.some((s: any) => s.status === "pending") && (
                                <button onClick={() => sendAllCodes(currentDoc.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors">
                                    <Send size={11} /> Enviar Todos
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        {currentDoc.signatures.map((sig: any) => {
                            const roleColor = ROLE_COLORS[sig.role] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
                            const isCodeEntry = activeSignatory === sig.id;

                            return (
                                <div key={sig.id} className={`p-4 rounded-xl border transition-all ${sig.status === "signed"
                                    ? "bg-blue-500/5 border-blue-500/20"
                                    : isCodeEntry ? "bg-amber-500/5 border-amber-500/20"
                                        : "bg-slate-900/40 border-slate-700/30"
                                    }`}>
                                    <div className="flex items-center justify-between flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${sig.status === "signed" ? "bg-gradient-to-tr from-blue-600 to-blue-400"
                                                : sig.role.includes("contratada") ? "bg-gradient-to-tr from-blue-600 to-blue-400"
                                                    : sig.role.includes("contratante") ? "bg-gradient-to-tr from-blue-600 to-cyan-400"
                                                        : "bg-gradient-to-tr from-purple-600 to-violet-400"
                                                }`}>
                                                {sig.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-white font-medium">{sig.name}</p>
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-md border ${roleColor}`}>{ROLE_LABELS[sig.role] || sig.role}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Mail size={10} /> {sig.email}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {sig.status === "signed" ? (
                                                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                                    <ShieldCheck size={13} /> Assinado em {new Date(sig.signedAt).toLocaleString("pt-BR")}
                                                </span>
                                            ) : sig.status === "code_sent" ? (
                                                <div className="flex items-center gap-2">
                                                    {showEmailSent === sig.id && (
                                                        <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                                                            className="text-[10px] text-blue-400 font-bold">✓ Código enviado</motion.span>
                                                    )}
                                                    <button onClick={() => { setActiveSignatory(sig.id); setCodeInput(""); setCodeError(false); }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors">
                                                        <Lock size={12} /> Inserir Código
                                                    </button>
                                                    <button onClick={() => sendCode(currentDoc.id, sig.id)}
                                                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Reenviar código">
                                                        <Send size={13} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => sendCode(currentDoc.id, sig.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-800/50 border border-slate-700/30 rounded-lg hover:text-white hover:border-slate-600 transition-colors">
                                                    <Send size={12} /> Enviar Código
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Code Entry */}
                                    <AnimatePresence>
                                        {isCodeEntry && sig.status === "code_sent" && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                <div className="mt-4 pt-4 border-t border-slate-700/20 flex items-end gap-3">
                                                    <div className="flex-1 max-w-xs">
                                                        <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">Código de Verificação</label>
                                                        <input type="text" value={codeInput}
                                                            onChange={e => { setCodeInput(e.target.value.toUpperCase()); setCodeError(false); }}
                                                            placeholder="Ex: A1B2C3" maxLength={6} autoFocus
                                                            className={`w-full px-4 py-2.5 bg-slate-800/50 border rounded-lg text-sm text-white text-center font-mono tracking-[0.3em] placeholder:text-slate-600 placeholder:tracking-normal focus:outline-none transition-colors ${codeError ? "border-red-500/50" : "border-white/[0.06] focus:border-amber-500/50"}`} />
                                                        {codeError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-red-400 mt-1">Código inválido.</motion.p>}
                                                        <p className="text-[9px] text-slate-600 mt-1.5">
                                                            Enviado para <span className="text-slate-400">{sig.email}</span>
                                                            {sig.code && <span className="text-amber-500/60 ml-1">(Demo: {sig.code})</span>}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => validateCode(currentDoc.id, sig.id)} disabled={codeInput.length < 6}
                                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5">
                                                        <Unlock size={14} /> Validar
                                                    </button>
                                                    <button onClick={() => setActiveSignatory(null)} className="p-2.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>

                    {/* All Signed */}
                    {allSigned && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={18} className="text-blue-400" />
                                <h3 className="text-sm font-bold text-blue-400">Documento Assinado com Sucesso!</h3>
                            </div>
                            <p className="text-xs text-slate-400">
                                O documento com validação de assinatura foi enviado por e-mail para todos os envolvidos.
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {currentDoc.signatures.map((s: any) => (
                                    <span key={s.id} className="px-2.5 py-1 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md flex items-center gap-1">
                                        <Mail size={9} /> {s.email}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // MAIN LIST VIEW
    // ═══════════════════════════════════════
    return (
        <div className="p-6 md:p-8 space-y-6 max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={() => router.push(`/dashboard/documents/${projectId}`)}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors mb-3">
                    <ArrowLeft size={16} /> Voltar para Documentos
                </button>
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${docType.bgColor} border ${docType.borderColor} flex items-center justify-center ${docType.color}`}>
                        {docType.icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{docType.name}</h1>
                        <p className="text-slate-400 text-sm">{project.client} — {project.name}</p>
                    </div>
                </div>
            </motion.div>

            {/* Upload Area */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="bg-slate-800/40 rounded-xl border border-white/[0.06] p-5 space-y-4">
                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2">
                    <Upload size={14} className="text-blue-400" /> Enviar Documento
                </h3>

                {/* Pending file to confirm */}
                <AnimatePresence>
                    {pendingFile && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="p-4 rounded-xl bg-slate-900/60 border border-blue-600/20 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <FileText size={18} className="text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{pendingFile.name}</p>
                                    <p className="text-[10px] text-slate-500">{pendingFile.size}</p>
                                </div>
                                <button onClick={() => setPendingFile(null)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1.5">Título do Documento</label>
                                <input type="text" value={uploadingTitle} onChange={e => setUploadingTitle(e.target.value)}
                                    placeholder="Ex: BRD — App E-commerce v1"
                                    className="w-full px-4 py-2.5 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-600/50" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setPendingFile(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
                                <button onClick={confirmUpload} disabled={uploading}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-blue-600/20">
                                    <Upload size={14} /> {uploading ? "Enviando..." : "Confirmar Upload"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!pendingFile && (
                    <div
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all ${dragOver
                            ? "border-blue-500/50 bg-blue-500/5"
                            : "border-slate-700/50 hover:border-blue-500/30 hover:bg-blue-500/5"
                            }`}
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-slate-700/30 flex items-center justify-center mb-3">
                            <Upload size={24} className={`${dragOver ? "text-blue-400" : "text-slate-500"} transition-colors`} />
                        </div>
                        <p className="text-sm text-white font-medium mb-1">
                            {dragOver ? "Solte o arquivo aqui" : "Arraste e solte um PDF aqui"}
                        </p>
                        <p className="text-xs text-slate-500">ou clique para selecionar</p>
                        <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ""; }} />
                    </div>
                )}
            </motion.div>

            {/* Loading docs */}
            {loadingDocs && (
                <div className="flex items-center justify-center py-10">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
                </div>
            )}

            {/* Documents List */}
            {!loadingDocs && documents.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="space-y-3">
                    <h3 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2 px-1">
                        <FileText size={14} className="text-slate-400" /> Documentos Enviados ({documents.length})
                    </h3>

                    {documents.map((doc, i) => {
                        const st = STATUS_CONFIG[doc.status as DocStatus] || STATUS_CONFIG.draft;
                        const signedCount = doc.signatures?.filter((s: any) => s.status === "signed").length || 0;

                        return (
                            <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="bg-slate-800/40 rounded-xl border border-white/[0.06] p-4 hover:border-blue-500/20 transition-all group">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                            <FileText size={18} className="text-red-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm text-white font-medium truncate">{doc.title}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-[10px] text-slate-500">{doc.fileName} • {formatFileSize(doc.fileSize)}</span>
                                                <span className="text-[10px] text-slate-500">{new Date(doc.createdAt).toLocaleDateString("pt-BR")}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md border ${st.bg} ${st.color}`}>
                                            {st.icon} {st.label}
                                        </span>
                                        {doc.status !== "draft" && (
                                            <span className="text-[10px] text-slate-500">{signedCount}/{doc.signatures?.length || 0} assinaturas</span>
                                        )}
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setActiveDoc(doc.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-colors">
                                                <FileSignature size={12} /> {doc.status === "draft" ? "Enviar p/ Assinatura" : "Ver Assinaturas"}
                                            </button>
                                            <button onClick={() => removeDocument(doc.id)}
                                                className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* Empty State */}
            {!loadingDocs && documents.length === 0 && !pendingFile && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="flex flex-col items-center justify-center py-12 text-center">
                    <div className={`w-14 h-14 rounded-2xl ${docType.bgColor} border ${docType.borderColor} flex items-center justify-center mb-4 ${docType.color}`}>
                        {docType.icon}
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">Nenhum documento enviado</h3>
                    <p className="text-sm text-slate-500 max-w-sm">Faça o upload de um PDF acima para iniciar o processo de assinatura.</p>
                </motion.div>
            )}
        </div>
    );
}
