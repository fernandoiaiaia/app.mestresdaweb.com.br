"use client";

import { useState } from "react";
import { useSDRStore } from "@/store/sdr-store";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    MessageSquare,
    ArrowLeft,
    Mail,
    Phone,
    Search,
    Filter,
    Sparkles,
    Send,
    Pause,
    CheckCircle2,
    XCircle,
    CalendarCheck,
    X,
    Play,
    BrainCircuit,
} from "lucide-react";

const channelIcons: Record<string, any> = { email: Mail, whatsapp: MessageSquare, phone: Phone };
const channelColors: Record<string, string> = { email: "text-blue-400", whatsapp: "text-blue-400", phone: "text-blue-400" };
const tempColors: Record<string, { text: string; dot: string }> = {
    hot: { text: "text-red-400", dot: "bg-red-500" }, warm: { text: "text-amber-400", dot: "bg-amber-500" }, cold: { text: "text-blue-400", dot: "bg-blue-500" },
};

export default function InboxPage() {
    const { leads, conversations, cadences, getLeadConversation } = useSDRStore();
    const [selectedConv, setSelectedConv] = useState<string | null>(conversations[0]?.id || null);
    const [channelFilter, setChannelFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [replyChannel, setReplyChannel] = useState<"email" | "whatsapp">("email");
    const [replyText, setReplyText] = useState("");

    const filteredConversations = conversations
        .filter(c => statusFilter === "all" || c.status === statusFilter)
        .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    const conv = conversations.find(c => c.id === selectedConv);
    const lead = conv ? leads.find(l => l.id === conv.leadId) : null;
    const cad = lead?.cadenceId ? cadences.find(c => c.id === lead.cadenceId) : null;

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}min`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    return (
        <div className="h-screen flex flex-col bg-slate-950">
            {/* Top Bar */}
            <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
                <Link href="/dashboard/sdr" className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"><ArrowLeft size={18} /></Link>
                <MessageSquare size={20} className="text-indigo-400" />
                <h1 className="text-sm font-bold text-white">Inbox Unificada</h1>
                <div className="ml-auto flex gap-2">
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-1.5 outline-none">
                        <option value="all">Todas</option>
                        <option value="open">Abertas</option>
                        <option value="intervention">Intervenção</option>
                        <option value="resolved">Resolvidas</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left — Conversation List */}
                <div className="w-80 shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto">
                    {filteredConversations.map(c => {
                        const l = leads.find(x => x.id === c.leadId);
                        const lastMsg = c.messages[c.messages.length - 1];
                        const ChIcon = channelIcons[lastMsg?.channel || "email"];
                        const isSelected = c.id === selectedConv;
                        return (
                            <div key={c.id} onClick={() => setSelectedConv(c.id)} className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-slate-800/50 transition-all ${isSelected ? "bg-indigo-500/10 border-l-2 border-l-indigo-500" : "hover:bg-slate-800/50"}`}>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">{l?.name.split(" ").map(n => n[0]).join("") || "?"}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-white truncate">{l?.name || "Lead"}</span>
                                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">{formatTime(c.lastMessageAt)}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500">{l?.company}</div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <ChIcon size={10} className={channelColors[lastMsg?.channel || "email"]} />
                                        <span className="text-xs text-slate-400 truncate">{lastMsg?.content.slice(0, 50)}...</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1 shrink-0">
                                    {c.unreadCount > 0 && <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{c.unreadCount}</span>}
                                    {c.status === "intervention" && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Center — Messages */}
                <div className="flex-1 flex flex-col bg-slate-950">
                    {conv && lead ? (
                        <>
                            {/* Conversation header */}
                            <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                                <div>
                                    <h3 className="text-sm font-bold text-white">{lead.name}</h3>
                                    <p className="text-[10px] text-slate-500">{lead.role} · {lead.company}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors flex items-center gap-1"><CalendarCheck size={12} /> Agendar</button>
                                    <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1"><Pause size={12} /> Pausar</button>
                                    <button className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-blue-400 hover:bg-blue-500/10 transition-colors flex items-center gap-1"><CheckCircle2 size={12} /> Resolver</button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {conv.messages.map(msg => {
                                    const Icon = channelIcons[msg.channel];
                                    const isOutbound = msg.direction === "outbound";
                                    return (
                                        <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[70%] rounded-2xl p-4 ${isOutbound ? "bg-indigo-600/20 border border-indigo-500/20" : "bg-slate-800/60 border border-slate-700/50"}`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon size={12} className={channelColors[msg.channel]} />
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{msg.channel} · {isOutbound ? "Enviado" : "Recebido"}</span>
                                                    <span className="text-[10px] text-slate-600">{new Date(msg.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                                                </div>
                                                {msg.subject && <div className="text-xs font-bold text-indigo-400 mb-1">{msg.subject}</div>}
                                                <p className="text-sm text-slate-200 whitespace-pre-line">{msg.content}</p>
                                                {msg.metadata?.aiReasoning && (
                                                    <div className="mt-2 flex items-start gap-1.5 p-2 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                                                        <BrainCircuit size={12} className="text-purple-400 shrink-0 mt-0.5" />
                                                        <span className="text-[10px] text-purple-400">{msg.metadata.aiReasoning}</span>
                                                    </div>
                                                )}
                                                {msg.metadata?.duration && (
                                                    <div className="mt-2 text-xs text-slate-400">
                                                        ☎ {Math.floor(msg.metadata.duration / 60)}:{String(msg.metadata.duration % 60).padStart(2, "0")} min · {msg.metadata.callResult === "answered" ? "✓ Atendida" : "✗ Não atendida"}
                                                    </div>
                                                )}
                                                {msg.metadata?.opened !== undefined && (
                                                    <div className="mt-1 text-[10px] text-slate-500">
                                                        {msg.metadata.opened ? "👁 Aberto" : "— Não aberto"} {msg.metadata.clicked ? " · 🔗 Clicado" : ""}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Reply */}
                            <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex gap-1">
                                        {(["email", "whatsapp"] as const).map(ch => {
                                            const Icon = channelIcons[ch];
                                            return (
                                                <button key={ch} onClick={() => setReplyChannel(ch)} className={`p-1.5 rounded-lg transition-colors ${replyChannel === ch ? "bg-indigo-500/20 text-indigo-400" : "text-slate-500 hover:text-white"}`}>
                                                    <Icon size={14} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-400 font-bold hover:bg-purple-500/20 transition-colors">
                                        <Sparkles size={12} /> Sugestão IA
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <textarea className="flex-1 bg-slate-950 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 resize-none min-h-[60px] focus:border-indigo-500 outline-none" placeholder={`Responder via ${replyChannel}...`} value={replyText} onChange={e => setReplyText(e.target.value)} />
                                    <button className="self-end px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"><Send size={16} /></button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500">
                            <div className="text-center">
                                <MessageSquare size={48} className="mx-auto mb-4 text-slate-700" />
                                <p className="text-sm">Selecione uma conversa</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right — Lead Details */}
                {conv && lead && (
                    <div className="w-72 shrink-0 bg-slate-900 border-l border-slate-800 overflow-y-auto hidden xl:block">
                        <div className="p-4 space-y-4">
                            <div className="text-center">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 mx-auto flex items-center justify-center text-white text-lg font-bold mb-2">{lead.name.split(" ").map(n => n[0]).join("")}</div>
                                <h3 className="text-sm font-bold text-white">{lead.name}</h3>
                                <p className="text-[10px] text-slate-400">{lead.role} · {lead.company}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Score & Temperatura</div>
                                <div className="flex items-center justify-center gap-3">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">{lead.score}%</div>
                                        <div className="text-[10px] text-slate-500">Score</div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${tempColors[lead.temperature].dot}`} />
                                    <span className={`text-sm font-bold ${tempColors[lead.temperature].text}`}>
                                        {lead.temperature === "hot" ? "Quente" : lead.temperature === "warm" ? "Morno" : "Frio"}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Qualificação (BANT)</div>
                                <div className="space-y-1">
                                    {[
                                        { key: "B", label: "Budget", val: lead.qualificationData.budget },
                                        { key: "A", label: "Authority", val: lead.qualificationData.authority },
                                        { key: "N", label: "Need", val: lead.qualificationData.need },
                                        { key: "T", label: "Timeline", val: lead.qualificationData.timeline },
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                                            <span className="text-xs text-slate-300 font-medium">{item.key} — {item.label}</span>
                                            <span className={`text-xs font-bold ${item.val === true ? "text-blue-400" :
                                                    item.val === false ? "text-red-400" :
                                                        item.val ? "text-white" : "text-slate-600"
                                                }`}>
                                                {item.val === true ? "✓" : item.val === false ? "✗" : item.val || "—"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {cad && (
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cadência</div>
                                    <div className="p-2 bg-slate-800/50 rounded-lg text-xs text-slate-300">{cad.name}</div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contatos</div>
                                <div className="space-y-1 text-xs text-slate-400">
                                    {lead.email && <div className="flex items-center gap-1.5"><Mail size={12} /> {lead.email}</div>}
                                    {lead.phone && <div className="flex items-center gap-1.5"><Phone size={12} /> {lead.phone}</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
