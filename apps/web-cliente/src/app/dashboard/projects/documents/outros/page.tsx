"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, FilePlus2, FileText, Download, X, Eye,
    Clock, User, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import {
    fetchDocuments,
    downloadDocumentUrl,
    docStatusLabel,
    formatDate,
    formatFileSize,
    type DevProjectDocument,
} from "@/lib/projects-api";

/* ═══════════════════════════════════════ */
/* STATUS CONFIG                           */
/* ═══════════════════════════════════════ */
const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    signed:  { icon: CheckCircle2, color: "text-blue-400", bg: "bg-blue-500/10" },
    sent:    { icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
    draft:   { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
};

/* doc‑types that count as "outros" */
const OUTROS_TYPES = ["aditivo", "nda", "ata", "autorizacao", "termo", "notificacao", "outros"];

export default function OutrosDocumentsPage() {
    const router = useRouter();
    const [viewingDoc, setViewingDoc] = useState<DevProjectDocument | null>(null);
    const [documents, setDocuments] = useState<DevProjectDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const all = await fetchDocuments();
            if (all.success && all.data) {
                // Filter documents whose docType matches "outros" bucket
                const filtered = all.data.filter(d => OUTROS_TYPES.includes(d.docType));
                setDocuments(filtered);
            }
            setLoading(false);
        }
        load();
    }, []);

    const handleDownload = (doc: DevProjectDocument) => {
        const url = downloadDocumentUrl(doc.id);
        const a = document.createElement("a");
        a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    if (loading) {
        return (
            <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="text-blue-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={() => router.push("/dashboard/projects/documents")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors mb-4 group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Voltar para Documentos
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-center">
                        <FilePlus2 size={28} className="text-slate-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Outros Documentos</h1>
                        <p className="text-slate-400 text-sm mt-1">Aditivos contratuais, NDAs, termos e demais documentos do projeto.</p>
                    </div>
                </div>
            </motion.div>

            {/* Empty State */}
            {documents.length === 0 && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/[0.06] flex items-center justify-center mb-4">
                        <FilePlus2 size={28} className="text-slate-600" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-400 mb-1">Nenhum documento encontrado</h3>
                    <p className="text-xs text-slate-600 max-w-xs">Ainda não há documentos complementares registrados nos projetos.</p>
                </motion.div>
            )}

            {/* Documents List */}
            <div className="space-y-3">
                {documents.map((doc, idx) => {
                    const sc = statusConfig[doc.status] || statusConfig.draft;
                    const StatusIcon = sc.icon;
                    const statusLabel = docStatusLabel(doc.status);

                    return (
                        <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            onClick={() => setViewingDoc(doc)}
                            className="group p-4 rounded-xl bg-slate-800/40 border border-white/[0.06] hover:border-white/[0.12] hover:shadow-lg hover:shadow-blue-500/5 cursor-pointer transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-slate-700/30 border border-white/[0.06] flex items-center justify-center text-slate-400 shrink-0">
                                    <FileText size={20} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-sm font-bold text-white truncate">{doc.title}</h3>
                                        <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${sc.bg} ${sc.color}`}>
                                            <StatusIcon size={10} />{statusLabel}
                                        </span>
                                    </div>
                                    {doc.notes && <p className="text-xs text-slate-500 line-clamp-1">{doc.notes}</p>}
                                    <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-600">
                                        <span className="flex items-center gap-1"><User size={10} />{doc.uploadedBy?.name || "—"}</span>
                                        <span className="flex items-center gap-1"><Clock size={10} />{formatDate(doc.createdAt)}</span>
                                        <span className="flex items-center gap-1"><FileText size={10} />{formatFileSize(doc.fileSize)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={(e) => { e.stopPropagation(); setViewingDoc(doc); }}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors" title="Visualizar">
                                        <Eye size={16} />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                                        className="p-2.5 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Download">
                                        <Download size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* PDF Viewer Modal */}
            <AnimatePresence>
                {viewingDoc && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
                        onClick={() => setViewingDoc(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-slate-800/50 shrink-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-slate-700/30 border border-white/[0.06] flex items-center justify-center text-slate-400">
                                        <FileText size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate">{viewingDoc.title}</h3>
                                        <p className="text-[10px] text-slate-500">{formatDate(viewingDoc.createdAt)} · {formatFileSize(viewingDoc.fileSize)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleDownload(viewingDoc)} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Download">
                                        <Download size={16} />
                                    </button>
                                    <button onClick={() => setViewingDoc(null)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Fechar">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Document content */}
                            <div className="flex-1 bg-slate-950/50 overflow-y-auto custom-scrollbar">
                                {viewingDoc.mimeType === "application/pdf" ? (
                                    <iframe src={`${downloadDocumentUrl(viewingDoc.id)}?view=1`} className="w-full h-full border-0" title={viewingDoc.title} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                                        <div className="w-20 h-20 rounded-2xl bg-slate-700/30 border border-white/[0.06] flex items-center justify-center text-slate-400">
                                            <FileText size={40} />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white mb-2">{viewingDoc.title}</h3>
                                            <p className="text-sm text-slate-400 mb-1">{viewingDoc.fileName}</p>
                                            <p className="text-xs text-slate-500">{formatFileSize(viewingDoc.fileSize)} · {viewingDoc.mimeType}</p>
                                        </div>
                                        <button onClick={() => handleDownload(viewingDoc)}
                                            className="mt-4 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all">
                                            <Download size={16} /> Baixar Documento
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
