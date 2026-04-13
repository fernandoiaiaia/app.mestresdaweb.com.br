"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    FileText,
    Upload,
    Trash2,
    Eye,
    X,
    Plus,
    Clock,
    FileUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useConfirm } from "@/providers/confirm-provider";

interface ScopeFile {
    id: string;
    name: string;
    content: string;
    createdAt: string;
    sizeBytes: number;
}

export default function KnowledgeBasePage() {
    const router = useRouter();
    const confirm = useConfirm();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<ScopeFile[]>([]);
    const [previewFile, setPreviewFile] = useState<ScopeFile | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api<ScopeFile[]>("/api/knowledge-base");
            if (res.success && res.data) {
                setFiles(res.data);
            } else {
                toast.error("Erro ao carregar arquivos da base de conhecimento.");
            }
        } catch {
            toast.error("Erro de conexão ao carregar arquivos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const handleFilesSelected = useCallback(async (selectedFiles: FileList | null) => {
        if (!selectedFiles) return;

        let okCount = 0;
        let errCount = 0;

        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            if (!file.name.endsWith(".md")) continue;

            try {
                const text = await file.text();
                const res = await api("/api/knowledge-base", {
                    method: "POST",
                    body: {
                        name: file.name,
                        content: text,
                        sizeBytes: file.size,
                    }
                });
                if (res.success) {
                    okCount++;
                } else {
                    errCount++;
                }
            } catch {
                errCount++;
            }
        }

        if (okCount > 0) {
            toast.success(`${okCount} arquivo(s) salvo(s) na Base de Conhecimento.`);
            loadFiles();
        }
        if (errCount > 0) {
            toast.error(`Falha ao salvar ${errCount} arquivo(s).`);
        }
    }, [loadFiles]);

    const handleDelete = async (id: string) => {
        const isOk = await confirm({
            title: "Excluir Arquivo",
            message: "Tem certeza que deseja remover este escopo da base?",
            confirmText: "Sim, remover",
        });

        if (!isOk) return;

        const res = await api(`/api/knowledge-base/${id}`, { method: "DELETE" });
        if (res.success) {
            toast.success("Arquivo removido.");
            if (previewFile?.id === id) setPreviewFile(null);
            loadFiles();
        } else {
            toast.error("Erro ao remover arquivo.");
        }
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            handleFilesSelected(e.dataTransfer.files);
        },
        [handleFilesSelected]
    );

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mb-8"
            >
                <button
                    onClick={() => router.push("/dashboard/settings")}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar para Configurações
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <FileText size={20} className="text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Base de Dados</h1>
                        <p className="text-sm text-slate-400">
                            Upload de escopos de projetos exemplo em Markdown (.md) para referência da IA
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Upload Area */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer mb-8 ${
                    dragOver
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-slate-600/40 bg-slate-800/30 hover:border-slate-500/50 hover:bg-slate-800/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-slate-700/50 border border-slate-600/30 flex items-center justify-center">
                        <FileUp size={24} className="text-slate-400" />
                    </div>
                    <div>
                        <p className="text-white font-medium text-[15px]">
                            Arraste arquivos .md aqui ou clique para selecionar
                        </p>
                        <p className="text-slate-500 text-[13px] mt-1">
                            Aceita múltiplos arquivos Markdown simultaneamente
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                        className="mt-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Selecionar Arquivos
                    </button>
                </div>
            </motion.div>

            {/* File Counter */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-slate-400 text-sm">
                    <span className="text-white font-semibold">{files.length}</span>{" "}
                    {files.length === 1 ? "arquivo carregado" : "arquivos carregados"}
                </p>
            </div>

            {/* File List */}
            <div className="space-y-3">
                <AnimatePresence>
                    {files.map((file, index) => (
                        <motion.div
                            key={file.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2, delay: index * 0.03 }}
                            className="group bg-slate-800/40 border border-white/[0.06] rounded-xl p-4 hover:bg-slate-800/60 hover:border-white/10 transition-all duration-200"
                        >
                            <div className="flex items-center gap-4">
                                {/* Icon */}
                                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                    <FileText size={18} className="text-violet-400" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-white truncate">
                                        {file.name}
                                    </h3>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(file.createdAt).toLocaleDateString("pt-BR", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <span className="text-[11px] text-slate-500">
                                            {Math.round(file.sizeBytes / 1024)} KB
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setPreviewFile(file)}
                                        className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-violet-400 transition-all"
                                        title="Visualizar"
                                    >
                                        <Eye size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(file.id)}
                                        className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
                                        title="Remover"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {files.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mx-auto mb-4">
                            <Upload size={24} className="text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-sm">
                            Nenhum escopo carregado ainda.
                        </p>
                        <p className="text-slate-600 text-xs mt-1">
                            Faça upload de arquivos .md com escopos de projetos exemplo.
                        </p>
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                        onClick={() => setPreviewFile(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-white/[0.08] rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-violet-400" />
                                    <h2 className="text-white font-semibold text-[15px]">
                                        {previewFile.name}
                                    </h2>
                                    <span className="text-slate-500 text-xs">
                                        {Math.round(previewFile.sizeBytes / 1024)} KB
                                    </span>
                                </div>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-6">
                                <pre className="text-slate-300 text-[13px] leading-relaxed font-mono whitespace-pre-wrap break-words">
                                    {previewFile.content}
                                </pre>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
