"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, ChevronRight, ChevronLeft, Layers, MonitorSmartphone, Rocket,
    ShieldCheck, Sparkles, Fingerprint, MessageCircle, Download, CalendarClock,
    Monitor, Smartphone, Globe, Cpu, Terminal, Loader2, Send, Paperclip,
    X, FileText, Image as ImageIcon, Film, Music, Square, Users, ArrowLeft,
} from "lucide-react";

import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { parseScope } from "@/lib/proposal-shared";
type Proposal = any;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7777";
const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const getPlatformIcon = (iconName: string, className: string = "") => {
    switch (iconName) {
        case 'monitor': return <Monitor size={16} className={className} />;
        case 'smartphone': return <Smartphone size={16} className={className} />;
        case 'globe': return <Globe size={16} className={className} />;
        case 'cpu': return <Cpu size={16} className={className} />;
        case 'terminal': return <Terminal size={16} className={className} />;
        default: return <Layers size={16} className={className} />;
    }
};

// ═══ Types ═══
interface PresentationScreen { id: string; title: string; description: string; features: string[]; technical: boolean; complexity: string; estimatedHours: number; }
interface PresentationModule { id: string; title: string; screens: PresentationScreen[]; }
interface PresentationPlatform { id: string; title: string; icon: string; count: number; modules: PresentationModule[]; }
interface TeamMember { role: string; hours: number; }
interface ProposalData {
    client: string; project: string; date: string; validity: string; summary: string;
    platforms: PresentationPlatform[]; timeline: string; totalHours: number;
    team: TeamMember[]; investment: { total: number; model: string; payment: string; };
}

function inferPlatformIcon(title: string): string {
    const t = title.toLowerCase();
    if (t.includes("mobile") || t.includes("app") || t.includes("ios") || t.includes("android")) return "smartphone";
    if (t.includes("web") || t.includes("backoffice") || t.includes("painel") || t.includes("dashboard")) return "monitor";
    if (t.includes("api") || t.includes("backend") || t.includes("rest")) return "terminal";
    if (t.includes("iot") || t.includes("edge")) return "cpu";
    if (t.includes("site") || t.includes("landing") || t.includes("portal") || t.includes("ecommerce")) return "globe";
    return "monitor";
}

function buildPresentationData(proposal: Proposal): ProposalData {
    const scopeRaw = proposal.scopeRaw || "";
    // Parse the Scope AST directly from our Core Shared Tools
    const parsedAST = parseScope(scopeRaw);

    // Map `Plataforma > User > Module > Screens > Functionalities` to Mock-1's `PresentationPlatform > Modules > Screens`
    // Splitting each User into its own Tab
    const platforms: PresentationPlatform[] = parsedAST.flatMap((platform, pIdx) => {
        return platform.users.map((user, uIdx) => {
            const platformModules: PresentationModule[] = [];
            let screenCount = 0;

            user.modules.forEach((mod, mIdx) => {
                const moduleName = mod.name;
                
                const screens: PresentationScreen[] = mod.screens.map((scr, sIdx) => {
                    const features = scr.functionalities.map(f => f.name);
                    const hours = scr.functionalities.reduce((sum, f) => sum + (f.hours || 0), 0);
                    
                    return {
                        id: `scr-${pIdx}-${uIdx}-${mIdx}-${sIdx}`,
                        title: scr.name,
                        description: "", // Fallback
                        features,
                        technical: false,
                        complexity: hours > 24 ? "very_high" : hours > 16 ? "high" : hours > 8 ? "medium" : "low",
                        estimatedHours: hours,
                    };
                });

                if (screens.length > 0) {
                    screenCount += screens.length;
                    platformModules.push({
                        id: `mod-${pIdx}-${uIdx}-${mIdx}`,
                        title: moduleName,
                        screens
                    });
                }
            });

            const tabTitle = user.name.toLowerCase() === "geral"
                ? platform.name
                : `${platform.name} - ${user.name}`;

            return {
                id: `plat-${pIdx}-${uIdx}`,
                title: tabTitle,
                icon: inferPlatformIcon(platform.name),
                count: screenCount,
                modules: platformModules
            };
        });
    }).filter(p => p.count > 0);

    const totalValue = proposal.estimate?.totalCost || 0;
    const totalHours = proposal.estimate?.totalHours || 0;
    const lines = proposal.estimate?.lines || [];

    const modelLabel = "Escopo e Preço Fechados";
    const paymentLabel = "A combinar junto com a Equipe Comercial";
    
    let timeline = "A definir";
    if (totalHours > 0) {
        const months = Math.ceil(totalHours / 160);
        timeline = `Aproximadamente ${months} meses`;
    }

    const createdAt = proposal.createdAt ? new Date(proposal.createdAt) : new Date();
    const validUntilDate = proposal.expiresAt ? new Date(proposal.expiresAt) : new Date(createdAt.getTime() + 15 * 24 * 60 * 60 * 1000);
    const diffDays = Math.ceil((validUntilDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    // Map the new Step 5 Matrix Arrays directly
    const team: TeamMember[] = (lines as any[])
        .filter((l: any) => l.hours > 0)
        .sort((a: any, b: any) => b.hours - a.hours)
        .map((l: any) => ({
            role: l.role,
            hours: l.hours
        }));

    return {
        client: proposal.client?.name || "Cliente",
        project: proposal.title || "Projeto de Desenvolvimento",
        date: createdAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
        validity: `${diffDays > 0 ? diffDays : 0} dias`,
        summary: "Desenvolvimento de software sob medida com tecnologias modernas e metodologia ágil estruturada.",
        platforms, 
        timeline, 
        totalHours, 
        team,
        investment: { total: totalValue, model: modelLabel, payment: paymentLabel },
    };
}

// ═══ Comment types ═══
interface Comment { id: string; screenId: string; author: string; content: string; createdAt: string; fileUrl?: string; fileName?: string; fileType?: string; fileSize?: number; }

export default function PublicProposalPresentationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: proposalId } = use(params);
    const router = useRouter();
    const { user } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [proposalData, setProposalData] = useState<ProposalData | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'scope' | 'team' | 'investment'>('overview');
    const [activePlatformId, setActivePlatformId] = useState("");
    const [activeScreenIndex, setActiveScreenIndex] = useState(0);

    // Tab Scroll State
    const tabsRef = useRef<HTMLDivElement>(null);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (tabsRef.current) {
            const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current;
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
        }
    };

    useEffect(() => {
        if (activeTab === 'scope') {
            let frames = 0;
            let animationFrameId: number;

            const checkLoop = () => {
                checkScroll();
                frames++;
                if (frames < 30) {
                    animationFrameId = requestAnimationFrame(checkLoop);
                }
            };
            
            checkLoop();

            window.addEventListener('resize', checkScroll);
            return () => {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [proposalData?.platforms, activeTab]);

    // Comments
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentText, setCommentText] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [showComments, setShowComments] = useState(true);
    const [commentFile, setCommentFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Audio
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(m => MediaRecorder.isTypeSupported(m)) || '';
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            recorder.start();
            setIsRecording(true);
        } catch { alert('Não foi possível acessar o microfone.'); }
    };

    const stopRecording = async () => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') { setIsRecording(false); return; }
        const blob: Blob = await new Promise((resolve) => { recorder.addEventListener('dataavailable', (e: BlobEvent) => resolve(e.data), { once: true }); recorder.stop(); });
        setIsRecording(false);
        if (blob && blob.size > 0) {
            const rawMime = recorder.mimeType || 'audio/webm';
            const mime = rawMime.split(';')[0].trim();
            const ext = mime.includes('mp4') ? 'mp4' : 'webm';
            setCommentFile(new File([blob], `audio_${Date.now()}.${ext}`, { type: mime }));
        }
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        mediaRecorderRef.current = null;
    };

    // Fetch proposal
    useEffect(() => {
        if (!proposalId) return;
        setLoading(true);
        api<Proposal>(`/api/proposals/client/${proposalId}`)
            .then(res => {
                if (res.success && res.data) {
                    const data = buildPresentationData(res.data);
                    setProposalData(data);
                    if (data.platforms.length > 0) setActivePlatformId(data.platforms[0].id);
                } else setError(res.error?.message || "Proposta não encontrada.");
            })
            .catch(() => setError("Erro ao carregar proposta."))
            .finally(() => setLoading(false));
    }, [proposalId]);

    // Load comments
    useEffect(() => {
        if (!proposalId) return;
        fetch(`${API_BASE}/api/proposals/presentation/${proposalId}/comments`)
            .then(r => r.json()).then(res => { if (res.success && res.data) setComments(res.data); }).catch(() => {});
    }, [proposalId]);

    const submitComment = async (screenId: string) => {
        const authorName = user?.name || "Cliente";
        if (!commentText.trim() && !commentFile) return;
        setSubmittingComment(true);
        try {
            const formData = new FormData();
            formData.append('screenId', screenId);
            formData.append('author', authorName);
            formData.append('content', commentText.trim());
            if (commentFile) formData.append('file', commentFile);
            const res = await fetch(`${API_BASE}/api/proposals/presentation/${proposalId}/comments`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success && data.data) { setComments(prev => [data.data, ...prev]); setCommentText(''); setCommentFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
        } catch {} finally { setSubmittingComment(false); }
    };

    const formatDateTime = (dateStr: string) => { const d = new Date(dateStr); return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const getFileIcon = (type?: string) => { if (!type) return <FileText size={16} />; if (type.startsWith('image/')) return <ImageIcon size={16} />; if (type.startsWith('video/')) return <Film size={16} />; if (type.startsWith('audio/')) return <Music size={16} />; return <FileText size={16} />; };
    const formatFileSize = (bytes?: number) => { if (!bytes) return ''; if (bytes < 1024) return `${bytes}B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`; return `${(bytes / (1024 * 1024)).toFixed(1)}MB`; };

    const activePlatform = proposalData?.platforms.find(p => p.id === activePlatformId) || proposalData?.platforms[0];
    const FlatScreens = activePlatform?.modules.flatMap(m => m.screens.map(s => ({ ...s, moduleTitle: m.title }))) || [];
    const activeScreenContext = FlatScreens[activeScreenIndex] || FlatScreens[0];
    const screenComments = activeScreenContext ? comments.filter(c => c.screenId === activeScreenContext.id) : [];
    const prevScreen = () => setActiveScreenIndex(prev => (prev === 0 ? FlatScreens.length - 1 : prev - 1));
    const nextScreen = () => setActiveScreenIndex(prev => (prev === FlatScreens.length - 1 ? 0 : prev + 1));
    useEffect(() => { setActiveScreenIndex(0); }, [activePlatformId]);

    const renderVisualMockup = (platformIcon: string, screenTitle: string) => {
        if (platformIcon === 'smartphone') {
            return (
                <div className="w-[220px] sm:w-[260px] h-[400px] sm:h-[500px] bg-slate-900 border-[6px] border-slate-800 rounded-[2rem] shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20"><div className="w-32 h-6 bg-slate-800 rounded-b-3xl" /></div>
                    <div className="w-full h-full bg-[#050505] flex flex-col pt-12 pb-6 px-5 relative">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,0.15),transparent_70%)] pointer-events-none" />
                        <div className="flex justify-between items-center mb-6 z-10 relative">
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700" />
                            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center"><Layers size={16} /></div>
                        </div>
                        <div className="h-16 flex items-center justify-center text-center bg-gradient-to-r from-blue-500/10 to-transparent rounded-2xl mb-6 border border-blue-500/20 z-10 relative px-2">
                            <h4 className="text-white font-bold text-sm truncate">{screenTitle}</h4>
                        </div>
                        <div className="flex-1 flex flex-col gap-4 z-10 relative">
                            <div className="h-5 bg-slate-800 rounded w-1/3 mb-1" />
                            {[1, 2, 3].map(i => (<div key={i} className="flex gap-4 items-center p-3 rounded-xl bg-slate-800/40 border border-slate-700/50"><div className="w-10 h-10 bg-slate-700/80 rounded-lg shrink-0" /><div className="flex-1 flex flex-col gap-2"><div className="h-2.5 bg-slate-600 rounded w-3/4" /><div className="h-2 bg-slate-700 rounded w-1/2" /></div></div>))}
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="w-full max-w-2xl h-[260px] sm:h-[360px] bg-slate-900/80 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex flex-col group relative shrink-0">
                <div className="bg-slate-800/90 px-4 py-2 flex items-center gap-2 border-b border-slate-700/50">
                    <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-blue-500/80" /></div>
                    <div className="ml-4 flex-1 bg-slate-900/60 rounded text-center text-xs text-slate-400 py-1 font-mono">plataforma.cezani.dev</div>
                </div>
                <div className="flex-1 bg-[#0a0a0a] p-6 flex flex-col gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="flex justify-between items-center mb-2 z-10 relative">
                        <h4 className="text-xl font-bold text-white max-w-[50%] truncate">{screenTitle}</h4>
                        <div className="flex gap-2"><div className="h-8 w-24 bg-slate-800 rounded-lg" /><div className="h-8 w-10 bg-blue-500/40 rounded-lg" /></div>
                    </div>
                    <div className="flex gap-6 h-24 z-10 relative">{[1, 2, 3, 4].map(i => <div key={i} className="flex-1 bg-slate-800/40 border border-slate-700/40 rounded-xl" />)}</div>
                    <div className="flex-1 flex gap-6 z-10 relative"><div className="flex-[2] bg-slate-800/40 border border-slate-700/40 rounded-xl" /><div className="flex-[1] bg-slate-800/40 border border-slate-700/40 rounded-xl" /></div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-6 md:p-8 flex items-center justify-center min-h-[400px]"><Loader2 size={32} className="text-blue-400 animate-spin" /></div>;
    if (error || !proposalData) return (
        <div className="p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center"><ShieldCheck size={32} className="text-red-500" /></div>
            <h2 className="text-xl font-bold text-white">Proposta não encontrada</h2>
            <p className="text-slate-400">{error || "A proposta solicitada não existe ou foi removida."}</p>
            <button onClick={() => router.push('/dashboard/crm/proposals')} className="mt-4 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors">Voltar</button>
        </div>
    );

    const hasPlatforms = proposalData.platforms.length > 0 && proposalData.platforms.some(p => p.modules.length > 0);

    return (
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-7xl mx-auto bg-slate-950 min-h-screen text-slate-50">
            {/* Back + Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                {user && (
                    <button onClick={() => router.push('/dashboard/crm/proposals')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4 border border-white/5 py-1 px-3 bg-white/5 rounded-full w-fit">
                        <ArrowLeft size={14} /> Voltar para o CRM
                    </button>
                )}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.06]">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-[1px]">
                                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center"><Sparkles size={20} className="text-blue-500" /></div>
                            </div>
                            <h2 className="text-xs font-bold text-blue-500 uppercase tracking-widest">Apresentação Estratégica</h2>
                        </div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">{proposalData.project}</h1>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-slate-400 mb-1 text-sm">Preparado para:</p>
                        <p className="text-lg font-medium text-white mb-2">{proposalData.client}</p>
                        <div className="flex flex-col md:items-end gap-1 text-xs text-slate-500">
                            <span className="flex items-center gap-2 md:justify-end border border-white/10 px-3 py-1 bg-white/5 rounded-md"><CalendarClock size={14} /> Data: {proposalData.date}</span>
                            <span className="px-3 py-1">Validade: {proposalData.validity}</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex overflow-x-auto p-1 bg-white/5 rounded-2xl border border-white/10 w-full sm:w-fit custom-scrollbar">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: <Rocket size={16} /> },
                    ...(hasPlatforms ? [{ id: 'scope', label: 'Escopo', icon: <Layers size={16} /> }] : []),
                    ...(proposalData.team.length > 0 ? [{ id: 'team', label: 'Equipe', icon: <Users size={16} /> }] : []),
                    { id: 'investment', label: 'Investimento', icon: <ShieldCheck size={16} /> },
                ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium text-xs sm:text-sm transition-all relative whitespace-nowrap flex-1 sm:flex-none justify-center ${activeTab === tab.id ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                        {activeTab === tab.id && <motion.div layoutId="active-tab-client" className="absolute inset-0 bg-slate-800 border border-slate-700 rounded-xl -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                        <span className={activeTab === tab.id ? 'text-blue-500' : ''}>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {/* ═══ TAB: OVERVIEW ═══ */}
                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                            <div className="bg-slate-800/40 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><MonitorSmartphone size={28} className="text-blue-500" /> O Desafio</h3>
                                <p className="text-lg text-slate-300 leading-relaxed relative z-10">{proposalData.summary}</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-8 hover:bg-slate-800/60 transition-colors">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6"><Sparkles size={24} className="text-blue-500" /></div>
                                    <h4 className="text-xl font-bold text-white mb-3">Tecnologia de Ponta</h4>
                                    <p className="text-slate-400">Arquiteturas modernas e escaláveis construídas para alta performance e segurança.</p>
                                </div>
                                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-8 hover:bg-slate-800/60 transition-colors">
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6"><Fingerprint size={24} className="text-blue-500" /></div>
                                    <h4 className="text-xl font-bold text-white mb-3">Design Exclusivo</h4>
                                    <p className="text-slate-400">Identidade visual única focada na melhor experiência de usuário (UI/UX).</p>
                                </div>
                                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-8 hover:bg-slate-800/60 transition-colors">
                                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6"><Rocket size={24} className="text-purple-500" /></div>
                                    <h4 className="text-xl font-bold text-white mb-3">Entrega Ágil</h4>
                                    <p className="text-slate-400">Construção iterativa com transparência total nas validações e entregas.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ TAB: SCOPE ═══ */}
                    {activeTab === 'scope' && hasPlatforms && (
                        <motion.div key="scope" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                            <div><h3 className="text-xl font-bold text-white mb-2">Estrutura Detalhada por Plataforma</h3><p className="text-sm text-slate-400">Navegue pelas funcionalidades do seu projeto.</p></div>
                            {/* Platform tabs */}
                            <div className="relative group w-full">
                                <div 
                                    ref={tabsRef}
                                    onScroll={checkScroll}
                                    className="flex gap-3 overflow-x-auto pb-2 border-b border-white/10 custom-scrollbar"
                                >
                                    {proposalData.platforms.map((platform) => (
                                        <button key={platform.id} onClick={() => setActivePlatformId(platform.id)}
                                            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap border-x border-t ${activePlatformId === platform.id ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'}`}>
                                            <div className={activePlatformId === platform.id ? 'text-blue-500' : 'text-slate-600'}>{getPlatformIcon(platform.icon)}</div>
                                            {platform.title}
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activePlatformId === platform.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                                {platform.count} Telas
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <AnimatePresence>
                                    {canScrollRight && (
                                        <motion.div 
                                            initial={{ opacity: 0 }} 
                                            animate={{ opacity: 1 }} 
                                            exit={{ opacity: 0 }}
                                            className="absolute right-0 top-0 bottom-2 w-24 bg-gradient-to-l from-[#0A0F1C] via-[#0A0F1C]/80 to-transparent pointer-events-none flex items-center justify-end pr-2"
                                        >
                                            <motion.div
                                                animate={{ x: [0, 5, 0] }}
                                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                                className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] backdrop-blur-md"
                                            >
                                                <ChevronRight size={20} className="text-blue-400 drop-shadow-lg" />
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {FlatScreens.length > 0 && activeScreenContext && (
                                <div className="flex flex-col xl:flex-row gap-6 xl:gap-10 items-center xl:items-start">
                                    <div className="w-full xl:w-[400px] shrink-0 flex flex-col items-center max-w-[320px] xl:max-w-none mx-auto xl:mx-0">
                                        {activePlatform && renderVisualMockup(activePlatform.icon, activeScreenContext.title)}
                                        <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs">
                                            <span>Módulo:</span>
                                            <span className="font-bold text-white border border-white/10 px-3 py-1 bg-white/5 rounded-full truncate max-w-[200px]">{activeScreenContext.moduleTitle}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 w-full bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 xl:p-10 relative overflow-hidden flex flex-col justify-center min-h-[300px]">
                                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${activeScreenContext.technical ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                                {activeScreenContext.technical ? 'Infraestrutura Técnica' : 'Interface de Usuário'}
                                            </span>
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${activeScreenContext.complexity === 'very_high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : activeScreenContext.complexity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : activeScreenContext.complexity === 'medium' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                                {activeScreenContext.complexity === 'very_high' ? 'Muito Alta' : activeScreenContext.complexity === 'high' ? 'Alta' : activeScreenContext.complexity === 'medium' ? 'Média' : 'Baixa'} Complexidade
                                            </span>
                                            {activeScreenContext.estimatedHours > 0 && (
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-700">~{activeScreenContext.estimatedHours}h</span>
                                            )}
                                            <span className="text-slate-500 font-mono text-sm ml-auto">Tela {activeScreenIndex + 1} de {FlatScreens.length}</span>
                                        </div>
                                        <h3 className="text-2xl lg:text-3xl font-extrabold text-white mb-3">{activeScreenContext.title}</h3>
                                        <ul className="space-y-3">
                                            {activeScreenContext.features?.map((feat: string, idx: number) => (
                                                <li key={idx} className="flex items-start gap-3 text-base text-slate-300"><CheckCircle2 size={20} className="text-blue-500 shrink-0 mt-0.5" /><span className="leading-relaxed">{feat}</span></li>
                                            ))}
                                        </ul>
                                        <div className="mt-auto border-t border-white/10 pt-4 flex items-center justify-between gap-2 mt-8">
                                            <button onClick={prevScreen} className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white hover:bg-slate-700 transition-colors text-sm w-full md:w-auto justify-center"><ChevronLeft size={16} /> Anterior</button>
                                            <span className="hidden md:inline text-slate-500 font-mono text-xs">{activeScreenIndex + 1}/{FlatScreens.length}</span>
                                            <button onClick={nextScreen} className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 transition-colors text-sm w-full md:w-auto justify-center">Próxima <ChevronRight size={16} /></button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            {FlatScreens.length > 0 && activeScreenContext && (
                                <div className="bg-slate-800/30 border border-white/[0.06] rounded-2xl p-4 sm:p-6 mb-10">
                                    <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors mb-4 w-full">
                                        <MessageCircle size={18} className="text-blue-500" /> Comentários e Dúvidas ({screenComments.length})
                                        <ChevronRight size={14} className={`transition-transform ml-auto ${showComments ? 'rotate-90' : ''}`} />
                                    </button>
                                    {showComments && (
                                        <div className="space-y-0">
                                            {screenComments.length > 0 && (
                                                <div className="space-y-0 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 mb-4">
                                                    {screenComments.map((c, ci) => {
                                                        const colors = ['bg-blue-600', 'bg-blue-700', 'bg-purple-600', 'bg-pink-600', 'bg-cyan-600'];
                                                        const avatarColor = colors[c.author.charCodeAt(0) % colors.length];
                                                        return (
                                                            <div key={c.id} className={`flex gap-3 py-4 ${ci > 0 ? 'border-t border-white/5' : ''}`}>
                                                                <div className={`shrink-0 w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>{getInitials(c.author)}</div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1"><span className="text-sm font-bold text-white">{c.author}</span><span className="text-[11px] text-slate-500">• {formatDateTime(c.createdAt)}</span></div>
                                                                    <p className="text-[13px] text-slate-300 leading-relaxed">{c.content}</p>
                                                                    {c.fileUrl && c.fileType && (
                                                                        <div className="mt-2 text-blue-400 underline text-xs">
                                                                            <a href={`${API_BASE}${c.fileUrl}`} target="_blank" rel="noopener noreferrer">Ver anexo inserido</a>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {screenComments.length === 0 && <p className="text-xs text-slate-600 mb-4 italic">Nenhum comentário nesta seção. Seja o primeiro!</p>}
                                            {/* Compose */}
                                            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-3 sm:p-4">
                                                <textarea value={commentText} onChange={e => setCommentText(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && activeScreenContext) { e.preventDefault(); submitComment(activeScreenContext.id); } }}
                                                    placeholder="Escreva um comentário..." rows={2} className="w-full bg-transparent text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none resize-none mb-2" />
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-xs text-slate-500 italic hidden sm:inline">Pressione ENTER para enviar</span>
                                                    </div>
                                                    <button onClick={() => activeScreenContext && submitComment(activeScreenContext.id)} disabled={submittingComment || (!commentText.trim() && !commentFile)}
                                                        className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20">
                                                        {submittingComment ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ TAB: TEAM ═══ */}
                    {activeTab === 'team' && proposalData.team.length > 0 && (
                        <motion.div key="team" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                            <div><h3 className="text-xl font-bold text-white mb-2">Equipe Alocada no Projeto</h3><p className="text-sm text-slate-400">Conheça a dedicação estimada de cada profissional escalado.</p></div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {proposalData.team.map((member, idx) => {
                                    const colors = [
                                        { bg: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20', text: 'text-blue-400', bar: 'bg-blue-500' },
                                        { bg: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20', text: 'text-blue-400', bar: 'bg-blue-500' },
                                        { bg: 'from-blue-500/20 to-blue-700/5', border: 'border-blue-500/20', text: 'text-blue-400', bar: 'bg-blue-500' },
                                        { bg: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20', text: 'text-purple-400', bar: 'bg-purple-500' },
                                        { bg: 'from-pink-500/20 to-pink-600/5', border: 'border-pink-500/20', text: 'text-pink-400', bar: 'bg-pink-500' },
                                        { bg: 'from-cyan-500/20 to-cyan-600/5', border: 'border-cyan-500/20', text: 'text-cyan-400', bar: 'bg-cyan-500' },
                                    ];
                                    const c = colors[idx % colors.length];
                                    const maxHours = Math.max(...proposalData.team.map(t => t.hours));
                                    const pct = maxHours > 0 ? (member.hours / maxHours) * 100 : 0;
                                    return (
                                        <div key={`team-${idx}`} className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-6 relative overflow-hidden`}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`w-11 h-11 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-center ${c.text}`}><Users size={20} /></div>
                                                <span className={`text-2xl font-extrabold ${c.text}`}>{member.hours}h</span>
                                            </div>
                                            <h4 className="text-white font-bold text-base mb-3">{member.role}</h4>
                                            <div className="w-full bg-slate-900/40 rounded-full h-2"><div className={`${c.bar} h-2 rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} /></div>
                                            <p className="text-[11px] text-slate-500 mt-2">{Math.round((member.hours / (proposalData.totalHours || 1)) * 100)}% do total de horas estipuladas</p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><Users size={20} className="text-blue-500" /></div>
                                    <div><p className="text-white font-bold text-lg">{proposalData.team.length} Profissionais Mapeados</p><p className="text-slate-400 text-sm">Escalados via Inteligência Artificial Estrutural</p></div>
                                </div>
                                <div className="text-right"><p className="text-3xl font-extrabold text-white">{proposalData.totalHours}h</p><p className="text-slate-400 text-sm">Totalizando</p></div>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ TAB: INVESTMENT ═══ */}
                    {activeTab === 'investment' && (
                        <motion.div key="investment" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex flex-col md:flex-row gap-8">
                            <div className="flex-[3] bg-slate-800/40 border border-blue-500/20 rounded-2xl p-8 md:p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.1),transparent_50%)]" />
                                <div className="relative z-10">
                                    <div className="inline-block px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-500 font-bold tracking-widest text-xs uppercase mb-8 border border-blue-500/20">{proposalData.investment.model}</div>
                                    <p className="text-slate-400 mb-2">Investimento Total Previsto</p>
                                    <div className="flex items-baseline gap-2 mb-8">
                                        <span className="text-2xl text-slate-300 font-medium">R$</span>
                                        <span className="text-3xl sm:text-5xl font-extrabold text-white tracking-tighter">{proposalData.investment.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="space-y-4 border-t border-white/10 pt-8">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3"><CalendarClock size={20} className="text-blue-400" /><span className="text-slate-300 font-medium">Cronograma Estimado Previsto</span></div>
                                            <span className="text-white font-bold">{proposalData.timeline}</span>
                                        </div>
                                        {proposalData.totalHours > 0 && (
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-3"><Cpu size={20} className="text-purple-400" /><span className="text-slate-300 font-medium">Total de Horas Calculadas Ad-Hoc</span></div>
                                                <span className="text-white font-bold">{proposalData.totalHours}h ({proposalData.platforms.length} plataformas • {proposalData.platforms.reduce((a, p) => a + p.count, 0)} telas)</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3"><ShieldCheck size={20} className="text-blue-400" /><span className="text-slate-300 font-medium">Condições Comerciais Flexíveis</span></div>
                                            <span className="text-blue-400 font-bold">{proposalData.investment.payment}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-[2] flex flex-col gap-4">
                                <h3 className="text-xl font-bold text-white mb-2">Próximos Passos</h3>
                                <p className="text-sm text-slate-400 mb-6">Para darmos início ao projeto e começarmos a alocação da equipe técnica de engenharia listada, converse conosco.</p>
                                <div className="flex gap-4">
                                    <button onClick={() => window.print()} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-800/40 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer flex-1">
                                        <Download size={20} /><span className="text-xs font-medium">Salvar em PDF</span>
                                    </button>
                                    <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-800/40 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors flex-1">
                                        <MessageCircle size={20} /><span className="text-xs font-medium">Falar com Consultor</span>
                                    </button>
                                </div>
                                <div className="mt-auto pt-8 flex items-center gap-4 text-xs text-slate-500">
                                    <ShieldCheck size={16} /><p>Esta proposta está encriptada sob sigilo na Nuvem. Validade Comercial: {proposalData.validity}.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
