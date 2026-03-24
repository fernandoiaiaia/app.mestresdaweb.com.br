"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    FileText, ChevronRight, Info, Download, X, Eye, Loader2,
    ClipboardList, Handshake, FileCheck, LayoutGrid,
    Palette, Map, BarChart3, Route, FolderCheck, FilePlus2,
    Clock, User,
} from "lucide-react";
import {
    fetchDocuments,
    downloadDocumentUrl,
    formatDate,
    formatFileSize,
    type DevProjectDocument,
} from "@/lib/projects-api";

// ═══════════════════════════════════════════════════
// DOCUMENT CATEGORY DEFINITIONS (static templates)
// ═══════════════════════════════════════════════════

interface DocCardTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    navigateTo?: string;
}

interface DocCategory {
    title: string;
    docs: DocCardTemplate[];
}

const DOC_CATEGORIES: DocCategory[] = [
    {
        title: "Consultoria de Projetos e Administrativo",
        docs: [
            { id: "brd", name: "Business Requirements Document", description: "Levantamento detalhado de requisitos que reúne todos os usuários, telas, funcionalidades, regras de negócio e objetivos do sistema.", icon: <ClipboardList size={22} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
            { id: "contrato", name: "Contrato de Prestação de Serviço", description: "Documento que formaliza todos os itens contratados e as condições comerciais negociadas entre as partes.", icon: <Handshake size={22} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
        ],
    },
    {
        title: "Pré-Desenvolvimento",
        docs: [
            { id: "frd", name: "Functional Requirements Document", description: "Documento em que o time de desenvolvimento detalha tecnicamente o Business Requirements Document.", icon: <FileCheck size={22} />, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
            { id: "sad", name: "Software Architecture Document", description: "Documento que descreve a arquitetura técnica da aplicação, tecnologias, frameworks, integrações e padrões.", icon: <LayoutGrid size={22} />, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20" },
            { id: "brand-guide", name: "Brand Guide", description: "Documento que define a identidade visual da marca do cliente dentro do projeto.", icon: <Palette size={22} />, color: "text-pink-400", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20" },
            { id: "design-system", name: "Design System", description: "Documento que reúne os padrões visuais e componentes de interface que serão utilizados na aplicação.", icon: <LayoutGrid size={22} />, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20" },
            { id: "story-map", name: "Story Map", description: "Documento que organiza todas as telas que serão desenvolvidas no sistema.", icon: <Map size={22} />, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
        ],
    },
    {
        title: "Desenvolvimento",
        docs: [
            { id: "sprint-review", name: "Sprint Review Report", description: "Documento gerado após cada reunião de apresentação de progresso do projeto.", icon: <BarChart3 size={22} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
            { id: "roadmap", name: "RoadMap", description: "Documento que organiza e prioriza ideias, melhorias e funcionalidades para versões futuras.", icon: <Route size={22} />, color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
        ],
    },
    {
        title: "Entrega do Projeto",
        docs: [
            { id: "closure", name: "Project Closure Document", description: "Documento que formaliza o encerramento do projeto após a entrega de todos os itens contratados.", icon: <FolderCheck size={22} />, color: "text-teal-400", bgColor: "bg-teal-500/10", borderColor: "border-teal-500/20" },
            { id: "outros", name: "Outros", description: "Documentos complementares: aditivos contratuais, NDAs, termos de confidencialidade, atas de reunião, etc.", icon: <FilePlus2 size={22} />, color: "text-slate-400", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/20", navigateTo: "/dashboard/projects/documents/outros" },
        ],
    },
];

// ═══════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════
export default function DocumentsPage() {
    const router = useRouter();
    const [viewingDoc, setViewingDoc] = useState<{ template: DocCardTemplate; real: DevProjectDocument } | null>(null);
    const [realDocs, setRealDocs] = useState<DevProjectDocument[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments().then((res) => {
            if (res.success && res.data) setRealDocs(res.data);
        }).finally(() => setLoading(false));
    }, []);

    // Map docType → real document (first match)
    const docByType: Record<string, DevProjectDocument> = {};
    for (const d of realDocs) {
        if (!docByType[d.docType]) docByType[d.docType] = d;
    }

    const handleCardClick = (template: DocCardTemplate) => {
        if (template.navigateTo) { router.push(template.navigateTo); return; }
        const real = docByType[template.id];
        if (real) { setViewingDoc({ template, real }); return; }
    };

    const handleDownload = (docId: string) => {
        const url = downloadDocumentUrl(docId);
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
        <div className="p-6 md:p-8 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
                <p className="text-slate-400 mt-1">Acesse todos os documentos relacionados aos seus projetos.</p>
            </motion.div>

            {DOC_CATEGORIES.map((category, catIdx) => (
                <motion.div key={category.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: catIdx * 0.08 }}
                    className="space-y-3">
                    <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2 px-1">
                        <div className="h-px flex-1 max-w-[20px] bg-slate-700/60" />
                        {category.title}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.docs.map((doc, docIdx) => {
                            const realDoc = docByType[doc.id];
                            const hasDoc = !!realDoc || !!doc.navigateTo;
                            const isClickable = hasDoc;

                            return (
                                <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: catIdx * 0.08 + docIdx * 0.04 }}
                                    onClick={() => handleCardClick(doc)}
                                    className={`group p-4 rounded-xl border transition-all
                                        ${!isClickable
                                            ? "bg-slate-800/20 border-white/[0.03] opacity-40 cursor-not-allowed"
                                            : "bg-slate-800/40 border-white/[0.06] hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-lg ${doc.bgColor} border ${doc.borderColor} flex items-center justify-center ${doc.color} ${!isClickable ? "grayscale" : ""}`}>
                                            {doc.icon}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {!isClickable && (
                                                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-slate-700/30 text-slate-600">
                                                    Sem Doc
                                                </span>
                                            )}
                                            <div className="relative group/info">
                                                <button onClick={e => e.stopPropagation()} className="p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-slate-700/50 transition-colors">
                                                    <Info size={14} />
                                                </button>
                                                <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl shadow-black/50 text-[11px] text-slate-300 leading-relaxed opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-30 pointer-events-none">
                                                    {doc.description}
                                                    <div className="absolute bottom-[-5px] right-3 w-2.5 h-2.5 bg-slate-900 border-r border-b border-white/[0.06] rotate-45" />
                                                </div>
                                            </div>
                                            {realDoc && (
                                                <button onClick={(e) => { e.stopPropagation(); handleDownload(realDoc.id); }}
                                                    className="p-1 rounded-md text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Download">
                                                    <Download size={14} />
                                                </button>
                                            )}
                                            {isClickable && (
                                                realDoc
                                                    ? <Eye size={16} className="text-slate-600 group-hover:text-blue-400 transition-all" />
                                                    : <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                                            )}
                                        </div>
                                    </div>
                                    <h3 className={`text-sm font-bold mb-1.5 leading-snug transition-colors ${!isClickable ? "text-slate-600" : "text-white group-hover:text-blue-400"}`}>
                                        {doc.name}
                                    </h3>
                                    {realDoc && (
                                        <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-600">
                                            <span className="flex items-center gap-1"><User size={9} />{realDoc.uploadedBy?.name || "—"}</span>
                                            <span className="flex items-center gap-1"><Clock size={9} />{formatDate(realDoc.createdAt)}</span>
                                            <span className="flex items-center gap-1"><FileText size={9} />{formatFileSize(realDoc.fileSize)}</span>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}

            {/* ═══════════════════════════════════════ */}
            {/* PDF VIEWER MODAL                        */}
            {/* ═══════════════════════════════════════ */}
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
                                    <div className={`w-8 h-8 rounded-lg ${viewingDoc.template.bgColor} border ${viewingDoc.template.borderColor} flex items-center justify-center ${viewingDoc.template.color}`}>
                                        {viewingDoc.template.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-white truncate">{viewingDoc.real.title}</h3>
                                        <p className="text-[10px] text-slate-500">{formatDate(viewingDoc.real.createdAt)} · {formatFileSize(viewingDoc.real.fileSize)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleDownload(viewingDoc.real.id)} className="p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Download">
                                        <Download size={16} />
                                    </button>
                                    <button onClick={() => setViewingDoc(null)} className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Fechar">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Document content — PDF embed or info */}
                            <div className="flex-1 bg-slate-950/50 overflow-y-auto custom-scrollbar">
                                {viewingDoc.real.mimeType === "application/pdf" ? (
                                    <iframe
                                        src={downloadDocumentUrl(viewingDoc.real.id)}
                                        className="w-full h-full border-0"
                                        title={viewingDoc.real.title}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                                        <div className={`w-20 h-20 rounded-2xl ${viewingDoc.template.bgColor} border ${viewingDoc.template.borderColor} flex items-center justify-center ${viewingDoc.template.color}`}>
                                            <FileText size={40} />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-bold text-white mb-2">{viewingDoc.real.title}</h3>
                                            <p className="text-sm text-slate-400 mb-1">{viewingDoc.real.fileName}</p>
                                            <p className="text-xs text-slate-500">{formatFileSize(viewingDoc.real.fileSize)} · {viewingDoc.real.mimeType}</p>
                                        </div>
                                        <button onClick={() => handleDownload(viewingDoc.real.id)}
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
