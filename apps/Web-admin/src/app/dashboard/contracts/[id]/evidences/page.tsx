"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
    ChevronLeft, ShieldCheck, Fingerprint, Globe, Monitor, 
    Clock, Hash, FileCheck, MapPin, Download, History
} from "lucide-react";

export default function ContractEvidencesPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulating load time
        const t = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(t);
    }, []);

    // Fake Evidence Data
    const hash256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    
    const signersEvidence = [
        {
            name: "Tech Inovações Ltda (Contratante)",
            email: "joao@tech.com",
            ip: "192.168.1.45",
            location: "São Paulo, SP - Brasil",
            browser: "Chrome 122.0.0 (Mac OS X)",
            signedAt: "2026-06-03 14:30:12 UTC",
            authMethod: "Token via E-mail + WhatsApp (034821)",
            documentRead: true
        },
        {
            name: "ACME Corp (Contratada)",
            email: "maria@acme.com",
            ip: "200.15.42.11",
            location: "Rio de Janeiro, RJ - Brasil",
            browser: "Safari 17.1 (iOS 17)",
            signedAt: "2026-06-03 15:45:00 UTC",
            authMethod: "Login no Sistema (Usuário Autenticado)",
            documentRead: true
        }
    ];

    const auditLogs = [
        { id: 1, user: "Administrador (Você)", action: "Criação do Rascunho", date: "01 Jun 2026, 10:15", ip: "192.168.1.10" },
        { id: 2, user: "Administrador (Você)", action: "Envio para Assinatura", date: "02 Jun 2026, 09:00", ip: "192.168.1.10" },
        { id: 3, user: "Sistema", action: "E-mail de Notificação Entregue", date: "02 Jun 2026, 09:02", ip: "Servidor AWS" },
        { id: 4, user: "Sistema", action: "Visualização do Documento (IP: 177.102...)", date: "03 Jun 2026, 14:15", ip: "Sistema" },
        { id: 5, user: "Sistema", action: "Contrato Assinado (Todos os signatários)", date: "03 Jun 2026, 14:40", ip: "Sistema" },
        { id: 6, user: "Sistema", action: "PDF Final Gerado e Disparado", date: "03 Jun 2026, 14:41", ip: "Servidor AWS" },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <span className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10 max-w-5xl mx-auto min-h-screen">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/dashboard/contracts/${resolvedParams.id}`} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors">
                    <ChevronLeft size={20} />
                </Link>
                <div className="flex-1 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                            <ShieldCheck className="text-emerald-400" /> Relatório de Evidências
                        </h1>
                        <p className="text-sm text-slate-400">Trilha de auditoria e validade jurídica do contrato.</p>
                    </div>
                    <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                        <Download size={16} /> Baixar Relatório
                    </button>
                </div>
            </div>

            {/* Document Integrity */}
            <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8 mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-6 flex items-center gap-2">
                    <FileCheck size={16} /> Integridade do Documento
                </h3>
                <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-5">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div>
                            <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Status</span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-400">
                                <ShieldCheck size={14}/> Arquivo Íntegro
                            </span>
                        </div>
                        <div className="flex-1">
                            <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1"><Hash size={12}/> Hash SHA-256 (Identificador Único)</span>
                            <p className="text-xs md:text-sm font-mono text-emerald-400 break-all bg-emerald-950/30 p-2 rounded border border-emerald-500/10">
                                {hash256}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Signers Evidences */}
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 mt-8">Evidências por Assinante</h3>
            
            <div className="space-y-6">
                {signersEvidence.map((signer, idx) => (
                    <div key={idx} className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.06]">
                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center">
                                <Fingerprint size={20} />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-white">{signer.name}</h4>
                                <p className="text-xs text-slate-400">{signer.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                            <div className="flex gap-3">
                                <Globe size={18} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Endereço IP</span>
                                    <p className="text-sm text-slate-300 font-mono">{signer.ip}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <MapPin size={18} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Localização Aproximada</span>
                                    <p className="text-sm text-slate-300">{signer.location}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Monitor size={18} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Dispositivo e Navegador</span>
                                    <p className="text-sm text-slate-300">{signer.browser}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Clock size={18} className="text-slate-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Data e Hora (UTC)</span>
                                    <p className="text-sm text-slate-300 font-mono">{signer.signedAt}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 md:col-span-2 bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Autenticação e Leitura</span>
                                    <p className="text-sm text-slate-300">
                                        Assinado via <strong className="text-white">{signer.authMethod}</strong>. O sistema registrou que o usuário <strong className="text-emerald-400">visualizou o documento por completo</strong> antes de aplicar a assinatura eletrônica.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Log de Auditoria Interna */}
                <div className="bg-slate-800/40 border border-white/[0.06] rounded-2xl p-6 md:p-8 mt-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <History size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Log de Auditoria Interna</h3>
                            <p className="text-sm text-slate-400">Rastreabilidade completa de ações realizadas neste contrato dentro do sistema.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="text-xs uppercase bg-slate-900/50 text-slate-500 font-bold border-y border-white/5">
                                <tr>
                                    <th className="px-4 py-3">Data e Hora</th>
                                    <th className="px-4 py-3">Usuário / Ator</th>
                                    <th className="px-4 py-3">Ação Realizada</th>
                                    <th className="px-4 py-3">IP Origem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 font-mono text-xs">{log.date}</td>
                                        <td className="px-4 py-3 text-white">{log.user}</td>
                                        <td className="px-4 py-3">{log.action}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{log.ip}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
