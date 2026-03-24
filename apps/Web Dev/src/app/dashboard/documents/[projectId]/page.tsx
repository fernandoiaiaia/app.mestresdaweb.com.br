"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft, Building2, FileText, ChevronRight,
    Info,
} from "lucide-react";
import { api } from "@/lib/api";

// ═══════════════════════════════════════════════════
// DOCUMENT CATEGORIES & TYPES
// ═══════════════════════════════════════════════════
import {
    ClipboardList, Handshake, FileCheck, LayoutGrid,
    Palette, Map, BarChart3, Route, FolderCheck, FilePlus2,
} from "lucide-react";

interface DocCard {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
}

interface DocCategory {
    title: string;
    docs: DocCard[];
}

const DOC_CATEGORIES: DocCategory[] = [
    {
        title: "Consultoria de Projetos e Administrativo",
        docs: [
            { id: "brd", name: "Business Requirements Document", description: "Levantamento detalhado de requisitos que reúne todos os usuários, telas, funcionalidades, regras de negócio e objetivos do sistema. Este documento descreve de forma estruturada tudo que será desenvolvido no projeto, servindo como base para alinhamento entre cliente, gestão e equipe técnica.", icon: <ClipboardList size={22} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
            { id: "contrato", name: "Contrato de Prestação de Serviço", description: "Documento que formaliza todos os itens contratados e as condições comerciais negociadas entre as partes. Ele consolida prazos, responsabilidades, escopo e modelo de execução do projeto, incluindo como anexo a versão final do Business Requirements Document.", icon: <Handshake size={22} />, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
        ],
    },
    {
        title: "Pré-Desenvolvimento",
        docs: [
            { id: "frd", name: "Functional Requirements Document", description: "Documento em que o time de desenvolvimento detalha tecnicamente o Business Requirements Document, especificando regras de funcionamento, comportamentos do sistema, fluxos e interações. Ele ajuda a eliminar dúvidas e garantir clareza total para execução do desenvolvimento.", icon: <FileCheck size={22} />, color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
            { id: "sad", name: "Software Architecture Document", description: "Documento que descreve a arquitetura técnica da aplicação, apresentando tecnologias, frameworks, integrações e padrões que serão utilizados no projeto. Ele define como o sistema será estruturado tecnicamente para garantir escalabilidade, segurança e desempenho.", icon: <LayoutGrid size={22} />, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20" },
            { id: "brand-guide", name: "Brand Guide", description: "Documento que define a identidade visual da marca do cliente dentro do projeto. Inclui logotipo, paleta de cores, tipografia, estilo visual e diretrizes de aplicação da marca, garantindo consistência visual em todas as telas e comunicações da aplicação.", icon: <Palette size={22} />, color: "text-pink-400", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20" },
            { id: "design-system", name: "Design System", description: "Documento que reúne os padrões visuais e componentes de interface que serão utilizados na aplicação. Inclui regras de layout, botões, tipografia, cores e elementos gráficos, além de protótipos iniciais de algumas telas para validação da experiência do usuário.", icon: <LayoutGrid size={22} />, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20" },
            { id: "story-map", name: "Story Map", description: "Documento que organiza todas as telas que serão desenvolvidas no sistema, estruturando a jornada do usuário dentro da aplicação. Cada tela é apresentada e explicada com seus elementos, ações e objetivos para orientar o time de desenvolvimento.", icon: <Map size={22} />, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
        ],
    },
    {
        title: "Desenvolvimento",
        docs: [
            { id: "sprint-review", name: "Sprint Review Report", description: "Documento gerado após cada reunião de apresentação de progresso do projeto. Ele registra funcionalidades desenvolvidas, feedbacks recebidos, ajustes solicitados e decisões tomadas durante as sprints, garantindo histórico e rastreabilidade da evolução do sistema.", icon: <BarChart3 size={22} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
            { id: "roadmap", name: "RoadMap", description: "Documento que organiza e prioriza ideias, melhorias e novas funcionalidades planejadas para versões futuras do sistema. Ele ajuda a estruturar a evolução do produto ao longo do tempo, mantendo visão estratégica e direcionamento claro para próximos ciclos.", icon: <Route size={22} />, color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20" },
        ],
    },
    {
        title: "Entrega do Projeto",
        docs: [
            { id: "closure", name: "Project Closure Document", description: "Documento que formaliza o encerramento do projeto após a entrega de todos os itens contratados. Ele confirma a aprovação dos entregáveis, o arquivamento da documentação e a liberação do sistema para implantação em produção e publicação nas lojas de aplicativos.", icon: <FolderCheck size={22} />, color: "text-teal-400", bgColor: "bg-teal-500/10", borderColor: "border-teal-500/20" },
            { id: "outros", name: "Outros", description: "Documentos complementares utilizados ao longo do projeto, como Aditivos Contratuais, Termos de Confidencialidade (NDA), autorizações, atas de reunião e quaisquer outros registros formais que não se enquadram nas categorias anteriores, mas que fazem parte do histórico e da governança do projeto.", icon: <FilePlus2 size={22} />, color: "text-slate-400", bgColor: "bg-slate-500/10", borderColor: "border-slate-500/20" },
        ],
    },
];

// ═══════════════════════════════════════════════════
// PROJECT DOCUMENTS PAGE
// ═══════════════════════════════════════════════════
export default function ProjectDocumentsPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;

    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [docCounts, setDocCounts] = useState<Record<string, number>>({});

    const fetchProject = useCallback(async () => {
        setLoading(true);
        const res = await api<any>(`/api/dev-projects/${projectId}`);
        if (res.success && res.data) setProject(res.data);
        setLoading(false);
    }, [projectId]);

    const fetchCounts = useCallback(async () => {
        const res = await api<Record<string, number>>(`/api/dev-documents/project/${projectId}/counts`);
        if (res.success && res.data) setDocCounts(res.data);
    }, [projectId]);

    useEffect(() => { fetchProject(); fetchCounts(); }, [fetchProject, fetchCounts]);

    if (loading) {
        return (
            <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-green-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="p-6 md:p-8 flex flex-col items-center justify-center py-32">
                <h3 className="text-lg font-bold text-white mb-2">Projeto não encontrado</h3>
                <button onClick={() => router.push("/dashboard/documents")} className="text-sm text-blue-400 hover:underline">Voltar</button>
            </div>
        );
    }

    const getDocCount = (docTypeId: string) => docCounts[docTypeId] || 0;

    // ── Main View: doc type cards by category ──
    return (
        <div className="p-6 md:p-8 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={() => router.push("/dashboard/documents")} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors mb-3">
                    <ArrowLeft size={16} /> Voltar para Documentos
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600/20 to-emerald-500/10 border border-blue-600/20 flex items-center justify-center">
                        <Building2 size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                        <p className="text-slate-400 text-sm">{project.client}</p>
                    </div>
                </div>
            </motion.div>

            {DOC_CATEGORIES.map((category, catIdx) => (
                <motion.div
                    key={category.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIdx * 0.08 }}
                    className="space-y-3"
                >
                    <h2 className="text-xs font-bold tracking-widest uppercase text-slate-500 flex items-center gap-2 px-1">
                        <div className="h-px flex-1 max-w-[20px] bg-slate-700/60" />
                        {category.title}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {category.docs.map((doc, docIdx) => {
                            const generatedCount = getDocCount(doc.id);
                            return (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: catIdx * 0.08 + docIdx * 0.04 }}
                                    onClick={() => router.push(`/dashboard/documents/${projectId}/${doc.id}`)}
                                    className="group p-4 rounded-xl bg-slate-800/40 border border-white/[0.06] hover:border-blue-500/20 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer hover:shadow-lg hover:shadow-blue-900/10"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`w-10 h-10 rounded-lg ${doc.bgColor} border ${doc.borderColor} flex items-center justify-center ${doc.color}`}>
                                            {doc.icon}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="relative group/info">
                                                <button onClick={e => e.stopPropagation()} className="p-1 rounded-md text-slate-600 hover:text-slate-300 hover:bg-slate-700/50 transition-colors">
                                                    <Info size={14} />
                                                </button>
                                                <div className="absolute right-0 bottom-full mb-2 w-72 p-3 bg-slate-900 border border-white/[0.06] rounded-xl shadow-2xl shadow-black/50 text-[11px] text-slate-300 leading-relaxed opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-30 pointer-events-none">
                                                    {doc.description}
                                                    <div className="absolute bottom-[-5px] right-3 w-2.5 h-2.5 bg-slate-900 border-r border-b border-white/[0.06] rotate-45" />
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-blue-400 transition-colors leading-snug">
                                        {doc.name}
                                    </h3>
                                    {generatedCount > 0 && (
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-2">
                                            <FileText size={10} /> {generatedCount} documento{generatedCount > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
