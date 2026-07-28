"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
    ChevronLeft, UploadCloud, FileText, BrainCircuit, 
    ShieldAlert, FileWarning, CheckCircle2, FileDown
} from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";

export default function ExternalAnalysisPage() {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [textContext, setTextContext] = useState("");
    const [role, setRole] = useState<'contratada' | 'contratante'>('contratada');
    
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any[] | null>(null);
    const [compareModel, setCompareModel] = useState("none");

    const handleAnalyze = async () => {
        if (!file && !textContext) {
            toast.error("Atenção", "Faça upload de um contrato ou cole o texto para análise.");
            return;
        }

        setIsAnalyzing(true);
        try {
            // Se houvesse file sendo parseado, a extração de texto viria aqui
            const textToAnalyze = textContext || "Arquivo enviado, mas a extração de texto local não está ativada. Cole o texto acima.";

            const res = await api<any>('/api/contracts/analysis/analyze-risks', {
                method: 'POST',
                body: { textContext: textToAnalyze, role, compareModel }
            });
            
            if (res.success && res.data) {
                setAnalysisResult(res.data);
                toast.success("Análise Concluída", "O relatório de riscos foi gerado.");
            } else {
                toast.error("Erro", res.error?.message || "Falha ao gerar o relatório.");
            }
        } catch (e) {
            toast.error("Erro", "Erro de comunicação com a IA.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleExportPDF = () => {
        if (!analysisResult) return;
        
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
            toast.error("Erro", "O bloqueador de pop-ups impediu a exportação.");
            return;
        }
        
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Análise de Risco de Contrato</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
                        .header { display: flex; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px; gap: 20px; }
                        .logo { height: 80px; width: auto; filter: brightness(0); }
                        h1 { color: #0f172a; margin: 0; font-size: 24px; }
                        .meta { margin-bottom: 32px; font-size: 14px; color: #64748b; }
                        .risk-card { border: 1px solid #e2e8f0; margin-bottom: 24px; padding: 20px; border-radius: 8px; page-break-inside: avoid; }
                        .risk-high { border-left: 4px solid #ef4444; }
                        .risk-medium { border-left: 4px solid #f59e0b; }
                        .badge { display: inline-block; padding: 4px 8px; font-size: 10px; font-weight: bold; text-transform: uppercase; border-radius: 4px; margin-bottom: 12px; }
                        .badge-high { background-color: #fee2e2; color: #b91c1c; }
                        .badge-medium { background-color: #fef3c7; color: #b45309; }
                        .ref { font-size: 12px; font-weight: bold; color: #64748b; float: right; }
                        h4 { margin: 0 0 8px 0; color: #1e293b; font-size: 14px; }
                        p { margin: 0 0 16px 0; font-size: 14px; }
                        .suggestion { background-color: #f8fafc; padding: 16px; border-left: 3px solid #6366f1; border-radius: 4px; }
                        .suggestion-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #4f46e5; margin-bottom: 8px; }
                        .suggestion p { margin: 0; color: #475569; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <img src="/branding/logo-negativo.png" alt="Mestres da Web" class="logo" />
                        <h1>Relatório de Análise de Risco</h1>
                    </div>
                    <div class="meta">
                        <strong>Papel assumido:</strong> ${role.toUpperCase()}<br/>
                        <strong>Modelo comparado:</strong> ${compareModel !== 'none' ? compareModel : 'Nenhum'}<br/>
                        <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}
                    </div>
                    
                    ${analysisResult.map(risk => `
                        <div class="risk-card risk-${risk.severity}">
                            <span class="ref">Ref: ${risk.clause}</span>
                            <span class="badge badge-${risk.severity}">Risco ${risk.severity === 'high' ? 'Alto' : 'Médio'}</span>
                            <h4>Problema Encontrado</h4>
                            <p>${risk.description}</p>
                            <div class="suggestion">
                                <div class="suggestion-title">✓ Sugestão de Alteração</div>
                                <p>${risk.suggestion}</p>
                            </div>
                        </div>
                    `).join('')}
                    <script>
                        window.onload = () => {
                            window.print();
                        };
                    </script>
                </body>
            </html>
        `;
        
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/contracts" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <BrainCircuit className="text-amber-400" /> Análise de Contratos de Terceiros
                        </h1>
                        <p className="text-sm text-slate-400">Envie um contrato que você recebeu para a IA analisar os riscos.</p>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!analysisResult ? (
                    <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">1. Forneça o Contrato</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer h-full flex flex-col items-center justify-center ${file ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'}`}>
                                        <input 
                                            type="file" 
                                            accept=".pdf,.docx" 
                                            className="hidden" 
                                            id="contract-upload"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
                                            }}
                                        />
                                        <label htmlFor="contract-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                            {file ? (
                                                <>
                                                    <FileText size={32} className="text-amber-400 mb-3" />
                                                    <p className="text-sm font-bold text-white">{file.name}</p>
                                                    <span className="text-xs text-amber-400 mt-2 hover:underline">Trocar arquivo</span>
                                                </>
                                            ) : (
                                                <>
                                                    <UploadCloud size={32} className="text-slate-500 mb-3" />
                                                    <p className="text-sm font-bold text-slate-300">Upload de PDF ou Word</p>
                                                    <p className="text-xs text-slate-500 mt-1">Clique para buscar o arquivo</p>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-center text-xs font-bold text-slate-500 mb-2 uppercase">OU</p>
                                    <textarea 
                                        value={textContext}
                                        onChange={(e) => setTextContext(e.target.value)}
                                        placeholder="Cole o texto do contrato aqui..."
                                        className="w-full h-48 p-4 bg-slate-900 border border-white/5 rounded-xl text-sm text-white resize-none focus:outline-none focus:border-amber-500/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">2. Contexto da Análise</h3>
                            <div className="space-y-4 max-w-sm">
                                <label className="text-[11px] font-bold uppercase text-slate-500">Qual o nosso papel neste contrato?</label>
                                <select 
                                    value={role}
                                    onChange={(e: any) => setRole(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white appearance-none"
                                >
                                    <option value="contratada">Nós somos a CONTRATADA (Prestador)</option>
                                    <option value="contratante">Nós somos o CONTRATANTE (Cliente)</option>
                                </select>
                                <p className="text-[10px] text-slate-500">Isso ajuda a IA a focar nos riscos que realmente importam para o seu lado da negociação.</p>
                            </div>

                            <div className="space-y-2 pt-6 border-t border-white/5 mt-6">
                                <label className="text-xs font-bold uppercase text-slate-500 block">Comparar com Modelo Interno (Opcional)</label>
                                <select value={compareModel} onChange={e => setCompareModel(e.target.value)} className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none">
                                    <option value="none">Não comparar</option>
                                    <option value="m1">Prestação de Serviços (Padrão)</option>
                                    <option value="m2">Licenciamento de Software</option>
                                    <option value="m3">Acordo de Confidencialidade (NDA)</option>
                                </select>
                                <p className="text-[10px] text-slate-500">A IA vai apontar cláusulas do contrato recebido que divergem do modelo interno selecionado.</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || (!file && !textContext)}
                                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-amber-950 rounded-xl text-sm font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                            >
                                {isAnalyzing ? <span className="w-4 h-4 border-2 border-amber-950/30 border-t-amber-950 rounded-full animate-spin" /> : <BrainCircuit size={18} />}
                                {isAnalyzing ? "Analisando com IA..." : "Iniciar Análise"}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                        <div className="flex justify-between items-center bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <ShieldAlert size={24} className="text-amber-500" />
                                <div>
                                    <h3 className="text-base font-bold text-amber-400">Análise Concluída</h3>
                                    <p className="text-xs text-amber-500/80">O relatório identificou {analysisResult.length} pontos de atenção para a sua empresa (como {role.toUpperCase()}).</p>
                                </div>
                            </div>
                            <button onClick={handleExportPDF} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                <FileDown size={14} /> Exportar PDF
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {analysisResult.map((risk, idx) => (
                                <div key={idx} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded ${risk.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            Risco {risk.severity === 'high' ? 'Alto' : 'Médio'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">Ref: {risk.clause}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white mb-2">Problema Encontrado</h4>
                                    <p className="text-sm text-slate-400 mb-4">{risk.description}</p>
                                    
                                    <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-4">
                                        <h4 className="text-[11px] font-bold uppercase text-indigo-400 mb-2 flex items-center gap-1.5"><CheckCircle2 size={12}/> Sugestão de Alteração</h4>
                                        <p className="text-sm text-slate-300">{risk.suggestion}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center pt-8">
                            <button 
                                onClick={() => { setAnalysisResult(null); setFile(null); setTextContext(""); }}
                                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
                            >
                                Fazer nova análise
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
