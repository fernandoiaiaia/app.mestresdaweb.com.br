"use client";

import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    ShieldCheck,
    ArrowLeft,
    Mail,
    MessageSquare,
    Phone,
    Upload,
    Ban,
    Settings,
    Clock,
    AlertTriangle,
    FileText,
} from "lucide-react";

export default function CompliancePage() {
    const { optOuts } = useSDRStore();

    const channelIcons: Record<string, any> = { email: Mail, whatsapp: MessageSquare, phone: Phone };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <Link href="/dashboard/sdr" className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={14} /> Hub SDR</Link>
                <span>/</span><span className="text-white font-medium">Compliance</span>
            </div>

            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3"><ShieldCheck size={24} className="text-slate-400" /> Compliance & Opt-out</h1>
                <p className="text-sm text-slate-400 mt-1">Controle de consentimento, opt-outs e proteção de dados (LGPD)</p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { title: "Opt-outs Total", value: optOuts.length, icon: Ban, color: "text-red-400" },
                    { title: "E-mail", value: optOuts.filter(o => o.channel === "email").length, icon: Mail, color: "text-blue-400" },
                    { title: "WhatsApp", value: optOuts.filter(o => o.channel === "whatsapp").length, icon: MessageSquare, color: "text-blue-400" },
                    { title: "Supressão Global", value: 0, icon: ShieldCheck, color: "text-slate-400" },
                ].map((s, i) => (
                    <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5">
                        <s.icon size={16} className={`${s.color} mb-2`} />
                        <div className="text-2xl font-bold text-white">{s.value}</div>
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mt-1">{s.title}</div>
                    </motion.div>
                ))}
            </div>

            {/* Opt-out List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Ban size={14} className="text-red-400" /> Registro de Opt-outs</h3>
                </div>
                {optOuts.length === 0 ? (
                    <div className="text-center py-12 text-sm text-slate-500">Nenhum opt-out registrado</div>
                ) : (
                    <div className="divide-y divide-slate-700/30">
                        {optOuts.map(opt => {
                            const Icon = channelIcons[opt.channel] || Mail;
                            return (
                                <div key={opt.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-700/10 transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                        <Ban size={14} className="text-red-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-white">{opt.leadName}</div>
                                        <div className="text-[10px] text-slate-400">{opt.email} · {opt.phone}</div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Icon size={12} className={opt.channel === "email" ? "text-blue-400" : "text-blue-400"} />
                                        <span className="text-xs text-slate-400">{opt.channel}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 max-w-[200px] truncate hidden md:block">{opt.reason}</div>
                                    <div className="text-xs text-slate-500">{new Date(opt.date).toLocaleDateString("pt-BR")}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </motion.div>

            {/* Configuration Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Suppression List */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck size={16} className="text-slate-400" /> Lista de Supressão Global</h3>
                    <p className="text-xs text-slate-400">E-mails e telefones que nunca devem ser contactados, independente da cadência.</p>
                    <div className="p-8 border-2 border-dashed border-slate-700 rounded-xl text-center">
                        <Upload size={24} className="mx-auto mb-2 text-slate-600" />
                        <p className="text-xs text-slate-500">Arraste um CSV ou clique para importar</p>
                    </div>
                    <div className="text-[10px] text-slate-600">Formatos aceitos: .csv, .xlsx — colunas: email, telefone</div>
                </motion.div>

                {/* Email Footer */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Mail size={16} className="text-blue-400" /> Footer de Descadastro</h3>
                    <p className="text-xs text-slate-400">Texto adicionado automaticamente ao final de todos os e-mails enviados.</p>
                    <textarea className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 min-h-[80px] resize-none focus:border-slate-600 outline-none" defaultValue="Se você não deseja mais receber nossos e-mails, clique aqui para se descadastrar." />
                    <div className="flex items-center gap-2 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-xs text-blue-400 font-medium">Link de descadastro ativo em todos os e-mails</span>
                    </div>
                </motion.div>

                {/* WhatsApp Opt-out */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><MessageSquare size={16} className="text-blue-400" /> Opt-out WhatsApp</h3>
                    <p className="text-xs text-slate-400">Palavras-chave que automaticamente removem o lead da cadência.</p>
                    <div className="flex flex-wrap gap-2">
                        {["parar", "sair", "nao quero", "cancelar", "remover", "stop"].map(word => (
                            <span key={word} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-medium">"{word}"</span>
                        ))}
                    </div>
                </motion.div>

                {/* Call Recording */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Phone size={16} className="text-blue-400" /> Aviso de Gravação</h3>
                    <p className="text-xs text-slate-400">Texto reproduzido no início de cada ligação automática.</p>
                    <textarea className="bg-slate-950 border border-slate-800 text-white text-sm rounded-xl w-full px-4 py-2.5 min-h-[60px] resize-none focus:border-slate-600 outline-none" defaultValue="Esta ligação pode ser gravada para fins de qualidade e treinamento." />
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> Retenção de gravações</span>
                        <select className="bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-3 py-1.5 outline-none">
                            <option>30 dias</option>
                            <option>60 dias</option>
                            <option>90 dias</option>
                            <option>180 dias</option>
                        </select>
                    </div>
                </motion.div>
            </div>

            {/* LGPD Notice */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-400 mb-1">Aviso LGPD</h4>
                        <p className="text-xs text-slate-400">Todas as ações automatizadas são logadas (audit trail). O opt-out é instantâneo e irrevogável pelo sistema — somente o próprio lead pode solicitar reativação. Leads na lista de supressão global nunca entram em cadência.</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
